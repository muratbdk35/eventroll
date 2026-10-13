import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l/i)

function randomSuffix(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** URL-safe slug: readable ASCII prefix from the name + unguessable suffix. */
export function generateSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/g, "");
  const suffix = randomSuffix(6);
  return base ? `${base}-${suffix}` : suffix;
}
