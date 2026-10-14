"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  ImageIcon,
  QrCode,
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
import { blockDevice, deletePhoto } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";

// Adapted from the 21st.dev "Masonry Lightbox" (ayushmxxn): masonry columns at
// the photos' real proportions, fade-in entrance (no blur filter: too heavy on
// phones), hover lift with caption, and a shared-element (layoutId) spring
// into the viewer.

export type GridPhoto = {
  id: string;
  src: string;
  full: string;
  uploaderName: string | null;
  canBlock: boolean;
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
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : photos[open];

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) =>
      setOpen((i) =>
        i === null ? i : (i + d + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
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
  }, [open, close, step]);

  function run(confirmText: string, fn: () => ReturnType<typeof deletePhoto>) {
    if (!window.confirm(confirmText)) return;
    start(async () => {
      const res = await fn();
      if (res.ok) {
        setOpen(null);
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
  const when = (p: GridPhoto) =>
    format.dateTime(new Date(p.createdAt), {
      dateStyle: "medium",
      timeStyle: "short",
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
            <ViewerButton label={t("download")} href={current.full}>
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
              layoutId={`photo-${current.id}`}
              className="clip-round relative overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl"
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
              <img
                src={current.full}
                onError={(e) => {
                  // Browsers that can't show HEIC fall back to the thumbnail.
                  if (e.currentTarget.src !== current.src)
                    e.currentTarget.src = current.src;
                }}
                alt=""
                className="block max-h-[78vh] w-auto max-w-[92vw] object-contain sm:max-w-[70vw]"
              />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white"
              >
                <p className="font-medium">{t("by", { name: who(current) })}</p>
                <p className="text-sm text-white/70">
                  {when(current)} · {(open ?? 0) + 1} / {photos.length}
                </p>
              </motion.div>
            </motion.div>
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
                  onClick={() => setOpen(i)}
                  aria-label={`${t("open")} · ${who(p)}`}
                  className="group clip-round relative block w-full overflow-hidden rounded-2xl bg-muted text-start shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                    className="block h-auto w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
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
