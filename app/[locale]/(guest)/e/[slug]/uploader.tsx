"use client";

import {
  Camera,
  CheckCircle2,
  ImageIcon,
  ImagePlus,
  KeyRound,
  Loader2,
  RotateCw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { isAllowedMime, MAX_FILE_BYTES, type AllowedMime } from "@/lib/uploads";

type Props = {
  slug: string;
  requireName: boolean;
  hasPin: boolean;
  maxPerDevice: number | null;
  verified: boolean;
  initialMine: { id: string; src: string | null }[];
  turnstileSiteKey: string | undefined;
};

type Item = {
  key: string;
  file: File;
  mime: AllowedMime;
  preview: string;
  status: "queued" | "uploading" | "done" | "error";
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

async function put(target: Presigned, body: Blob) {
  const res = await fetch(target.url, {
    method: "PUT",
    headers: target.headers,
    body,
  });
  if (!res.ok) throw new Error(`upload ${res.status}`);
}

export function Uploader(props: Props) {
  const t = useTranslations("Guest");
  const locale = useLocale();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [verified, setVerified] = useState(props.verified);
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [pin, setPin] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [name, setName] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const patch = (key: string, p: Partial<Item>) =>
    setItems((all) => all.map((i) => (i.key === key ? { ...i, ...p } : i)));

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

  async function upload(entries: Item[]) {
    setBusy(true);
    const prepared = await Promise.all(
      entries.map(async (item) => ({
        item,
        thumb: await makeThumb(item.file),
      })),
    );
    for (let i = 0; i < prepared.length; i += 20) {
      const batch = prepared.slice(i, i + 20);
      batch.forEach(({ item }) => patch(item.key, { status: "uploading" }));
      const res = await fetch(`/api/guest/${props.slug}/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploaderName: name.trim() || undefined,
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
            await put(up.original, item.file);
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
            } else patch(item.key, { status: "done" });
          } catch {
            patch(item.key, { status: "error", error: "failed" });
          }
        }
      };
      await Promise.all([worker(), worker(), worker()]);
    }
    setBusy(false);
  }

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    const next: Item[] = files.map((file) => {
      const mime = mimeOf(file);
      const base = {
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
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
      return { ...base, mime, status: "queued" };
    });
    setItems((all) => [...next, ...all]);
    const ok = next.filter((i) => i.status === "queued");
    if (ok.length) void upload(ok);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    addFiles(files);
  }

  function retry(item: Item) {
    patch(item.key, { status: "queued", error: undefined });
    void upload([item]);
  }

  // ── gate ────────────────────────────────────────────────────────────
  if (!verified) {
    const needsPin = props.hasPin;
    return (
      <div className="space-y-5">
        {needsPin && (
          <div className="text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" aria-hidden />
            </span>
            <label
              htmlFor="pin"
              className="mt-3 block text-[17px] font-semibold"
            >
              {t("pinTitle")}
            </label>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("pinSubtitle")}
            </p>
            <Input
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
              className="mx-auto mt-4 h-12 max-w-52 rounded-xl bg-background text-center font-mono text-xl tracking-[0.5em]"
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
            className="rounded-xl bg-destructive/10 px-4 py-2.5 text-center text-sm text-destructive"
            role="alert"
          >
            {gateError}
          </p>
        )}
        {needsPin ? (
          <Button
            className="h-12 w-full rounded-xl text-[15px]"
            disabled={gateBusy || !token || pin.length < 4}
            onClick={() => void submitGate()}
          >
            {gateBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {t("continue")}
          </Button>
        ) : (
          <p
            className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"
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

  // ── upload ──────────────────────────────────────────────────────────
  const total = items.filter((i) => i.status !== "error").length;
  const done = items.filter((i) => i.status === "done").length;
  const nameMissing = props.requireName && !name.trim();
  const hasAny = items.length > 0 || props.initialMine.length > 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const pick = () => {
    if (!nameMissing) fileInput.current?.click();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="uploader-name" className="text-sm font-medium">
          {props.requireName ? t("yourName") : t("yourNameOptional")}
        </label>
        <Input
          id="uploader-name"
          maxLength={60}
          autoComplete="name"
          required={props.requireName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl bg-background text-base"
        />
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        onChange={onPick}
        tabIndex={-1}
        aria-hidden
      />

      {/* Tap target on phones, drop zone on desktop. */}
      <div
        onClick={pick}
        onDragOver={(e) => {
          if (nameMissing) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!nameMissing) addFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-5 pt-7 pb-5 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:bg-muted/50",
          nameMissing && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-4 ring-primary/5">
          <Camera className="size-6" aria-hidden />
        </span>

        <p className="mt-3 text-[13px] text-muted-foreground">
          <span className="hidden sm:inline">{t("dropHint")} · </span>
          {t("formats")}
        </p>
        <button
          type="button"
          disabled={nameMissing}
          onClick={(e) => {
            e.stopPropagation();
            pick();
          }}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none active:scale-[0.99] disabled:pointer-events-none"
        >
          <ImagePlus className="size-5" aria-hidden />
          {hasAny ? t("chooseMore") : t("choose")}
        </button>
      </div>

      {total > 0 && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            busy
              ? "border-border bg-background"
              : "border-success/25 bg-success/[0.06]",
          )}
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 text-sm">
            {busy ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : (
              <CheckCircle2
                className="size-4 shrink-0 text-success"
                aria-hidden
              />
            )}
            <p className="flex-1 font-medium">
              {busy
                ? t("uploading", { done, total })
                : t("done", { count: done })}
            </p>
            {busy && (
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {pct}%
              </span>
            )}
          </div>
          {busy && (
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {hasAny && (
        <section aria-labelledby="mine">
          <h2
            id="mine"
            className="mb-2 text-sm font-medium text-muted-foreground"
          >
            {t("yourUploads")}
          </h2>
          <ul className="grid grid-cols-3 gap-1">
            {items.map((item) => (
              <li
                key={item.key}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  src={item.preview}
                  alt=""
                  className="size-full object-cover"
                />
                {item.status === "uploading" || item.status === "queued" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2
                      className="size-5 animate-spin text-white"
                      aria-hidden
                    />
                  </span>
                ) : item.status === "done" ? (
                  <CheckCircle2
                    className="absolute end-1 bottom-1 size-[18px] rounded-full bg-white text-success"
                    aria-hidden
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      item.error === "failed" ? retry(item) : undefined
                    }
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 p-1.5 text-center text-[11px] leading-tight font-medium text-white"
                  >
                    {item.error === "failed" && (
                      <RotateCw className="size-4" aria-hidden />
                    )}
                    {item.error === "failed"
                      ? t("retry")
                      : item.error === "limitReached"
                        ? t("limitReached", { count: props.maxPerDevice ?? 0 })
                        : t(item.error ?? "failed")}
                  </button>
                )}
              </li>
            ))}
            {props.initialMine.map((m) => (
              <li
                key={m.id}
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted"
              >
                {m.src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                  <img src={m.src} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon
                    className="size-5 text-muted-foreground"
                    aria-hidden
                  />
                )}
                <CheckCircle2
                  className="absolute end-1 bottom-1 size-[18px] rounded-full bg-white text-success"
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
