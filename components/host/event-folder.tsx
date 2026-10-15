import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { StatusPill } from "./status-pill";

type Status = React.ComponentProps<typeof StatusPill>["status"];

/*
 * Shapes from Glassmorphism Folder Cards (Kedhareswer Naidu, MIT): the back
 * panel with its tab on the right, the front with its tab on the left.
 */
const BACK_PATH =
  "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
const FRONT_PATH =
  "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 176A22 22 0 0 1 318 198L22 198A22 22 0 0 1 0 176Z";

const MAX_VISIBLE = 3;
/** Small fixed offsets so the prints don't sit perfectly square. */
const JITTER = [
  [-3, -1.2],
  [4, 1],
  [-1, -0.4],
] as const;

/** Where a print sits in the fan: -1 … 1 across the stack, 0 for one. */
function fanSlot(index: number, count: number) {
  return count <= 1 ? 0 : (index / (count - 1)) * 2 - 1;
}

/**
 * One event on the dashboard as a folder (DECISIONS #43): its newest photos
 * are prints in the pocket, the paper front carries the name, date and
 * status. Hover or focus leans the front forward and lifts the prints; on a
 * phone they already peek out. Pure CSS, so it renders on the server.
 */
export function EventFolder({
  href,
  name,
  status,
  statusLabel,
  meta,
  srcs,
}: {
  href: string;
  name: string;
  status: Status;
  statusLabel: string;
  meta: string;
  /** Newest first. */
  srcs: string[];
}) {
  // Newest at the front of the stack, nearest the paper.
  const prints: (string | null)[] = srcs.length
    ? srcs.slice(0, MAX_VISIBLE).reverse()
    : [null, null];

  return (
    <Link href={href} className="ef-root">
      <div className="ef-stage">
        <div className="ef-shadow" aria-hidden />
        <svg
          className="ef-back"
          viewBox="0 0 340 272"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="ef-back" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7d9fc2" />
              <stop offset="1" stopColor="#4d7399" />
            </linearGradient>
          </defs>
          <path
            d={BACK_PATH}
            fill="url(#ef-back)"
            stroke="rgb(255 255 255 / 0.35)"
          />
        </svg>

        <div className="ef-files" aria-hidden>
          {prints.map((src, v) => (
            <div
              key={v}
              className="ef-sheet"
              style={
                {
                  "--slot": fanSlot(v, prints.length),
                  "--depth": prints.length - 1 - v,
                  "--jx": JITTER[v][0],
                  "--jr": `${JITTER[v][1]}deg`,
                  zIndex: v + 1,
                } as React.CSSProperties
              }
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                <img src={src} alt="" loading="lazy" decoding="async" />
              ) : (
                <span className="ef-blank">
                  <i style={{ width: "62%" }} />
                  <i style={{ width: "88%" }} />
                  <i style={{ width: "76%" }} />
                  <i style={{ width: "40%" }} />
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="ef-front">
          <svg
            className="ef-front-shape"
            viewBox="0 0 340 198"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={FRONT_PATH}
              fill="var(--card)"
              stroke="oklch(0.53 0.075 245 / 0.18)"
            />
          </svg>
          <StatusPill
            status={status}
            label={statusLabel}
            className={cn("ef-status", "bg-card shadow-xs ring-1 ring-black/5")}
          />
          <div className="ef-label">
            <span className="ef-title">{name}</span>
            <span className="ef-meta">{meta}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
