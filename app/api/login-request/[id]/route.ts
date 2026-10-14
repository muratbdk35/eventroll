import { NextResponse } from "next/server";
import { claimLoginRequest } from "@/lib/login-requests";
import { clientIp, rateLimit } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

/** Polled by the waiting tab; once approved returns a one-time sign-in URL. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!/^[A-Za-z0-9]{32}$/.test(id)) {
    return NextResponse.json({ status: "expired" });
  }
  // Polling every few seconds for 15 minutes stays well under this.
  if (!(await rateLimit("login-poll", clientIp(req.headers), 600, "15 m"))) {
    return NextResponse.json({ status: "pending" }, { status: 429 });
  }
  const result = await claimLoginRequest(id, new URL(req.url).origin);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
