/**
 * File names inside album ZIPs, built in the host's browser so times are in
 * the host's own time zone. Sorting the names sorts the photos by upload time:
 * "2026-06-14 21.31 - Selin - 0042.jpg".
 */

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Characters that break on Windows/macOS file systems or in ZIP tools. */
function clean(name: string): string {
  return name
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

export function photoFileName(
  p: { createdAt: string; uploaderName: string | null; ext: string },
  seq: number,
  anonymous: string,
): string {
  const d = new Date(p.createdAt);
  const when = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}`;
  const who = clean(p.uploaderName ?? "") || anonymous;
  return `${when} - ${who} - ${pad(seq, 4)}.${p.ext}`;
}

/** "Elif & Can" → "Elif & Can - photos.zip"; part numbers when split. */
export function zipFileName(
  base: string,
  part?: { n: number; of: number },
): string {
  const b = clean(base) || "album";
  return part && part.of > 1
    ? `${b} (${part.n} of ${part.of}).zip`
    : `${b}.zip`;
}

/**
 * Splits files into consecutive parts of at most `limit` bytes each (a single
 * file larger than the limit gets a part of its own).
 */
export function splitParts<T extends { bytes: number }>(
  files: T[],
  limit: number,
): T[][] {
  const parts: T[][] = [];
  let cur: T[] = [];
  let size = 0;
  for (const f of files) {
    if (cur.length && size + f.bytes > limit) {
      parts.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(f);
    size += f.bytes;
  }
  if (cur.length) parts.push(cur);
  return parts;
}
