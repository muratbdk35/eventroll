import Image from "next/image";

/**
 * A strip of 35 mm film across the page: sprocket holes, frame numbers on the
 * edge, guests' photos in the frames. On load the frames develop one after
 * another (pale, then full colour), like prints in a darkroom tray.
 */
const frames = [
  "arch-night.jpg",
  "toast.jpg",
  "dance-floor.jpg",
  "cake.jpg",
  "sparklers.jpg",
  "couple-ribbons.jpg",
  "table-toast.jpg",
  "confetti.jpg",
  "rings.jpg",
];

function Sprockets() {
  return (
    <div
      aria-hidden
      className="h-3.5 bg-[repeating-linear-gradient(90deg,transparent_0_9px,oklch(0.96_0.006_245)_9px_19px,transparent_19px_28px)] [mask-image:linear-gradient(transparent_3px,black_3px,black_11px,transparent_11px)]"
    />
  );
}

export function FilmStrip() {
  return (
    <div aria-hidden className="relative -mx-2 -rotate-[1.2deg] select-none">
      <div className="bg-[oklch(0.2_0.02_245)] py-1.5 shadow-[0_30px_60px_-30px_rgb(20_35_60/0.6)]">
        <Sprockets />
        <div className="flex gap-2.5 overflow-hidden px-2.5 py-1.5">
          {frames.map((f, i) => (
            <div key={f} className="relative shrink-0">
              <div
                className="develop relative h-36 w-52 overflow-hidden rounded-[3px] bg-[oklch(0.3_0.02_245)] sm:h-44 sm:w-64"
                style={{ animationDelay: `${300 + i * 140}ms` }}
              >
                <Image
                  src={`/marketing/${f}`}
                  alt=""
                  fill
                  sizes="260px"
                  className="object-cover"
                />
              </div>
              <span className="absolute start-1 -bottom-[1.05rem] text-[10px] font-semibold tracking-wide text-[oklch(0.78_0.09_70)] tabular-nums">
                {14 + i}
              </span>
            </div>
          ))}
        </div>
        <Sprockets />
      </div>
    </div>
  );
}
