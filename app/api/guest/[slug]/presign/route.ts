import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventBySlug } from "@/lib/events/queries";
import { getGuestSession } from "@/lib/guest/session";
import {
  createPendingUploads,
  fingerprint,
  uploadDenial,
} from "@/lib/guest/uploads";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { ALLOWED_MIME, MAX_FILE_BYTES, MAX_THUMB_BYTES } from "@/lib/uploads";

const bodySchema = z.object({
  uploaderName: z.string().trim().max(60).optional(),
  files: z
    .array(
      z.object({
        type: z.enum(ALLOWED_MIME),
        size: z.number().int().min(1).max(MAX_FILE_BYTES),
        thumbSize: z.number().int().min(1).max(MAX_THUMB_BYTES).optional(),
      }),
    )
    .min(1)
    .max(20),
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
  if (event.requireName && !parsed.data.uploaderName) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const allowed =
    (await rateLimit("presign-device", guest.deviceId, 120, "1 m")) &&
    (await rateLimit("presign-ip", ip, 600, "10 m"));
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const denial = uploadDenial(event, guest.deviceId);
  if (denial) return NextResponse.json({ error: denial }, { status: 403 });

  const result = await createPendingUploads({
    event,
    deviceId: guest.deviceId,
    fingerprint: fingerprint(ip, req.headers.get("user-agent") ?? ""),
    uploaderName: parsed.data.uploaderName || null,
    files: parsed.data.files,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({ uploads: result.uploads });
}
