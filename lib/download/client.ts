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

/** The share sheet chokes on huge batches; beyond this, use the ZIP. */
export const SHARE_MAX_FILES = 40;
export const SHARE_MAX_BYTES = 300 * 1024 ** 2;

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
