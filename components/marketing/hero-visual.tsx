import { PhoneGallery } from "./phone-gallery";
import QRCode from "qrcode";
import { publicEnv } from "@/lib/public-env";
import { AppPreview, PrintPreview } from "./app-previews";

export async function HeroVisual() {
  const qrSvg = await QRCode.toString(`${publicEnv.appUrl}/e/k7Qm9xZ2pA`, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
  });
  return (
    <div className="relative mx-auto flex w-full max-w-[560px] justify-center py-6">
      <div className="relative z-10">
        <PhoneGallery />
      </div>

      {/* A real printed table card (Premium templates). */}
      <AppPreview
        width={210}
        scale={0.78}
        className="absolute -start-2 bottom-0 z-20 hidden -rotate-[5deg] md:block lg:-start-8"
      >
        <PrintPreview
          qr={`data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`}
        />
      </AppPreview>
    </div>
  );
}
