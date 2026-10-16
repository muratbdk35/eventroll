import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Static TTF instances of the site's fonts (SIL OFL, from Google Fonts), for
// next/og, which can't read woff2. Bundled with the route via
// outputFileTracingIncludes in next.config.ts.
const dir = join(process.cwd(), "assets/fonts");

let cache: Promise<
  {
    name: string;
    data: ArrayBuffer;
    weight: 500 | 600 | 700;
    style: "normal";
  }[]
> | null = null;

export function printFonts() {
  cache ??= Promise.all(
    (
      [
        ["Fraunces", "fraunces-600.ttf", 600],
        ["Fraunces", "fraunces-700.ttf", 700],
        ["Schibsted", "schibsted-500.ttf", 500],
        ["Schibsted", "schibsted-700.ttf", 700],
        ["Geist Mono", "geist-mono-700.ttf", 700],
      ] as const
    ).map(async ([name, file, weight]) => {
      const buf = await readFile(join(dir, file));
      return {
        name,
        data: buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength,
        ) as ArrayBuffer,
        weight,
        style: "normal" as const,
      };
    }),
  );
  return cache;
}
