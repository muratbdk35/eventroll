"use client";

import { AlertDialog } from "radix-ui";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/*
 * An in-app replacement for window.confirm(): styled like the rest of the app
 * and without the browser's "<site> says" header. `askConfirm()` resolves to
 * true or false; one <ConfirmHost /> in the root layout shows the dialog.
 */

type Ask = {
  message: string;
  confirm: string;
  cancel: string;
  destructive?: boolean;
};

type Pending = Ask & { resolve: (ok: boolean) => void };

let show: ((p: Pending) => void) | null = null;

export function askConfirm(ask: Ask): Promise<boolean> {
  // Before the host mounts (should not happen), fall back to the browser.
  if (!show) return Promise.resolve(window.confirm(ask.message));
  return new Promise((resolve) => show?.({ ...ask, resolve }));
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  useEffect(() => {
    show = setPending;
    return () => {
      show = null;
    };
  }, []);

  const answer = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <AlertDialog.Root
      open={pending !== null}
      onOpenChange={(open) => !open && answer(false)}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-[oklch(0.2_0.02_250/0.4)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="text-[15px] leading-relaxed font-medium text-pretty">
            {pending?.message}
          </AlertDialog.Title>
          <AlertDialog.Description className="sr-only">
            {pending?.message}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" className="h-11 rounded-full px-5">
                {pending?.cancel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={pending?.destructive ? "destructive" : "default"}
                className="h-11 rounded-full px-5 font-semibold"
                onClick={() => answer(true)}
              >
                {pending?.confirm}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
