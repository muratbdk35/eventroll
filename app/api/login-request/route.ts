import { NextResponse } from "next/server";
import { z } from "zod";
import { routing } from "@/lib/i18n/routing";
import { createLoginRequest, safeNext } from "@/lib/login-requests";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const body = z.object({
  email: z.email(),
  next: z.string().max(500),
  locale: z.enum(routing.locales),
});

/** Opens a cross-device login request for the tab that asks for a link. */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!(await rateLimit("login-request", ip, 10, "10 m"))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { email, next, locale } = parsed.data;
  const id = await createLoginRequest(email, safeNext(next, locale));
  return NextResponse.json({ id });
}
