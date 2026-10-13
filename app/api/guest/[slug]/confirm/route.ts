import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventBySlug } from "@/lib/events/queries";
import { getGuestSession } from "@/lib/guest/session";
import { confirmUpload, uploadDenial } from "@/lib/guest/uploads";

const bodySchema = z.object({
  mediaId: z.uuid(),
  width: z.number().int().min(1).max(100_000).optional(),
  height: z.number().int().min(1).max(100_000).optional(),
});

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const event = await getEventBySlug((await params).slug);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const guest = await getGuestSession(event.id);
  if (!guest?.verified) {
    return NextResponse.json({ error: "unverified" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  // The upload window is checked at presign; a confirm that straddles the close
  // time is still honoured, but a blocked/suspended/expired event is not.
  const denial = uploadDenial(event, guest.deviceId);
  if (denial && denial !== "closed") {
    return NextResponse.json({ error: denial }, { status: 403 });
  }

  const result = await confirmUpload({
    event,
    deviceId: guest.deviceId,
    ...parsed.data,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: result.reason === "not_found" ? 404 : 409 },
    );
  }
  return NextResponse.json({ ok: true });
}
