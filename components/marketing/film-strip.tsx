import Image from "next/image";

/**
 * A strip of 35 mm film across the page: rounded sprocket holes, guests'
 * photos in the frames. On load the frames develop one after another (pale,
 * then full colour), like prints in a darkroom tray. Straight, edge to edge.
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

/** One sprocket hole per 24 px, drawn as SVG so the edges stay crisp. */
const holes = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12"><rect x="7" y="2" width="10" height="8" rx="2" fill="#f4f7fb"/></svg>',
)}")`;

function Sprockets() {
  return (
    <div
      aria-hidden
      className="h-3 bg-repeat-x"
      style={{ backgroundImage: holes, backgroundSize: "24px 12px" }}
    />
  );
}

export function FilmStrip() {
  return (
    <div
      aria-hidden
      className="relative bg-[oklch(0.19_0.02_245)] py-2 select-none"
    >
      <Sprockets />
      <div className="flex gap-3 overflow-hidden px-3 py-2">
        {frames.map((f, i) => (
          <div
            key={f}
            className="develop relative h-36 w-52 shrink-0 overflow-hidden rounded-[2px] bg-[oklch(0.28_0.02_245)] sm:h-44 sm:w-64"
            style={{ animationDelay: `${300 + i * 140}ms` }}
          >
            <Image
              src={`/marketing/${f}`}
              alt=""
              fill
              sizes="(min-width: 640px) 256px, 208px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <Sprockets />
    </div>
  );
}
