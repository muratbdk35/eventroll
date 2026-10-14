"use client";

// Adapted from cult/ui "Halo Notification" (MIT, nolly-studio/cult-ui): a
// Halo card that slides in, with the title and body revealed glyph by glyph,
// and a green rim for success. Changes by eventroll: our card and palette,
// an optional leading icon and action slot (e.g. "add more photos").

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StaggeredText } from "./halo-button";
import { HaloCard } from "./halo-card";

export type HaloNotificationProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "success";
  politeness?: "status" | "alert";
  translucent?: boolean;
  className?: string;
};

export function HaloNotification({
  title,
  description,
  icon,
  action,
  variant = "default",
  politeness = "status",
  translucent = true,
  className,
}: HaloNotificationProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      role={politeness}
      aria-live={politeness === "alert" ? "assertive" : "polite"}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.12 : 0.25, ease: "easeOut" }}
      className={cn("w-full", className)}
    >
      <HaloCard
        interactive={false}
        emphasis
        padding="sm"
        surfaceClassName="gap-3"
        translucent={translucent}
        rim={variant === "success" ? "success" : "default"}
        glow={variant === "success"}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full [&_svg]:size-6",
                variant === "success"
                  ? "bg-success text-white shadow-[0_10px_22px_-10px_var(--success)]"
                  : "bg-accent text-primary",
              )}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
            <p className="font-heading text-lg leading-snug font-semibold text-balance">
              <StaggeredText text={title} stagger={0.02} duration={0.2} />
            </p>
            {description && (
              <p className="text-sm text-pretty text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </HaloCard>
    </motion.div>
  );
}
