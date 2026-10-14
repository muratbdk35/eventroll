"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCheck,
  ChevronDown,
  Download,
  FolderDown,
  ListChecks,
  Share,
  UserRound,
  X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { HaloButton } from "@/components/halo/halo-button";
import { HaloCard } from "@/components/halo/halo-card";
import { HaloProgress } from "@/components/halo/halo-progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  canShareFiles,
  canStreamToDisk,
  type DownloadFile,
  type DownloadQuery,
  fetchDownloadList,
  pickZipTarget,
  prepareShare,
  type Progress,
  saveAsZip,
  SHARE_MAX_BYTES,
  SHARE_MAX_FILES,
} from "@/lib/download/client";
import { zipFileName } from "@/lib/download/names";

/**
 * Every way to get photos out (DECISIONS #39): the whole album, one guest's
 * photos, a hand-picked selection (ZIP, or the share sheet on phones), and
 * single photos from the viewer. A context ties the menu in the section
 * header to selection mode in the grid.
 */

export type GuestSummary = {
  uploaderName: string | null;
  photos: number;
  bytes: number;
};

type Picked = { id: string; bytes: number };

type Ctx = {
  selecting: boolean;
  selected: Map<string, number>;
  toggle: (p: Picked) => void;
};

const SelectionContext = createContext<Ctx | null>(null);

/** Selection state for the grid; null when there is no download provider. */
export function usePhotoSelection() {
  return useContext(SelectionContext);
}

type Job =
  | { kind: "zip"; label: string; progress: Progress }
  | { kind: "share"; label: string; progress: Progress }
  | { kind: "shareReady"; files: File[] };

const noop = () => () => {};

