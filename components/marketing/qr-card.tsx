import QRCode from "qrcode";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/public-env";

/** A real, scannable QR code rendered at build time (high error correction). */
export async function QrCard({ className }: { className?: string }) {
  const t = await getTranslations("Landing.hero");
  const svg = await QRCode.toString(publicEnv.appUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#2b211cff", light: "#00000000" },
  });
  return (
    <div className={className}>
      <div className="w-36 rounded-2xl bg-white p-3 shadow-[0_20px_40px_-18px_rgb(60_30_10/0.5)] ring-1 ring-black/5">
        <div
          className="aspect-square"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-2 text-center text-[11px] font-semibold tracking-wide text-[oklch(0.35_0.03_40)]">
          {t("qrLabel")}
        </p>
      </div>
    </div>
  );
}
