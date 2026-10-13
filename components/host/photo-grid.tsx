"use client";

import { Ban, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { blockDevice, deletePhoto } from "@/lib/events/actions";
import { useRouter } from "@/lib/i18n/navigation";

export type GridPhoto = {
  id: string;
  src: string;
  uploaderName: string | null;
  canBlock: boolean;
};

export function PhotoGrid({
  eventId,
  photos,
}: {
  eventId: string;
  photos: GridPhoto[];
}) {
  const t = useTranslations("Events.photos");
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(confirmText: string, fn: () => ReturnType<typeof deletePhoto>) {
    if (!window.confirm(confirmText)) return;
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else toast.error(t("failed"));
    });
  }

  if (photos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      aria-busy={pending}
    >
      {photos.map((p) => (
        <li
          key={p.id}
          className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URLs */}
          <img
            src={p.src}
            alt={p.uploaderName ?? ""}
            loading="lazy"
            className="size-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            {p.canBlock && (
              <button
                type="button"
                title={t("block")}
                aria-label={t("block")}
                disabled={pending}
                onClick={() =>
                  run(t("blockConfirm"), () => blockDevice(eventId, p.id))
                }
                className="flex size-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                <Ban className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              title={t("delete")}
              aria-label={t("delete")}
              disabled={pending}
              onClick={() =>
                run(t("deleteConfirm"), () => deletePhoto(eventId, p.id))
              }
              className="flex size-8 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
