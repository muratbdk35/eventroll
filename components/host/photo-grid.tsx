"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Flag,
  ImageIcon,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approvePhoto,
  blockDevice,
  deletePhoto,
  reportPhoto,
} from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePhotoSelection } from "./photo-downloads";

// Adapted from the 21st.dev "Masonry Lightbox" (ayushmxxn): masonry columns at
// the photos' real proportions, fade-in entrance (no blur filter: too heavy on
// phones), hover lift with caption, and a shared-element (layoutId) spring
// into the viewer.

export type GridPhoto = {
  id: string;
  src: string;
  full: string;
  /** Signed link that downloads the original under a readable name. */
  download: string;
  bytes: number;
  uploaderName: string | null;
  canBlock: boolean;
  /** Flagged by the explicit-image check: blurred until the host looks (#52). */
  flagged?: boolean;
  createdAt: string;
  width: number | null;
  height: number | null;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const noop = () => () => {};
const WIDE = "(min-width: 640px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const isWide = () => window.matchMedia(WIDE).matches;

export function PhotoGrid({
  eventId,
  photos,
  published,
}: {
  eventId: string;
  photos: GridPhoto[];
  published: boolean;
}) {
  const t = useTranslations("Events.photos");
  const format = useFormatter();
  const router = useRouter();
  const reduce = useReducedMotion();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const columns = useSyncExternalStore(subscribeWide, isWide, () => false)
    ? 3
    : 2;
  const [pending, start] = useTransition();
  const selection = usePhotoSelection();
  const selecting = selection?.selecting ?? false;
  const [open, setOpen] = useState<number | null>(null);
  // The photo opened from the grid morphs in (shared layoutId); the ones
  // reached by swiping or the arrows slide in from the side instead.
  const [entry, setEntry] = useState<string | null>(null);
  const [dir, setDir] = useState(0);
  const current = open === null ? null : photos[open];
  // Flagged photos the host chose to look at in the viewer.
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const hidden = (p: GridPhoto) => Boolean(p.flagged) && !revealed.has(p.id);
  // The "report illegal content" panel (DECISIONS #57).
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<"csam" | "illegal" | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    setReporting(false);
    setReason(null);
  }, []);
  const step = useCallback(
    (d: number) => {
      setDir(d);
      setReporting(false);
      setOpen((i) =>
        i === null ? i : (i + d + photos.length) % photos.length,
      );
    },
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (reporting) setReporting(false);
        else close();
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step, reporting]);

  function run(
    confirmText: string | null,
    fn: () => ReturnType<typeof deletePhoto>,
  ) {
    if (confirmText && !window.confirm(confirmText)) return;
    start(async () => {
      const res = await fn();
      if (res.ok) {
        close();
        router.refresh();
      } else toast.error(t("failed"));
    });
  }

  function report(id: string, why: "csam" | "illegal") {
    start(async () => {
      const res = await reportPhoto(eventId, id, why);
      if (res.ok) {
        close();
        toast.success(t("reported"), { duration: 8000 });
        router.refresh();
      } else toast.error(t("failed"));
    });
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-primary/25 bg-accent/30 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-sm">
          <ImageIcon className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-lg font-semibold">
          {t("emptyTitle")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-muted-foreground">
          {t("emptyBody")}
        </p>
        {published && (
          <Button asChild className="mt-5 h-10 rounded-full px-5">
            <Link href={`/dashboard/events/${eventId}?view=share`}>
              <QrCode aria-hidden />
              {t("goShare")}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  const who = (p: GridPhoto) => p.uploaderName || t("anonymous");
  // The app has no fixed time zone (the server runs on UTC), so upload
  // times switch to the host's own zone once the page is live in the browser.
  const when = (p: GridPhoto) =>
    format.dateTime(new Date(p.createdAt), {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: mounted
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : undefined,
    });

  const viewer = (
    <AnimatePresence>
      {current && (
        <motion.div
          key="viewer"
          role="dialog"
          aria-modal="true"
          aria-label={who(current)}
          className="fixed inset-0 z-50 flex flex-col bg-black/75 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={close}
        >
          <div
            className="flex items-center justify-end gap-1 p-3 text-white sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {current.flagged && (
              <ViewerButton
                label={t("approve")}
                disabled={pending}
                onClick={() =>
                  run(null, () => approvePhoto(eventId, current.id))
                }
              >
                <ShieldCheck className="size-5" />
              </ViewerButton>
            )}
            <ViewerButton label={t("download")} href={current.download}>
              <Download className="size-5" />
            </ViewerButton>
            {current.canBlock && (
              <ViewerButton
                label={t("block")}
                disabled={pending}
                onClick={() =>
                  run(t("blockConfirm"), () => blockDevice(eventId, current.id))
                }
              >
                <Ban className="size-5" />
              </ViewerButton>
            )}
            <ViewerButton
              label={t("report")}
              disabled={pending}
              onClick={() => setReporting(true)}
            >
              <Flag className="size-5" />
            </ViewerButton>
            <ViewerButton
              label={t("delete")}
              disabled={pending}
              onClick={() =>
                run(t("deleteConfirm"), () => deletePhoto(eventId, current.id))
              }
            >
              <Trash2 className="size-5" />
            </ViewerButton>
            <ViewerButton label={t("close")} onClick={close}>
              <X className="size-5" />
            </ViewerButton>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-8 sm:px-20">
            <motion.div
              key={current.id}
              layoutId={
                current.id === entry ? `photo-${current.id}` : undefined
              }
              initial={
                current.id === entry || reduce
                  ? false
                  : { opacity: 0, x: dir * 80 }
              }
              animate={{ opacity: 1, x: 0 }}
              // Swipe left or right for the next or previous photo.
              drag={photos.length > 1 && !reporting ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.5}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                const swipe = info.offset.x + info.velocity.x * 0.2;
                if (swipe < -70) step(1);
                else if (swipe > 70) step(-1);
              }}
              className={cn(
                "clip-round relative touch-pan-y overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl",
                // Room for the "show" prompt even before the image arrives.
                hidden(current) && "min-h-64 min-w-72",
              )}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
              <img
                src={current.full}
                draggable={false}
                onError={(e) => {
                  // Browsers that can't show HEIC fall back to the thumbnail.
                  if (e.currentTarget.src !== current.src)
                    e.currentTarget.src = current.src;
                }}
                alt=""
                className={cn(
                  "block max-h-[78vh] w-auto max-w-[92vw] object-contain transition-[filter] duration-300 sm:max-w-[70vw]",
                  hidden(current) && "blur-2xl",
                )}
              />
              {hidden(current) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 p-6 text-center text-white">
                  <ShieldAlert className="size-8" aria-hidden />
                  <p className="max-w-xs text-sm text-pretty">
                    {t("flaggedBody")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((s) => new Set(s).add(current.id))
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-900 transition-transform active:scale-95"
                    >
                      <Eye className="size-4" aria-hidden />
                      {t("reveal")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(null, () => approvePhoto(eventId, current.id))
                      }
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/40 px-4 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-60"
                    >
                      <ShieldCheck className="size-4" aria-hidden />
                      {t("approve")}
                    </button>
                  </div>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white"
              >
                <p className="font-medium">{t("by", { name: who(current) })}</p>
                <p className="text-sm text-white/70">
                  {when(current)}
                  <span className="ms-3 text-white/50 tabular-nums">
                    {(open ?? 0) + 1}/{photos.length}
                  </span>
                </p>
              </motion.div>
            </motion.div>
            {reporting && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setReporting(false);
                }}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="report-title"
                  className="w-full max-w-md rounded-3xl bg-card p-5 text-card-foreground shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <Flag className="size-5" aria-hidden />
                    </span>
                    <h2
                      id="report-title"
                      className="font-heading text-lg font-semibold"
                    >
                      {t("reportTitle")}
                    </h2>
                  </div>
                  <div role="radiogroup" className="mt-4 space-y-2">
                    {(["csam", "illegal"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={reason === r}
                        onClick={() => setReason(r)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-start transition-colors",
                          reason === r
                            ? "border-destructive/60 bg-destructive/5"
                            : "border-border hover:bg-muted/60",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border-2",
                            reason === r
                              ? "border-destructive"
                              : "border-muted-foreground/50",
                          )}
                        >
                          {reason === r && (
                            <span className="size-2 rounded-full bg-destructive" />
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            {t(`reportReasons.${r}`)}
                          </span>
                          <span className="mt-0.5 block text-[13px] text-pretty text-muted-foreground">
                            {t(`reportReasons.${r}Hint`)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[13px] text-pretty text-muted-foreground">
                    {t("reportNote")}
                  </p>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="h-10 rounded-full px-4"
                      onClick={() => setReporting(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-10 rounded-full px-4"
                      disabled={!reason || pending}
                      onClick={() => reason && report(current.id, reason)}
                    >
                      {t("reportSend")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {photos.length > 1 && (
              <>
                <NavButton
                  side="start"
                  label={t("prev")}
                  onClick={() => step(-1)}
                />
                <NavButton
                  side="end"
                  label={t("next")}
                  onClick={() => step(1)}
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Round-robin into columns so the newest photos fill the top row
          left to right (CSS columns would fill top to bottom). */}
      <div className="flex items-start gap-3" aria-busy={pending}>
        {Array.from({ length: columns }, (_, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col gap-3">
            {photos.map((p, i) =>
              i % columns !== c ? null : (
                <motion.button
                  key={p.id}
                  type="button"
                  layoutId={`photo-${p.id}`}
                  onClick={() => {
                    if (selecting) {
                      selection?.toggle({ id: p.id, bytes: p.bytes });
                      return;
                    }
                    setEntry(p.id);
                    setDir(0);
                    setOpen(i);
                  }}
                  aria-label={
                    selecting
                      ? `${t("select")} · ${who(p)}`
                      : `${t("open")} · ${who(p)}`
                  }
                  aria-pressed={
                    selecting
                      ? Boolean(selection?.selected.has(p.id))
                      : undefined
                  }
                  className={cn(
                    "group clip-round relative block w-full overflow-hidden rounded-2xl bg-muted text-start shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    selecting &&
                      selection?.selected.has(p.id) &&
                      "ring-3 ring-primary",
                  )}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.45,
                    delay: (i % 6) * 0.04,
                    ease: EASE,
                  }}
                  whileHover={reduce ? undefined : { y: -3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
                  <img
                    src={p.src}
                    alt=""
                    loading="lazy"
                    width={p.width ?? undefined}
                    height={p.height ?? undefined}
                    style={
                      p.width && p.height
                        ? { aspectRatio: `${p.width} / ${p.height}` }
                        : undefined
                    }
                    className={cn(
                      "block h-auto w-full object-cover transition-transform duration-700 ease-out",
                      selecting
                        ? selection?.selected.has(p.id) && "scale-[0.94]"
                        : "group-hover:scale-[1.05]",
                      p.flagged && "scale-110 blur-xl",
                    )}
                  />
                  {p.flagged && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                        <ShieldAlert className="size-3.5" aria-hidden />
                        {t("flagged")}
                      </span>
                    </span>
                  )}
                  {selecting && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute start-2.5 top-2.5 flex size-7 items-center justify-center rounded-full border-2 shadow-md transition-colors",
                        selection?.selected.has(p.id)
                          ? "border-white bg-primary text-primary-foreground"
                          : "border-white/90 bg-black/25",
                      )}
                    >
                      {selection?.selected.has(p.id) && (
                        <Check className="size-4" strokeWidth={3} />
                      )}
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    <span className="block truncate text-sm font-medium text-white">
                      {who(p)}
                    </span>
                    <span className="block text-xs text-white/70">
                      {when(p)}
                    </span>
                  </span>
                </motion.button>
              ),
            )}
          </div>
        ))}
      </div>
      {mounted ? createPortal(viewer, document.body) : null}
    </>
  );
}

function ViewerButton({
  label,
  onClick,
  href,
  disabled,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const cls =
    "flex size-10 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-md transition-all duration-200 ease-out hover:bg-white/20 hover:text-white active:scale-90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50";
  return href ? (
    <a href={href} download title={label} aria-label={label} className={cls}>
      {children}
    </a>
  ) : (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cls}
    >
      {children}
    </button>
  );
}

function NavButton({
  side,
  label,
  onClick,
}: {
  side: "start" | "end";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-200 ease-out hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none active:scale-90 sm:flex ${side === "start" ? "start-4" : "end-4"}`}
    >
      <Icon className="size-6 rtl:rotate-180" />
    </button>
  );
}
