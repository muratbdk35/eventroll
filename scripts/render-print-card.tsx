/**
 * Renders the landing page's picture of the QR templates (one table card per
 * language) with the real template code: public/marketing/print-card-<l>.png.
 * Run after changing lib/print/sheet.tsx:  npx tsx scripts/render-print-card.tsx
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { SingleCard } from "../lib/print/sheet";

const root = process.cwd();
const font = (file: string) => {
  const b = readFileSync(join(root, "assets/fonts", file));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};
const fonts = [
  { name: "Fraunces", data: font("fraunces-600.ttf"), weight: 600 as const },
  { name: "Fraunces", data: font("fraunces-700.ttf"), weight: 700 as const },
  { name: "Schibsted", data: font("schibsted-500.ttf"), weight: 500 as const },
  { name: "Schibsted", data: font("schibsted-700.ttf"), weight: 700 as const },
  { name: "Geist Mono", data: font("geist-mono-700.ttf"), weight: 700 as const },
].map((f) => ({ ...f, style: "normal" as const }));

const dates = { tr: "14 Haziran 2026", en: "June 14, 2026", de: "14. Juni 2026" };

async function main() {
  const qrSvg = await QRCode.toString("https://eventroll.eu/e/k7Qm9xZ2pA", {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#141b26", light: "#ffffff" },
  });
  for (const locale of ["tr", "en", "de"] as const) {
    const m = JSON.parse(
      readFileSync(join(root, `messages/${locale}.json`), "utf8"),
    ).Events.print;
    const width = 760;
    const res = new ImageResponse(
      SingleCard({
        template: "cards",
        color: "powder",
        paper: false,
        qrSvg,
        width,
        text: {
          eventName: "Elif & Can",
          date: dates[locale].toLocaleUpperCase(locale),
          year: "2026",
          headline: m.headlineDefault,
          subline: m.subline,
          steps: [m.step1, m.step2, m.step3],
          noApp: m.noApp,
          stubLabel: String(m.stubLabel).toLocaleUpperCase(locale),
          cutHint: m.cutHint,
          foldHint: m.foldHint,
        },
      }),
      { width, height: Math.round((width / 95) * 138), fonts },
    );
    const out = join(root, `public/marketing/print-card-${locale}.png`);
    writeFileSync(out, Buffer.from(await res.arrayBuffer()));
    console.log("wrote", out);
  }
}

void main();
