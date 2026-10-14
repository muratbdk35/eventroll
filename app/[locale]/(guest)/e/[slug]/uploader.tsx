"use client";

import {
  Camera,
  Check,
  KeyRound,
  Loader2,
  RotateCw,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@/components/turnstile";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { isAllowedMime, MAX_FILE_BYTES, type AllowedMime } from "@/lib/uploads";

type Props = {
  slug: string;
  requireName: boolean;
  hasPin: boolean;
  maxPerDevice: number | null;
  verified: boolean;
  turnstileSiteKey: string | undefined;
};

type Item = {
  key: string;
  file: File;
  mime: AllowedMime;
  preview: string;
  status: "selected" | "uploading" | "done" | "error";
  /** 0–1 while uploading. */
  progress: number;
  error?: "tooBig" | "badType" | "failed" | "limitReached";
};

const EXT_MIME: Record<string, AllowedMime> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
};

/** Polaroid tilt pattern, in degrees. */
const TILTS = [-2.5, 1.5, -1, 2.5, -1.5, 1];

function mimeOf(file: File): AllowedMime | null {
  if (isAllowedMime(file.type)) return file.type;
  // Some phones report an empty type for HEIC.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? null;
}

async function makeThumb(
  file: File,
): Promise<{ blob: Blob | null; width?: number; height?: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 480 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", 0.8),
    );
    const out = { blob, width: bmp.width, height: bmp.height };
    bmp.close();
    return out;
  } catch {
    return { blob: null }; // e.g. HEIC in a browser that can't decode it
  }
}

type Presigned = { url: string; headers: Record<string, string> };

/** PUT with upload progress (fetch can't report it). */
function put(
  target: Presigned,
  body: Blob,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", target.url);
    for (const [k, v] of Object.entries(target.headers)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`upload ${xhr.status}`));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

function ProgressRing({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <svg viewBox="0 0 36 36" className="size-11 -rotate-90" aria-hidden>
      <circle
        cx="18"
        cy="18"
        r="15.9"
        fill="none"
        className="stroke-white/30"
        strokeWidth="3"
      />
      <circle
        cx="18"
        cy="18"
        r="15.9"
        fill="none"
        className="stroke-white transition-[stroke-dashoffset] duration-300 ease-out"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - pct}
      />
    </svg>
  );
}

