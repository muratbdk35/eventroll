import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getOwnedEvent, listDownloadMedia } from "@/lib/events/queries";
import { presignGet } from "@/lib/storage";
import { extFor, isAllowedMime } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

const body = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.uuid()).min(1).max(5000) }),
  z.object({ uploader: z.string().max(60).nullable() }),
]);

/** Links stay valid long enough for a multi-GB album on slow Wi-Fi. */
const TTL = 6 * 60 * 60;

/**
 * Owner-only list of originals to download (all, picked ids, or one guest),
 * with fresh signed links. The ZIP itself is built in the host's browser
 * (DECISIONS #23, #39).
 */
export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });
  const event = await getOwnedEvent((await params).id, session.user.id);
  if (!event) return new NextResponse(null, { status: 404 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const q = parsed.data;
  // Photos the host keeps hidden (#56) are never downloaded by accident.
  const rows = await listDownloadMedia(event.id, {
    ...("ids" in q
      ? { ids: q.ids }
      : "uploader" in q
        ? { uploader: q.uploader }
        : {}),
    hideFlagged: event.hideFlagged,
  });

  const files = await Promise.all(
    rows.map(async (m) => ({
      id: m.id,
      url: await presignGet(m.r2Key, { ttl: TTL }),
      bytes: m.bytes,
      ext: isAllowedMime(m.mime) ? extFor(m.mime) : "jpg",
      uploaderName: m.uploaderName,
      createdAt: m.createdAt.toISOString(),
    })),
  );
  return NextResponse.json(
    { eventName: event.name, files },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
