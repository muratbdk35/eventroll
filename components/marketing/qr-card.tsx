import QRCode from "qrcode";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/public-env";
import { cn } from "@/lib/utils";

/** A small printed "table card" with a real, scannable QR code. */
export async function QrCard({ className }: { className?: string }) {
  const t = await getTranslations("Landing.demo");
  const svg = await QRCode.toString(publicEnv.appUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: { dark: "#2b211cff", light: "#00000000" },
  });
  return (
    <div
      className={cn(
        "w-40 rounded-2xl bg-[#fffaf4] p-4 text-center shadow-[0_24px_50px_-20px_rgb(60_30_10/0.55)] ring-1 ring-black/5",
        className,
      )}
    >
      <p className="font-heading text-sm leading-tight font-bold text-[#2b211c]">
        {t("qrTitle")}
      </p>
      <div
        className="mx-auto mt-3 aspect-square w-24"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 text-[9px] font-semibold tracking-[0.12em] whitespace-nowrap text-[#8a6f62] uppercase">
        {t("qrBody")}
      </p>
    </div>
  );
}
