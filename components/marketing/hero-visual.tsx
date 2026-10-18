import { PhoneGallery } from "./phone-gallery";
import { AppPreview, PrintPreview } from "./app-previews";

export function HeroVisual() {
  return (
    <div className="relative mx-auto flex w-full max-w-[560px] justify-center py-6">
      <div className="relative z-10">
        <PhoneGallery />
      </div>

      {/* A real printed table card (Pro and VIP templates). */}
      <AppPreview
        width={210}
        scale={0.78}
        className="absolute -start-2 bottom-0 z-20 hidden -rotate-[5deg] md:block lg:-start-8"
      >
        <PrintPreview />
      </AppPreview>
    </div>
  );
}
