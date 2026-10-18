/**
 * Album downloads in the host's browser (DECISIONS #23, #39). Originals come
 * straight from R2 through signed links and are streamed into a ZIP with
 * client-zip (MIT): no server time, no memory spikes. Chrome/Edge write the
 * ZIP straight to disk (File System Access); other browsers get the album in
 * parts small enough to hold in memory.
 */
import { makeZip } from "client-zip";
import { photoFileName, splitParts, zipFileName } from "./names";

export type DownloadFile = {
  id: string;
  url: string;
  bytes: number;
  ext: string;
  uploaderName: string | null;
  createdAt: string;
};

export type DownloadQuery =
  { all: true } | { ids: string[] } | { uploader: string | null };

export type Progress = {
  doneFiles: number;
  totalFiles: number;
  doneBytes: number;
  totalBytes: number;
  part?: { n: number; of: number };
};

type Opts = {
  anonymous: string;
  signal: AbortSignal;
  onProgress: (p: Progress) => void;
};

export async function fetchDownloadList(
  eventId: string,
  query: DownloadQuery,
  signal?: AbortSignal,
): Promise<{ eventName: string; files: DownloadFile[] }> {
  const res = await fetch(`/api/events/${eventId}/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
    signal,
  });
  if (!res.ok) throw new Error(`list ${res.status}`);
  return res.json();
}

type SaveHandle = { createWritable(): Promise<WritableStream<Uint8Array>> };
type PickerWindow = Window & {
  showSaveFilePicker?: (o: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<SaveHandle>;
};

/** True where the ZIP can stream straight to a file the host picks. */
export function canStreamToDisk(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as PickerWindow).showSaveFilePicker === "function"
  );
}

/**
 * Must run inside the click handler (browsers require a user gesture).
 * Resolves null when the host closes the dialog.
 */
export async function pickZipTarget(
  suggestedName: string,
): Promise<SaveHandle | null> {
  try {
    return await (window as PickerWindow).showSaveFilePicker!({
      suggestedName,
      types: [{ description: "ZIP", accept: { "application/zip": [".zip"] } }],
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return null;
    throw e;
  }
}

const isPhone = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

/** Part size where the ZIP has to sit in memory before saving. */
const partLimit = () => (isPhone() ? 400 : 1500) * 1024 ** 2;

async function fetchWithRetry(url: string, signal: AbortSignal) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (res.ok && res.body) return res;
      if (attempt >= 2) return null;
    } catch (e) {
      if (signal.aborted || attempt >= 2) {
        if (signal.aborted) throw e;
        return null;
      }
    }
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
}

/**
 * ZIP entries for `files`, fetched one by one. Files that still fail after
 * retries are skipped and reported in `failed`.
 */
async function* entries(
  files: { file: DownloadFile; seq: number }[],
  opts: Opts,
  tally: { doneFiles: number; doneBytes: number },
  report: () => void,
  failed: DownloadFile[],
) {
  for (const { file, seq } of files) {
    const res = await fetchWithRetry(file.url, opts.signal);
    if (!res) {
      failed.push(file);
      tally.doneFiles += 1;
      tally.doneBytes += file.bytes;
      report();
      continue;
    }
    const counter = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, c) {
        tally.doneBytes += chunk.byteLength;
        report();
        c.enqueue(chunk);
      },
      flush() {
        tally.doneFiles += 1;
        report();
      },
    });
    yield {
      name: photoFileName(file, seq, opts.anonymous),
      lastModified: new Date(file.createdAt),
      input: res.body!.pipeThrough(counter),
    };
  }
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Downloads `files` as a ZIP named after `base`. With a `target` (from
 * `pickZipTarget`) it streams to that file; otherwise it saves one or more
 * parts. Returns the files that could not be fetched.
 */
export async function saveAsZip(
  files: DownloadFile[],
  base: string,
  target: SaveHandle | null,
  opts: Opts,
): Promise<{ failed: DownloadFile[] }> {
  const failed: DownloadFile[] = [];
  const numbered = files.map((file, i) => ({
    file,
    seq: i + 1,
    bytes: file.bytes,
  }));
  const totalBytes = files.reduce((n, f) => n + f.bytes, 0);
  const tally = { doneFiles: 0, doneBytes: 0 };
  let part: Progress["part"];
  const report = () =>
    opts.onProgress({
      ...tally,
      totalFiles: files.length,
      totalBytes,
      part,
    });
  report();

  if (target) {
    const zip = makeZip(entries(numbered, opts, tally, report, failed), {
      buffersAreUTF8: true,
    });
    const out = await target.createWritable();
    await zip.pipeTo(out, { signal: opts.signal });
    return { failed };
  }

  const parts = splitParts(numbered, partLimit());
  for (const [i, chunk] of parts.entries()) {
    part = { n: i + 1, of: parts.length };
    const zip = makeZip(entries(chunk, opts, tally, report, failed), {
      buffersAreUTF8: true,
    });
    const blob = await new Response(zip).blob();
    if (opts.signal.aborted) throw new DOMException("Aborted", "AbortError");
    saveBlob(blob, zipFileName(base, part));
  }
  return { failed };
}

/** Phones: hand photos to the share sheet ("Save to Photos"). */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({
      files: [new File([""], "x.jpg", { type: "image/jpeg" })],
    });
  } catch {
    return false;
  }
}

/**
 * Phones and tablets save to the gallery through the share sheet (DECISIONS
 * #56); a Mac can share files too, but there the ZIP is what people want.
 */
export function prefersGallery(): boolean {
  return (
    canShareFiles() &&
    typeof matchMedia !== "undefined" &&
    matchMedia("(pointer: coarse)").matches
  );
}

/** iPhone and iPad (iPadOS reports itself as a Mac with touch). */
export function isApplePhone(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

/** The share sheet chokes on huge batches, so the gallery saves in groups. */
export const SHARE_MAX_FILES = 40;
export const SHARE_MAX_BYTES = 300 * 1024 ** 2;

/** Splits files into groups the share sheet handles, keeping album order. */
export function shareBatches(files: DownloadFile[]): DownloadFile[][] {
  const out: DownloadFile[][] = [];
  let cur: DownloadFile[] = [];
  let bytes = 0;
  for (const f of files) {
    if (
      cur.length > 0 &&
      (cur.length >= SHARE_MAX_FILES || bytes + f.bytes > SHARE_MAX_BYTES)
    ) {
      out.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(f);
    bytes += f.bytes;
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * Keeps the screen on while photos download (Screen Wake Lock, where
 * supported); a locked phone stops the download. Re-acquired when the page
 * comes back, since the browser drops it when hidden. Returns a release.
 */
export function keepAwake(): () => void {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return () => {};
  }
  let lock: WakeLockSentinel | null = null;
  let done = false;
  const acquire = () => {
    if (done || document.visibilityState !== "visible") return;
    navigator.wakeLock
      .request("screen")
      .then((l) => {
        if (done) void l.release();
        else lock = l;
      })
      .catch(() => {});
  };
  acquire();
  document.addEventListener("visibilitychange", acquire);
  return () => {
    done = true;
    document.removeEventListener("visibilitychange", acquire);
    void lock?.release().catch(() => {});
  };
}

/**
 * Photos already saved to this phone's gallery, per event, so a stopped save
 * picks up where it left off. Browser storage only; it may be empty.
 */
const savedKey = (eventId: string) => `eventroll:saved:${eventId}`;

export function savedOnPhone(eventId: string): Set<string> {
  try {
    const raw = localStorage.getItem(savedKey(eventId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSaved(eventId: string, ids: string[]) {
  try {
    const all = savedOnPhone(eventId);
    for (const id of ids) all.add(id);
    localStorage.setItem(savedKey(eventId), JSON.stringify([...all]));
  } catch {}
}

export function forgetSaved(eventId: string) {
  try {
    localStorage.removeItem(savedKey(eventId));
  } catch {}
}

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
};

/**
 * Fetches the photos into memory as File objects. Sharing them needs a second
 * tap (`navigator.share` wants a fresh user gesture).
 */
export async function prepareShare(
  files: DownloadFile[],
  opts: Opts,
): Promise<{ ready: File[]; failed: DownloadFile[] }> {
  const ready: File[] = [];
  const failed: DownloadFile[] = [];
  const totalBytes = files.reduce((n, f) => n + f.bytes, 0);
  const tally = { doneFiles: 0, doneBytes: 0 };
  for (const [i, f] of files.entries()) {
    const res = await fetchWithRetry(f.url, opts.signal);
    if (res) {
      const blob = await res.blob();
      ready.push(
        new File([blob], photoFileName(f, i + 1, opts.anonymous), {
          type: MIME[f.ext] ?? blob.type,
          lastModified: new Date(f.createdAt).getTime(),
        }),
      );
    } else failed.push(f);
    tally.doneFiles += 1;
    tally.doneBytes += f.bytes;
    opts.onProgress({ ...tally, totalFiles: files.length, totalBytes });
  }
  return { ready, failed };
}
