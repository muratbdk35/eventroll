import { Camera, CheckCircle2, ImagePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

// A looping, CSS-only mock of the guest upload page (spec §12: no heavy video).
const rows = [
  {
    file: "IMG_2041.HEIC",
    tone: "from-[oklch(0.82_0.09_60)] to-[oklch(0.68_0.13_35)]",
  },
  {
    file: "IMG_2042.JPG",
    tone: "from-[oklch(0.85_0.06_150)] to-[oklch(0.65_0.09_170)]",
  },
  {
    file: "VID_0193.MOV",
    tone: "from-[oklch(0.84_0.07_300)] to-[oklch(0.62_0.12_320)]",
  },
];

export async function PhoneDemo() {
  const t = await getTranslations("Landing.demo");
  return (
    <div
      aria-hidden
      className="relative w-[248px] shrink-0 rounded-[2.6rem] border-[7px] border-[oklch(0.25_0.02_40)] bg-background shadow-[0_40px_80px_-30px_rgb(70_30_10/0.55)] sm:w-[268px]"
    >
      <div className="absolute start-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[oklch(0.25_0.02_40)] rtl:translate-x-1/2" />
      <div className="relative overflow-hidden rounded-[2.1rem] bg-background pb-5">
        <div className="relative h-32 bg-gradient-to-br from-[oklch(0.8_0.1_55)] via-[oklch(0.7_0.14_40)] to-[oklch(0.55_0.15_30)] px-4 pt-10 text-white">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase opacity-85">
            {t("date")}
          </p>
          <p className="mt-1 font-heading text-xl leading-tight font-bold">
            {t("eventName")}
          </p>
          <svg
            className="absolute -end-3 -bottom-4 size-24 opacity-25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
          </svg>
        </div>
        <div className="space-y-3 px-4 pt-4">
          <p className="text-[12px] leading-snug text-muted-foreground">
            {t("intro")}
          </p>
          <div className="demo-press flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-primary-foreground shadow-sm">
            <ImagePlus className="size-4" />
            {t("button")}
          </div>
          <div className="flex h-9 items-center rounded-lg border border-input px-3 text-[11px] text-muted-foreground">
            {t("namePlaceholder")}
          </div>
          <ul className="space-y-2 pt-1">
            {rows.map((r, i) => (
              <li key={r.file} className="flex items-center gap-2.5">
                <span
                  className={`size-8 shrink-0 rounded-md bg-gradient-to-br ${r.tone}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="truncate font-medium">{r.file}</span>
                    <CheckCircle2
                      className="demo-check size-3 text-success"
                      style={{ animationDelay: `${i * 0.35}s` }}
                    />
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="demo-progress h-full rounded-full bg-primary"
                      style={{ animationDelay: `${i * 0.35}s` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="demo-toast absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl bg-[oklch(0.25_0.02_40)] px-3 py-2.5 text-[11px] font-medium text-white shadow-lg">
          <CheckCircle2 className="size-4 text-[oklch(0.8_0.15_150)]" />
          {t("toast")}
        </div>
      </div>
      <div className="absolute -start-4 top-24 hidden items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold shadow-md ring-1 ring-border sm:flex">
        <Camera className="size-3.5 text-primary" />
        {t("badge")}
      </div>
    </div>
  );
}
