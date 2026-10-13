"use client";

import { Check, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyLinkButton({
  link,
  className,
  variant = "outline",
}: {
  link: string;
  className?: string;
  variant?: "outline" | "secondary" | "default";
}) {
  const t = useTranslations("Events");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link stays visible on the Share tab.
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={copy}
      className={cn("h-10 rounded-xl px-4", className)}
      aria-live="polite"
    >
      {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
      {copied ? t("linkCopied") : t("copyLink")}
    </Button>
  );
}
