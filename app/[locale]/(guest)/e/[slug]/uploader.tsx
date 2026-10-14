"use client";

import {
  Camera,
  Check,
  ImagePlus,
  KeyRound,
  Loader2,
  RotateCw,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { HaloButton } from "@/components/halo/halo-button";
import { HaloCard } from "@/components/halo/halo-card";
import { HaloDropzone } from "@/components/halo/halo-dropzone";
import { HaloInput } from "@/components/halo/halo-input";
import { HaloNotification } from "@/components/halo/halo-notification";
import { HaloProgress } from "@/components/halo/halo-progress";
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
  const pickerInput = useRef<HTMLInputElement>(null);
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
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_26px_-12px_var(--primary)] ring-[5px] ring-white/80">
              <KeyRound className="size-6" aria-hidden />
            </span>
            <label
              htmlFor="pin"
              className="mt-4 block font-heading text-2xl font-semibold tracking-tight"
            >
              {t("pinTitle")}
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("pinSubtitle")}
            </p>
            <HaloInput
              id="pin"
              size="lg"
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
              shellClassName="mx-auto mt-6 max-w-60"
              className="text-center font-mono text-2xl tracking-[0.5em]"
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
            className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-center text-sm font-medium text-destructive"
            role="alert"
          >
            {gateError}
          </p>
        )}
        {needsPin ? (
          <HaloButton
            size="lg"
            fullWidth
            isLoading={gateBusy}
            disabled={!token || pin.length < 4}
            onClick={() => void submitGate()}
          >
            {t("continue")}
          </HaloButton>
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
  const pickMore = () => pickerInput.current?.click();

  return (
    <div className="space-y-5">
      {/* Name first; never blocks picking photos. */}
      <div key={nameShake} className={cn(nameShake > 0 && "shake-x")}>
        <HaloInput
          ref={nameRef}
          id="uploader-name"
          size="lg"
          maxLength={60}
          autoComplete="name"
          leadingSlot={<UserRound className="text-primary" aria-hidden />}
          placeholder={
            props.requireName ? t("yourName") : t("yourNameOptional")
          }
          aria-label={props.requireName ? t("yourName") : t("yourNameOptional")}
          invalid={notice === "name"}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (notice === "name") setNotice(null);
          }}
          className="text-base font-normal"
        />
      </div>

      <div>
        <HaloDropzone
          inputRef={pickerInput}
          accept="image/*,.heic,.heif"
          compact={items.length > 0}
          icon={
            items.length > 0 ? (
              <ImagePlus aria-hidden />
            ) : (
              <Camera strokeWidth={1.75} aria-hidden />
            )
          }
          title={items.length > 0 ? t("chooseMore") : t("heroTitle")}
          hint={items.length > 0 ? undefined : t("heroHint")}
          onFiles={addFiles}
        />
      </div>

      {/* Picked photos: square thumbnails that fill up while sending. */}
      {items.length > 0 && (
        <section aria-labelledby="tray">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 id="tray" className="text-sm font-semibold">
              {selected.length > 0
                ? t("selected", { count: selected.length })
                : t("yourUploads")}
            </h2>
            {selected.length > 0 && !busy && (
              <button
                type="button"
                onClick={() => selected.forEach((i) => remove(i.key))}
                className="rounded-full px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("clear")}
              </button>
            )}
          </div>
          <ul className="grid grid-cols-3 gap-2.5">
            {items.map((item, i) => (
              <li
                key={item.key}
                className="thumb-in relative"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="relative aspect-square overflow-hidden rounded-[14px] bg-muted shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_6px_16px_-6px_rgba(60,30,10,0.3)] ring-1 ring-black/10 ring-inset">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img
                    src={item.preview}
                    alt=""
                    decoding="async"
                    className="size-full object-cover"
                  />
                  {item.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
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
                  {item.status === "done" && (
                    <span className="pop absolute end-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-success text-white shadow-md ring-2 ring-white">
                      <Check
                        className="size-3.5"
                        strokeWidth={3.5}
                        aria-hidden
                      />
                    </span>
                  )}
                </div>
                {item.status === "selected" && !busy && (
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    aria-label={t("remove")}
                    className="group/x absolute -end-3 -top-3 flex size-11 items-center justify-center rounded-full outline-none"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-white text-foreground shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out group-hover/x:scale-110 group-focus-visible/x:ring-2 group-focus-visible/x:ring-primary group-active/x:scale-90">
                      <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sticky Halo bar: consent + send, then progress, then thanks. */}
      {(selected.length > 0 || busy || sentNow > 0) && (
        <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20">
          {busy ? (
            <HaloCard
              interactive={false}
              emphasis
              translucent={false}
              padding="sm"
            >
              <div aria-live="polite" className="px-1 py-1">
                <HaloProgress
                  size="md"
                  value={Math.max(4, overall)}
                  label={t("sending", {
                    done: doneCount,
                    total: inFlight.length + doneCount,
                  })}
                  aside={`${Math.round(overall)}%`}
                />
              </div>
            </HaloCard>
          ) : selected.length > 0 ? (
            <HaloCard
              interactive={false}
              emphasis
              translucent={false}
              padding="sm"
              surfaceClassName="gap-3"
            >
              <label className="flex cursor-pointer items-start gap-3 px-1 pt-0.5">
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
                        ? "border-destructive bg-white"
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
                  className="px-1 text-[12.5px] font-medium text-destructive"
                  role="alert"
                >
                  {notice === "consent" ? t("consentNeeded") : t("nameNeeded")}
                </p>
              )}
              <HaloButton
                size="lg"
                fullWidth
                leading={<Send aria-hidden />}
                onClick={send}
              >
                {t("send", { count: selected.length })}
              </HaloButton>
            </HaloCard>
          ) : (
            <HaloNotification
              variant="success"
              translucent={false}
              icon={<Check strokeWidth={3} aria-hidden />}
              title={t("thanksTitle")}
              description={t("thanksBody", { count: sentNow })}
              action={
                <HaloButton
                  tone="secondary"
                  fullWidth
                  leading={<ImagePlus aria-hidden />}
                  onClick={pickMore}
                >
                  {t("chooseMore")}
                </HaloButton>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
