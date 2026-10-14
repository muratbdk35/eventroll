"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Label, read-only guest link and a copy button (share view, landing). */
export function GuestLinkField({
  link,
  id = "guest-link",
}: {
  link: string;
  id?: string;
}) {
  const t = useTranslations("Events.share");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link stays visible and selectable.
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {t("linkLabel")}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={id}
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-muted/30 px-3 font-mono text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <Button
          type="button"
          variant="default"
          className="h-9 rounded-full px-4"
          onClick={copy}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          <span className="hidden sm:inline">
            {copied ? t("copied") : t("copy")}
          </span>
        </Button>
      </div>
    </div>
  );
}
