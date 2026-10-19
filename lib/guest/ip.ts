import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Uploader IP addresses, encrypted (DECISIONS #58). Kept with the photo only
 * so we can answer a legal request from the authorities, for example after a
 * report of illegal content; never shown in the app. AES-256-GCM with
 * IP_ENCRYPTION_KEY (32 bytes, base64); without a key nothing is stored.
 * Format: "v1:<iv>:<ciphertext+tag>", base64url parts.
 */

function key(b64: string | undefined): Buffer | null {
  if (!b64) return null;
  const k = Buffer.from(b64, "base64");
  return k.length === 32 ? k : null;
}

export function encryptIp(ip: string, keyB64: string | undefined) {
  const k = key(keyB64);
  if (!k || !ip) return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([c.update(ip, "utf8"), c.final(), c.getAuthTag()]);
  return `v1:${iv.toString("base64url")}:${ct.toString("base64url")}`;
}

export function decryptIp(blob: string, keyB64: string | undefined) {
  const k = key(keyB64);
  const [v, ivB64, ctB64] = blob.split(":");
  if (!k || v !== "v1" || !ivB64 || !ctB64) return null;
  const ct = Buffer.from(ctB64, "base64url");
  const d = createDecipheriv("aes-256-gcm", k, Buffer.from(ivB64, "base64url"));
  d.setAuthTag(ct.subarray(ct.length - 16));
  try {
    return Buffer.concat([
      d.update(ct.subarray(0, ct.length - 16)),
      d.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
