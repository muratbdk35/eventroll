import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Static TTF instances of the site's fonts (SIL OFL, from Google Fonts), for
// next/og, which can't read woff2. Bundled with the route via
// outputFileTracingIncludes in next.config.ts.
const dir = join(process.cwd(), "assets/fonts");

type Style = "normal" | "italic";
type Weight = 500 | 600 | 700;

const files: { name: string; file: string; weight: Weight; style: Style }[] = [
  { name: "Fraunces", file: "fraunces-600.ttf", weight: 600, style: "normal" },
  { name: "Fraunces", file: "fraunces-700.ttf", weight: 700, style: "normal" },
  {
    name: "Fraunces",
    file: "fraunces-italic-500.ttf",
    weight: 500,
    style: "italic",
  },
  {
    name: "Schibsted",
    file: "schibsted-500.ttf",
    weight: 500,
    style: "normal",
  },
  {
    name: "Schibsted",
    file: "schibsted-700.ttf",
    weight: 700,
    style: "normal",
  },
  {
    name: "Geist Mono",
    file: "geist-mono-700.ttf",
    weight: 700,
    style: "normal",
  },
];

let cache: Promise<
  { name: string; data: ArrayBuffer; weight: Weight; style: Style }[]
> | null = null;

export function printFonts() {
  cache ??= Promise.all(
    files.map(async ({ name, file, weight, style }) => {
      const buf = await readFile(join(dir, file));
      return {
        name,
        data: buf.buffer.slice(
          buf.byteOffset,
          buf.byteOffset + buf.byteLength,
        ) as ArrayBuffer,
        weight,
        style,
      };
    }),
  );
  return cache;
}