export function Uploader(props: Props) {
  const t = useTranslations("Guest");
  const locale = useLocale();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [verified, setVerified] = useState(props.verified);
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [pin, setPin] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [name, setName] = useState("");
  const [nameShake, setNameShake] = useState(0);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState<"consent" | "name" | null>(null);
  const [consentShake, setConsentShake] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [sentNow, setSentNow] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (sentNow === 0) return;
    const colors = ["#c2410c", "#ea580c", "#fb923c", "#fed7aa", "#ffffff"];
    const shot = (x: number, angle: number) =>
      confetti({
        particleCount: 70,
        angle,
        spread: 65,
        startVelocity: 55,
        origin: { x, y: 0.85 },
        colors,
        scalar: 0.9,
        zIndex: 60,
        disableForReducedMotion: true,
      });
    void shot(0.1, 60);
    void shot(0.9, 120);
  }, [sentNow]);

  const pendingCount = items.filter(
    (i) => i.status === "selected" || i.status === "uploading",
  ).length;
  useEffect(() => {
    const root = document.documentElement;
    if (pendingCount === 0) {
      delete root.dataset.pendingPhotos;
      return;
    }
    // Read by the language switcher, which would otherwise drop the picks.
    root.dataset.pendingPhotos = String(pendingCount);
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      delete root.dataset.pendingPhotos;
    };
  }, [pendingCount]);

  const patch = (key: string, p: Partial<Item>) =>
    setItems((all) => all.map((i) => (i.key === key ? { ...i, ...p } : i)));

  // ── gate ────────────────────────────────────────────────────────────
  async function submitGate(tok: string | null = token) {
    if (!tok) return;
    setGateBusy(true);
    setGateError(null);
    try {
      const res = await fetch(`/api/guest/${props.slug}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tok,
          pin: props.hasPin ? pin : undefined,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { blocked?: boolean };
        if (body.blocked) router.refresh();
        setVerified(true);
        return;
      }
      setGateError(
        res.status === 401
          ? t("pinWrong")
          : res.status === 429
            ? t("pinTooMany")
            : t("verifyFailed"),
      );
      // Turnstile tokens are single-use: request a fresh challenge.
      setToken(null);
      setCaptchaKey((k) => k + 1);
    } catch {
      setGateError(t("verifyFailed"));
      setToken(null);
      setCaptchaKey((k) => k + 1);
    } finally {
      setGateBusy(false);
    }
  }

  // ── upload ──────────────────────────────────────────────────────────
  async function upload(entries: Item[]) {
    setBusy(true);
    setSentNow(0);
    entries.forEach((i) =>
      patch(i.key, { status: "uploading", progress: 0, error: undefined }),
    );
    const prepared = await Promise.all(
      entries.map(async (item) => ({
        item,
        thumb: await makeThumb(item.file),
      })),
    );
    let ok = 0;
    for (let i = 0; i < prepared.length; i += 20) {
      const batch = prepared.slice(i, i + 20);
      const res = await fetch(`/api/guest/${props.slug}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploaderName: name.trim() || undefined,
          consent: true,
          files: batch.map(({ item, thumb }) => ({
            type: item.mime,
            size: item.file.size,
            thumbSize: thumb.blob?.size,
          })),
        }),
      }).catch(() => null);

      if (!res?.ok) {
        const err = (await res?.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res?.status === 401) setVerified(false);
        else if (res?.status === 403 && err?.error !== "device_limit") {
          router.refresh(); // state changed (closed, blocked, …)
        }
        batch.forEach(({ item }) =>
          patch(item.key, {
            status: "error",
            error: err?.error === "device_limit" ? "limitReached" : "failed",
          }),
        );
        continue;
      }
      const { uploads } = (await res.json()) as {
        uploads: {
          mediaId: string;
          original: Presigned;
          thumb: Presigned | null;
        }[];
      };

      // Three at a time keeps phones responsive on flaky venue Wi-Fi.
      const queue = batch.map((b, idx) => ({ ...b, up: uploads[idx] }));
      const worker = async () => {
        for (let next = queue.shift(); next; next = queue.shift()) {
          const { item, thumb, up } = next;
          try {
            await put(up.original, item.file, (f) =>
              patch(item.key, { progress: f * 0.95 }),
            );
            if (up.thumb && thumb.blob) await put(up.thumb, thumb.blob);
            const c = await fetch(`/api/guest/${props.slug}/confirm`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mediaId: up.mediaId,
                width: thumb.width,
                height: thumb.height,
              }),
            });
            if (!c.ok) {
              const e = (await c.json().catch(() => null)) as {
                error?: string;
              } | null;
              patch(item.key, {
                status: "error",
                error: e?.error === "device_limit" ? "limitReached" : "failed",
              });
            } else {
              ok += 1;
              patch(item.key, { status: "done", progress: 1 });
            }
          } catch {
            patch(item.key, { status: "error", error: "failed" });
          }
        }
      };
      await Promise.all([worker(), worker(), worker()]);
    }
    setBusy(false);
    setSentNow(ok);
  }

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    setSentNow(0);
    const next: Item[] = files.map((file) => {
      const mime = mimeOf(file);
      const base = {
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      };
      if (!mime) {
        return {
          ...base,
          mime: "image/jpeg",
          status: "error",
          error: "badType",
        };
      }
      if (file.size > MAX_FILE_BYTES) {
        return { ...base, mime, status: "error", error: "tooBig" };
      }
      return { ...base, mime, status: "selected" };
    });
    setItems((all) => [...next, ...all]);
  }

  function remove(key: string) {
    setItems((all) => {
      const item = all.find((i) => i.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return all.filter((i) => i.key !== key);
    });
  }

  function send() {
    const ready = items.filter((i) => i.status === "selected");
    if (ready.length === 0 || busy) return;
    if (props.requireName && !name.trim()) {
      setNotice("name");
      setNameShake((n) => n + 1);
      nameRef.current?.focus();
      return;
    }
    if (!consent) {
      setNotice("consent");
      setConsentShake((n) => n + 1);
      return;
    }
    setNotice(null);
    void upload(ready);
  }

  function retry(item: Item) {
    void upload([item]);
  }

  // ── gate view ───────────────────────────────────────────────────────
  if (!verified) {
    const needsPin = props.hasPin;
    return (
      <div className="space-y-5 py-2">
        {needsPin && (
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-1 shadow-primary/10 ring-black/5">
              <KeyRound className="size-6" aria-hidden />
            </span>
            <label
              htmlFor="pin"
              className="mt-4 block font-heading text-xl font-semibold"
            >
              {t("pinTitle")}
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pinSubtitle")}
            </p>
            <input
              id="pin"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && token && pin.length >= 4)
                  void submitGate();
              }}
              className="mx-auto mt-5 block h-14 w-full max-w-56 rounded-2xl border border-white/70 bg-white/80 text-center font-mono text-2xl tracking-[0.5em] shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all duration-300 ease-out outline-none focus:shadow-lg focus:ring-2 focus:shadow-primary/10 focus:ring-primary/40"
            />
          </div>
        )}
        {props.turnstileSiteKey ? (
          <Turnstile
            key={captchaKey}
            siteKey={props.turnstileSiteKey}
            language={locale}
            onToken={(tok) => {
              setToken(tok);
              if (tok && !needsPin) void submitGate(tok);
            }}
          />
        ) : null}
        {gateError && (
          <p
            className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive"
            role="alert"
          >
            {gateError}
          </p>
        )}
        {needsPin ? (
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 ease-out hover:shadow-2xl active:scale-[0.97] disabled:opacity-50 disabled:shadow-none"
            disabled={gateBusy || !token || pin.length < 4}
            onClick={() => void submitGate()}
          >
            {gateBusy && (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            )}
            {t("continue")}
          </button>
        ) : (
          <p
            className="flex items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground"
            aria-live="polite"
          >
            {(gateBusy || !token) && !gateError && (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("verifying")}
              </>
            )}
          </p>
        )}
      </div>
    );
  }

  // ── main view ───────────────────────────────────────────────────────
  const selected = items.filter((i) => i.status === "selected");
  const inFlight = items.filter((i) => i.status === "uploading");
  const doneCount = items.filter((i) => i.status === "done").length;
  const overall =
    inFlight.length + doneCount > 0
      ? (items
          .filter((i) => i.status === "uploading" || i.status === "done")
          .reduce((n, i) => n + i.progress, 0) /
          (inFlight.length + doneCount)) *
        100
      : 0;
  const pick = () => fileInput.current?.click();

  return (
    <div className="space-y-5">
      {/* Name as a soft pill; never blocks picking photos. */}
      <label
        key={nameShake}
        className={cn(
          "flex h-12 items-center gap-2.5 rounded-full border border-white/70 bg-white/70 ps-4 pe-2 shadow-sm ring-1 ring-black/5 backdrop-blur-xl transition-all duration-300 ease-out focus-within:bg-white focus-within:shadow-lg focus-within:ring-2 focus-within:shadow-primary/10 focus-within:ring-primary/40",
          nameShake > 0 && "shake-x ring-2 ring-primary/50",
        )}
      >
        <UserRound className="size-4.5 shrink-0 text-primary" aria-hidden />
        <input
          ref={nameRef}
          id="uploader-name"
          maxLength={60}
          autoComplete="name"
          placeholder={
            props.requireName ? t("yourName") : t("yourNameOptional")
          }
          aria-label={props.requireName ? t("yourName") : t("yourNameOptional")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (notice === "name") setNotice(null);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/80"
        />
      </label>

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          addFiles(files);
        }}
        tabIndex={-1}
        aria-hidden
      />

      {/* One clear action: a big tappable card, then a slim "add more" row. */}
      <button
        type="button"
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "group flex w-full items-center rounded-[1.75rem] bg-white text-center shadow-sm ring-1 ring-black/5 transition-all duration-300 ease-out outline-none hover:shadow-md focus-visible:ring-4 focus-visible:ring-primary/25 active:scale-[0.98]",
          items.length > 0
            ? "gap-3 px-4 py-3 text-start"
            : "flex-col px-6 pt-9 pb-8",
          dragging && "scale-[1.02] ring-2 ring-primary/40",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-300 ease-out group-active:scale-90",
            items.length > 0 ? "size-11" : "size-[4.5rem]",
          )}
        >
          <Camera
            className={items.length > 0 ? "size-5" : "size-8"}
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        {items.length > 0 ? (
          <span className="text-[15px] font-semibold">{t("chooseMore")}</span>
        ) : (
          <>
            <span className="mt-5 font-heading text-2xl font-semibold tracking-tight">
              {t("heroTitle")}
            </span>
            <span className="mt-1 text-sm text-muted-foreground">
              {t("heroHint")}
            </span>
          </>
        )}
      </button>

      {/* Tray: picked prints drop in, then fill up while sending. */}
      {items.length > 0 && (
        <section aria-labelledby="tray">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="tray" className="text-sm font-semibold">
              {selected.length > 0
                ? t("selected", { count: selected.length })
                : t("yourUploads")}
            </h2>
            {selected.length > 0 && !busy && (
              <button
                type="button"
                onClick={() => selected.forEach((i) => remove(i.key))}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("clear")}
              </button>
            )}
          </div>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 px-1">
            {items.map((item, i) => (
              <li
                key={item.key}
                className="polaroid relative rounded-[5px] bg-white p-1.5 pb-5 shadow-lg ring-1 shadow-black/10 ring-black/5"
                style={
                  {
                    "--r": `${TILTS[i % TILTS.length]}deg`,
                  } as React.CSSProperties
                }
              >
                <div className="relative aspect-square overflow-hidden rounded-[3px] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img
                    src={item.preview}
                    alt=""
                    className="size-full object-cover"
                  />
                  {item.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
                      <ProgressRing value={item.progress} />
                    </span>
                  )}
                  {item.status === "error" && (
                    <button
                      type="button"
                      onClick={() =>
                        item.error === "failed" ? retry(item) : remove(item.key)
                      }
                      className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 p-1.5 text-center text-[11px] leading-tight font-medium text-white"
                    >
                      {item.error === "failed" ? (
                        <RotateCw className="size-4" aria-hidden />
                      ) : (
                        <X className="size-4" aria-hidden />
                      )}
                      {item.error === "failed"
                        ? t("retry")
                        : item.error === "limitReached"
                          ? t("limitReached", {
                              count: props.maxPerDevice ?? 0,
                            })
                          : t(item.error ?? "failed")}
                    </button>
                  )}
                </div>
                {item.status === "selected" && !busy && (
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    aria-label={t("remove")}
                    className="group/x absolute -end-4 -top-4 flex size-11 items-center justify-center rounded-full outline-none"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-white text-foreground shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out group-hover/x:scale-110 group-focus-visible/x:ring-2 group-focus-visible/x:ring-primary group-active/x:scale-90">
                      <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                  </button>
                )}
                {item.status === "done" && (
                  <span className="pop absolute end-1.5 bottom-1 flex size-5 items-center justify-center rounded-full bg-success text-white shadow-sm">
                    <Check className="size-3" strokeWidth={3.5} aria-hidden />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Floating glass bar: consent + send, progress, then thanks. */}
      {(selected.length > 0 || busy || sentNow > 0) && (
        <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 rounded-[1.75rem] border border-white/70 bg-white/75 p-3 shadow-2xl ring-1 shadow-primary/15 ring-black/5 backdrop-blur-xl">
          {busy ? (
            <div className="px-2 py-2.5" aria-live="polite">
              <div className="flex items-center gap-2.5 text-[15px] font-semibold">
                <Loader2
                  className="size-4 animate-spin text-primary"
                  aria-hidden
                />
                <span className="flex-1">
                  {t("sending", {
                    done: doneCount,
                    total: inFlight.length + doneCount,
                  })}
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {Math.round(overall)}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/12">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.max(4, overall)}%` }}
                />
              </div>
            </div>
          ) : selected.length > 0 ? (
            <>
              <label className="flex cursor-pointer items-start gap-3 px-1.5 pt-1 pb-3">
                <button
                  type="button"
                  key={consentShake}
                  role="checkbox"
                  aria-checked={consent}
                  onClick={() => {
                    setConsent((c) => !c);
                    if (notice === "consent") setNotice(null);
                  }}
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all duration-200 ease-out",
                    consentShake > 0 && !consent && "shake-x",
                    consent
                      ? "scale-105 border-primary bg-primary text-primary-foreground"
                      : notice === "consent"
                        ? "border-destructive"
                        : "border-input bg-white",
                  )}
                >
                  {consent && (
                    <Check
                      className="pop size-3.5"
                      strokeWidth={3.5}
                      aria-hidden
                    />
                  )}
                </button>
                <span className="text-[12.5px] leading-snug text-muted-foreground">
                  {t.rich("consent", {
                    terms: (c) => (
                      <Link
                        href="/legal/terms"
                        target="_blank"
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        {c}
                      </Link>
                    ),
                    privacy: (c) => (
                      <Link
                        href="/legal/privacy"
                        target="_blank"
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        {c}
                      </Link>
                    ),
                  })}
                </span>
              </label>
              {notice && (
                <p
                  className="px-1.5 pb-2 text-[12.5px] font-medium text-destructive"
                  role="alert"
                >
                  {notice === "consent" ? t("consentNeeded") : t("nameNeeded")}
                </p>
              )}
              <button
                type="button"
                onClick={send}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.97]"
              >
                <Sparkles className="size-5" aria-hidden />
                {t("send", { count: selected.length })}
              </button>
            </>
          ) : (
            <div className="p-1.5" role="status">
              <div className="flex items-center gap-3">
                <span className="pop flex size-11 shrink-0 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/30">
                  <Check className="size-6" strokeWidth={3} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg leading-tight font-semibold">
                    {t("thanksTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("thanksBody", { count: sentNow })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={pick}
                className="mt-3 h-12 w-full rounded-2xl bg-foreground text-[15px] font-semibold text-background transition-all duration-300 ease-out active:scale-[0.97]"
              >
                {t("chooseMore")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
