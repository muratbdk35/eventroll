"use client";

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
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { blockDevice, deletePhoto } from "@/lib/events/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";

export type GridPhoto = {
  id: string;
  src: string;
  full: string;
  uploaderName: string | null;
  canBlock: boolean;
  createdAt: string;
};

export function PhotoGrid({
  eventId,
  photos,
}: {
  eventId: string;
  photos: GridPhoto[];
}) {
  const t = useTranslations("Events.photos");
  const format = useFormatter();
  const router = useRouter();
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
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
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
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/25 bg-accent/30 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-sm">
          <ImageIcon className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 font-heading text-lg font-semibold">
          {t("emptyTitle")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-pretty text-muted-foreground">
          {t("emptyBody")}
        </p>
        <Button
          asChild
          variant="default"
          className="mt-5 h-10 rounded-full px-5"
        >
          <Link href={`/dashboard/events/${eventId}?view=share`}>
            <QrCode aria-hidden />
            {t("goShare")}
          </Link>
        </Button>
      </div>
    );
  }

  const who = (p: GridPhoto) => p.uploaderName || t("anonymous");

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy={pending}>
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`${t("open")} · ${who(p)}`}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs */}
              <img
                src={p.src}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-start text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {who(p)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={who(current)}
          className="fixed inset-0 z-50 flex flex-col bg-black/92 text-white backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="flex items-center justify-between gap-3 p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 ps-1">
              <p className="truncate text-sm font-semibold">
                {t("by", { name: who(current) })}
              </p>
              <p className="text-xs text-white/60">
                {format.dateTime(new Date(current.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {" · "}
                {(open ?? 0) + 1} / {photos.length}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <IconButton label={t("download")} href={current.full}>
                <Download className="size-5" />
              </IconButton>
              {current.canBlock && (
                <IconButton
                  label={t("block")}
                  disabled={pending}
                  onClick={() =>
                    run(t("blockConfirm"), () =>
                      blockDevice(eventId, current.id),
                    )
                  }
                >
                  <Ban className="size-5" />
                </IconButton>
              )}
              <IconButton
                label={t("delete")}
                disabled={pending}
                onClick={() =>
                  run(t("deleteConfirm"), () =>
                    deletePhoto(eventId, current.id),
                  )
                }
              >
                <Trash2 className="size-5" />
              </IconButton>
              <IconButton label={t("close")} onClick={close}>
                <X className="size-5" />
              </IconButton>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-6 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
            <img
              key={current.id}
              src={current.full}
              onError={(e) => {
                // Browsers that can't show HEIC fall back to the thumbnail.
                if (e.currentTarget.src !== current.src)
                  e.currentTarget.src = current.src;
              }}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
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
        </div>
      )}
    </>
  );
}

function IconButton({
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
    "flex size-10 items-center justify-center rounded-xl text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50";
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
      className={`absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:flex ${side === "start" ? "start-3" : "end-3"}`}
    >
      <Icon className="size-6 rtl:rotate-180" />
    </button>
  );
}
