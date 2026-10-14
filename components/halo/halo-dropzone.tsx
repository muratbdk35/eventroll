"use client";

// Adapted from cult/ui "Halo Dropzone" (MIT, nolly-studio/cult-ui): a frosted
// drop surface on a gradient rim, a floating icon, an edge trail while hovered,
// focused or dragged over, and the drag-depth counter so nested elements don't
// flicker the state. Changes by eventroll: photos only (the document and
// office glyphs are gone), our palette, a compact "add more" layout once
// photos are picked, and the parent owns the files (no built-in success
// state; the uploader shows its own).

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { HaloBlobs, haloFill, roundClip } from "./glow";
import { BorderTrail } from "./halo-card";

export type HaloDropzoneProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Big card when empty, slim row once something is picked. */
  compact?: boolean;
  icon: ReactNode;
  title: string;
  hint?: string;
  className?: string;
  /** Lets the parent open the picker (e.g. "add more" after sending). */
  inputRef?: RefObject<HTMLInputElement | null>;
};

export function HaloDropzone({
  onFiles,
  accept,
  multiple = true,
  disabled = false,
  compact = false,
  icon,
  title,
  hint,
  className,
  inputRef,
}: HaloDropzoneProps) {
  const reduce = useReducedMotion() ?? false;
  const inputId = useId();
  const ownInput = useRef<HTMLInputElement>(null);
  const input = inputRef ?? ownInput;
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const active = !disabled && (hover || focus || dragging);

  function emit(list: FileList | null) {
    if (!list || disabled) return;
    const files = Array.from(list);
    if (files.length) onFiles(files);
  }

  return (
    <div className={cn("relative w-full", className)}>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          emit(e.target.files);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={hint ? `${title}. ${hint}` : title}
        className={cn(
          "group relative block cursor-pointer rounded-[1.6rem] outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "transition-transform duration-200 ease-out active:scale-[0.985]",
          disabled && "pointer-events-none cursor-not-allowed opacity-60",
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            input.current?.click();
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          emit(e.dataTransfer.files);
        }}
      >
        <div className="relative rounded-[1.6rem] p-px">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.6rem]"
            style={roundClip("1.6rem")}
          >
            <HaloBlobs
              active={active}
              size="lg"
              height="h-[62%]"
              opacity={active ? 0.95 : 0.7}
            />
          </div>
          <div
            className={cn(
              "relative z-0 rounded-[calc(1.6rem-1px)] border border-border/90",
              "shadow-[0_1px_0_rgba(255,255,255,0.75)_inset,0_1px_2px_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(60,30,10,0.3)]",
              "transition-[border-color,box-shadow] duration-200 ease-out",
              active && "border-ring/50",
              dragging &&
                "shadow-[0_1px_0_rgba(255,255,255,0.75)_inset,0_24px_48px_-20px_rgba(194,65,12,0.35)]",
            )}
            style={{ background: haloFill(true, active) }}
          >
            <AnimatePresence initial={false} mode="wait">
              {compact ? (
                <motion.div
                  key="compact"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_var(--primary)] [&_svg]:size-5">
                    {icon}
                  </span>
                  <span className="text-[15px] font-semibold">{title}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex min-h-56 flex-col items-center justify-center gap-1 px-6 py-9 text-center"
                >
                  <motion.span
                    aria-hidden
                    animate={reduce || disabled ? { y: 0 } : { y: [0, -4, 0] }}
                    transition={{
                      duration: 4.5,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                    className="mb-4 flex size-[4.5rem] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_30px_-12px_var(--primary)] ring-[6px] ring-white/80 [&_svg]:size-8"
                  >
                    {icon}
                  </motion.span>
                  <span className="font-heading text-2xl font-semibold tracking-tight text-balance">
                    {title}
                  </span>
                  {hint && (
                    <span className="text-sm text-pretty text-muted-foreground">
                      {hint}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!disabled && !reduce && (
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-[1.6rem]"
              style={roundClip("1.6rem")}
            >
              <BorderTrail active={active} radius={25} />
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