export function PhotoDownloads({
  eventId,
  eventName,
  guests,
  totalPhotos,
  totalBytes,
  visible,
  children,
}: {
  eventId: string;
  eventName: string;
  guests: GuestSummary[];
  totalPhotos: number;
  totalBytes: number;
  /** Photos currently shown in the grid (for "select all"). */
  visible: Picked[];
  children: React.ReactNode;
}) {
  const t = useTranslations("Events.download");
  const format = useFormatter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [job, setJob] = useState<Job | null>(null);
  const abort = useRef<AbortController | null>(null);
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const shareable = hydrated && canShareFiles();

  const size = useCallback(
    (bytes: number) =>
      format.number(
        bytes / 1024 ** 2 >= 1024 ? bytes / 1024 ** 3 : bytes / 1024 ** 2,
        {
          maximumFractionDigits: 1,
        },
      ) + (bytes / 1024 ** 2 >= 1024 ? " GB" : " MB"),
    [format],
  );

  const toggle = useCallback((p: Picked) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.set(p.id, p.bytes);
      return next;
    });
  }, []);

  const ctx = useMemo(
    () => ({ selecting, selected, toggle }),
    [selecting, selected, toggle],
  );

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Map());
  }

  const anonymous = t("anonymousFile");

  async function runZip(query: DownloadQuery, label: string, base: string) {
    if (job) return;
    // The save dialog must open inside the click, before any await.
    const name = zipFileName(base);
    let target = null;
    if (canStreamToDisk()) {
      target = await pickZipTarget(name);
      if (!target) return;
    }
    const ctrl = new AbortController();
    abort.current = ctrl;
    const start: Progress = {
      doneFiles: 0,
      totalFiles: 0,
      doneBytes: 0,
      totalBytes: 0,
    };
    setJob({ kind: "zip", label, progress: start });
    try {
      const { files } = await fetchDownloadList(eventId, query, ctrl.signal);
      if (files.length === 0) {
        toast.info(t("nothing"));
        return;
      }
      const { failed } = await saveAsZip(files, base, target, {
        anonymous,
        signal: ctrl.signal,
        onProgress: (progress) => setJob({ kind: "zip", label, progress }),
      });
      finish(files.length, failed, () =>
        runZip({ ids: failed.map((f) => f.id) }, label, `${base} (2)`),
      );
      stopSelecting();
    } catch {
      if (!ctrl.signal.aborted) toast.error(t("failed"));
      else toast(t("cancelled"));
    } finally {
      setJob((j) => (j?.kind === "zip" ? null : j));
      abort.current = null;
    }
  }

  function finish(total: number, failed: DownloadFile[], retry: () => void) {
    if (failed.length === 0) {
      toast.success(t("done", { count: total }));
      return;
    }
    toast.warning(t("partial", { count: failed.length }), {
      duration: 15_000,
      action: { label: t("retry"), onClick: retry },
    });
  }

  async function runShare(ids: string[]) {
    if (job) return;
    const ctrl = new AbortController();
    abort.current = ctrl;
    const label = t("preparing");
    setJob({
      kind: "share",
      label,
      progress: {
        doneFiles: 0,
        totalFiles: ids.length,
        doneBytes: 0,
        totalBytes: 0,
      },
    });
    try {
      const { files } = await fetchDownloadList(eventId, { ids }, ctrl.signal);
      const { ready, failed } = await prepareShare(files, {
        anonymous,
        signal: ctrl.signal,
        onProgress: (progress) => setJob({ kind: "share", label, progress }),
      });
      if (failed.length) toast.warning(t("partial", { count: failed.length }));
      if (ready.length) setJob({ kind: "shareReady", files: ready });
      else setJob(null);
    } catch {
      if (!ctrl.signal.aborted) toast.error(t("failed"));
      setJob(null);
    } finally {
      abort.current = null;
    }
  }

  async function share(files: File[]) {
    try {
      await navigator.share({ files });
      toast.success(t("shared", { count: files.length }));
      stopSelecting();
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        toast.error(t("failed"));
      }
    } finally {
      setJob(null);
    }
  }

  const pickedBytes = [...selected.values()].reduce((n, b) => n + b, 0);
  const allVisible =
    visible.length > 0 && visible.every((p) => selected.has(p.id));
  const shareTooBig =
    selected.size > SHARE_MAX_FILES || pickedBytes > SHARE_MAX_BYTES;

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={totalPhotos === 0 || Boolean(job)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium shadow-xs transition-colors hover:bg-accent disabled:opacity-50"
        >
          <Download className="size-4" aria-hidden />
          {t("menu")}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={16}
        className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl p-1.5"
      >
        <MenuOption
          icon={<FolderDown aria-hidden />}
          title={t("all")}
          hint={t("allHint", { count: totalPhotos, size: size(totalBytes) })}
          onSelect={() => void runZip({ all: true }, t("allLabel"), eventName)}
        />
        <MenuOption
          icon={<ListChecks aria-hidden />}
          title={t("pick")}
          hint={shareable ? t("pickHintPhone") : t("pickHint")}
          onSelect={() => setSelecting(true)}
        />
        {guests.length > 0 && (
          <>
            <DropdownMenuSeparator className="mx-1 my-1.5" />
            <DropdownMenuLabel className="px-2.5 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">
              {t("byGuest")}
            </DropdownMenuLabel>
            <div className="max-h-56 overflow-y-auto">
              {guests.map((g) => {
                const name = g.uploaderName ?? t("noName");
                return (
                  <DropdownMenuItem
                    key={g.uploaderName ?? "\u0000"}
                    className="gap-3 rounded-xl px-2.5 py-2 focus:**:text-inherit"
                    onSelect={() =>
                      void runZip(
                        { uploader: g.uploaderName },
                        name,
                        `${eventName} - ${name}`,
                      )
                    }
                  >
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground uppercase"
                    >
                      {g.uploaderName ? (
                        g.uploaderName.trim().charAt(0)
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {name}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                      {g.photos}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const pct = (p: Progress) =>
    p.totalBytes > 0 ? (p.doneBytes / p.totalBytes) * 100 : null;

  return (
    <SelectionContext.Provider value={ctx}>
      <DownloadMenuSlot.Provider value={menu}>
        {children}
      </DownloadMenuSlot.Provider>

      <AnimatePresence>
        {(selecting || job) && (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto w-[min(34rem,calc(100vw-2rem))]"
          >
            <HaloCard
              interactive={false}
              emphasis
              translucent={false}
              padding="sm"
              surfaceClassName="gap-3"
            >
              {job?.kind === "zip" || job?.kind === "share" ? (
                <div aria-live="polite" className="space-y-3 px-1">
                  <HaloProgress
                    size="md"
                    value={pct(job.progress)}
                    label={
                      job.progress.totalFiles
                        ? t("progress", {
                            label: job.label,
                            done: job.progress.doneFiles,
                            total: job.progress.totalFiles,
                          })
                        : t("listing", { label: job.label })
                    }
                    aside={
                      job.progress.totalBytes
                        ? `${size(job.progress.doneBytes)} / ${size(job.progress.totalBytes)}`
                        : undefined
                    }
                  />
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      {job.progress.part && job.progress.part.of > 1
                        ? t("part", job.progress.part)
                        : t("keepOpen")}
                    </span>
                    <button
                      type="button"
                      onClick={() => abort.current?.abort()}
                      className="rounded-full px-3 py-1.5 font-medium text-foreground hover:bg-muted"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : job?.kind === "shareReady" ? (
                <div className="flex flex-wrap items-center gap-3 px-1">
                  <p className="min-w-0 flex-1 text-sm font-medium">
                    {t("readyToShare", { count: job.files.length })}
                  </p>
                  <HaloButton
                    leading={<Share aria-hidden />}
                    onClick={() => void share(job.files)}
                  >
                    {t("saveToPhone")}
                  </HaloButton>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <p className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">
                        {t("selected", { count: selected.size })}
                      </span>
                      {selected.size > 0 && (
                        <span className="text-muted-foreground">
                          {" ("}
                          {size(pickedBytes)}
                          {")"}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected(
                          allVisible
                            ? new Map()
                            : new Map(visible.map((p) => [p.id, p.bytes])),
                        )
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-muted"
                    >
                      <CheckCheck className="size-4" aria-hidden />
                      {allVisible ? t("none") : t("selectAll")}
                    </button>
                    <button
                      type="button"
                      onClick={stopSelecting}
                      aria-label={t("close")}
                      className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <HaloButton
                      fullWidth={!shareable}
                      className={shareable ? "flex-1" : undefined}
                      disabled={selected.size === 0}
                      leading={<Download aria-hidden />}
                      onClick={() =>
                        void runZip(
                          { ids: [...selected.keys()] },
                          t("pickedLabel"),
                          `${eventName} - ${t("pickedFile")}`,
                        )
                      }
                    >
                      {t("zip")}
                    </HaloButton>
                    {shareable && (
                      <HaloButton
                        tone="secondary"
                        className="flex-1"
                        disabled={selected.size === 0 || shareTooBig}
                        leading={<Share aria-hidden />}
                        onClick={() => void runShare([...selected.keys()])}
                      >
                        {t("saveToPhone")}
                      </HaloButton>
                    )}
                  </div>
                  {shareable && shareTooBig && (
                    <p className="px-1 text-xs text-muted-foreground">
                      {t("tooManyToShare", { count: SHARE_MAX_FILES })}
                    </p>
                  )}
                </>
              )}
            </HaloCard>
          </motion.div>
        )}
      </AnimatePresence>
    </SelectionContext.Provider>
  );
}

/** A menu row: icon in a soft tile, title and one line of help. */
function MenuOption({
  icon,
  title,
  hint,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="group/opt items-center gap-3 rounded-xl px-2.5 py-2.5 focus:**:text-inherit"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-focus/opt:bg-primary group-focus/opt:text-primary-foreground [&_svg]:size-[18px]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug font-medium text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-pretty text-muted-foreground">
          {hint}
        </span>
      </span>
    </DropdownMenuItem>
  );
}

const DownloadMenuSlot = createContext<React.ReactNode>(null);

/** The "Download" menu, rendered where the section header wants it. */
export function DownloadMenu() {
  return <>{useContext(DownloadMenuSlot)}</>;
}
