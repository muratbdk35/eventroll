import { generateRandomString } from "better-auth/crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { devLoginEnabled } from "@/lib/dev";

/**
 * DEV ONLY: signs in as a demo host so the app can be explored without email.
 * Only works with the local PGlite database outside production (lib/dev.ts).
 * It mints a normal magic-link token and sends the browser through the regular
 * verification endpoint, so the session is created the usual way.
 */
export async function GET(req: Request) {
  if (!devLoginEnabled) return new NextResponse(null, { status: 404 });

  const url = new URL(req.url);
  const locale = ["en", "tr", "de"].includes(
    url.searchParams.get("locale") ?? "",
  )
    ? url.searchParams.get("locale")
    : "en";
  const token = generateRandomString(32, "a-z", "A-Z");
  const ctx = await auth.$context;
  await ctx.internalAdapter.createVerificationValue({
    identifier: `magic-link:${token}`,
    value: JSON.stringify({
      type: "magic-link",
      email: "demo@eventroll.local",
      name: "Demo Host",
    }),
    expiresAt: new Date(Date.now() + 60_000),
  });

  const verify = new URL("/api/auth/magic-link/verify", url.origin);
  verify.searchParams.set("token", token);
  // Same-site paths only, so this cannot become an open redirect.
  const next = url.searchParams.get("next");
  const safeNext =
    next && next.startsWith(`/${locale}/`) && !next.startsWith("//")
      ? next
      : `/${locale}/dashboard`;
  verify.searchParams.set("callbackURL", safeNext);
  return NextResponse.redirect(verify);
}
