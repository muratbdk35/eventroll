import { NextResponse } from "next/server";
import { z } from "zod";
import { getEventBySlug } from "@/lib/events/queries";
import {
  getGuestSession,
  issueGuestSession,
  verifyPin,
} from "@/lib/guest/session";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";

const bodySchema = z.object({
  token: z.string().min(1).max(4096),
  pin: z.string().max(16).optional(),
});

type Ctx = { params: Promise<{ slug: string }> };

/** Turnstile (+ PIN) gate. On success a signed, event-scoped device cookie is set. */
export async function POST(req: Request, { params }: Ctx) {
  const ip = clientIp(req.headers);
  const event = await getEventBySlug((await params).slug);
  if (!event || event.status === "deleted") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!(await rateLimit("guest-session", ip, 30, "10 m"))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (event.accessPinHash) {
    // Brute-force guard for the 4–8 digit PIN, keyed by IP and by event.
    const ok =
      (await rateLimit("pin-ip", `${ip}:${event.id}`, 8, "10 m")) &&
      (await rateLimit("pin-event", event.id, 200, "10 m"));
    if (!ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    const pinOk =
      parsed.data.pin !== undefined &&
      (await verifyPin(parsed.data.pin, event.accessPinHash));
    if (!pinOk) {
      return NextResponse.json({ error: "wrong_pin" }, { status: 401 });
    }
  }

  if (!(await verifyTurnstile(parsed.data.token, ip))) {
    return NextResponse.json({ error: "captcha" }, { status: 403 });
  }

  const guest = await issueGuestSession(event.id);
  return NextResponse.json({
    ok: true,
    blocked: event.blockedDeviceIds.includes(guest.deviceId),
  });
}

/** Whether the caller already holds a fresh proof (so the page can skip the gate). */
export async function GET(_req: Request, { params }: Ctx) {
  const event = await getEventBySlug((await params).slug);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const guest = await getGuestSession(event.id);
  return NextResponse.json({ verified: guest?.verified ?? false });
}
