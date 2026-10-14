import "server-only";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Turnstile/PIN proof stays valid this long; the device id itself lasts a year. */
const SESSION_MS = 12 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function secret(): string {
  return env.FINGERPRINT_SALT ?? env.BETTER_AUTH_SECRET;
}

function sign(eventId: string, deviceId: string, verifiedAt: number): string {
  return createHmac("sha256", secret())
    .update(`${eventId}|${deviceId}|${verifiedAt}`)
    .digest("base64url");
}

export function guestCookieName(eventId: string): string {
  return `erg_${eventId.slice(0, 8)}`;
}

export type GuestSession = {
  deviceId: string;
  /** True while the Turnstile/PIN proof is fresh. */
  verified: boolean;
};

export function parseGuestCookie(
  eventId: string,
  value: string | undefined,
  now = Date.now(),
): GuestSession | null {
  if (!value) return null;
  const [deviceId, at, sig] = value.split(".");
  const verifiedAt = Number(at);
  if (!deviceId || !sig || !Number.isFinite(verifiedAt)) return null;
  const expected = sign(eventId, deviceId, verifiedAt);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { deviceId, verified: now - verifiedAt < SESSION_MS };
}

export async function getGuestSession(
  eventId: string,
): Promise<GuestSession | null> {
  const jar = await cookies();
  return parseGuestCookie(eventId, jar.get(guestCookieName(eventId))?.value);
}

/** Issues (or refreshes) the signed, event-scoped device cookie. */
export async function issueGuestSession(
  eventId: string,
): Promise<GuestSession> {
  const jar = await cookies();
  const existing = parseGuestCookie(
    eventId,
    jar.get(guestCookieName(eventId))?.value,
  );
  const deviceId = existing?.deviceId ?? randomBytes(16).toString("base64url");
  const now = Date.now();
  jar.set(
    guestCookieName(eventId),
    `${deviceId}.${now}.${sign(eventId, deviceId, now)}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    },
  );
  return { deviceId, verified: true };
}

// ── PIN hashing (scrypt) ────────────────────────────────────────────────
function scryptAsync(pin: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(pin, salt, 32, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(pin, salt);
  return `${salt.toString("base64url")}.${key.toString("base64url")}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(".");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "base64url");
  const actual = await scryptAsync(pin, Buffer.from(salt, "base64url"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
