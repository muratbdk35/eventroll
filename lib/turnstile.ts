import "server-only";
import { env, isProduction } from "@/lib/env";

// Cloudflare's documented always-pass test secret, used only outside production.
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export function turnstileSecret(): string | undefined {
  return env.TURNSTILE_SECRET_KEY ?? (isProduction ? undefined : TEST_SECRET);
}

/** Verifies a Turnstile token server-side. Fails closed. */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string,
): Promise<boolean> {
  const secret = turnstileSecret();
  if (!secret || !token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: token,
          ...(ip && ip !== "unknown" ? { remoteip: ip } : {}),
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
