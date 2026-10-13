"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      language?: string;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Cloudflare Turnstile (managed mode). Calls `onToken(null)` on failure/expiry. */
export function Turnstile({
  siteKey,
  onToken,
  language,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  language?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    let widget: string | undefined;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widget = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme: "light",
          language,
          callback: (token) => cb.current(token),
          "error-callback": () => cb.current(null),
          "expired-callback": () => cb.current(null),
        });
      })
      .catch(() => cb.current(null));
    return () => {
      cancelled = true;
      if (widget) window.turnstile?.remove(widget);
    };
  }, [siteKey, language]);

  return <div ref={ref} className="flex min-h-[65px] justify-center" />;
}
