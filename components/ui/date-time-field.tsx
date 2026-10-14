"use client";

import { de, enGB, tr } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const dayPickerLocales = { tr, de, en: enGB } as const;

const pad = (n: number) => String(n).padStart(2, "0");
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Date + time picker built on the shadcn/ui Calendar and Popover. The value
 * is a local "YYYY-MM-DDTHH:mm" string, like <input type="datetime-local">.
 */
export function DateTimeField({
  id,
  value,
  onChange,
  min,
  max,
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable day (same format as `value`). */
  min?: string;
  /** Latest selectable day (same format as `value`). */
  max?: string;
  invalid?: boolean;
}) {
  const locale = useLocale() as keyof typeof dayPickerLocales;
  const format = useFormatter();
  const t = useTranslations("Events");
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;
  const time = value ? value.slice(11, 16) : "19:00";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-12 w-full items-center gap-3 rounded-2xl border bg-card ps-2 pe-3 text-start shadow-xs transition-all duration-200 ease-out outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=open]:border-primary/50 data-[state=open]:shadow-md",
            invalid ? "border-destructive" : "border-input",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <CalendarDays className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
            {date
              ? format.dateTime(date, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </span>
          <span className="rounded-full bg-accent px-2.5 py-1 text-sm font-semibold text-accent-foreground tabular-nums">
            {time}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-2xl border-border/70 p-0 shadow-xl shadow-primary/10"
      >
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          locale={dayPickerLocales[locale] ?? enGB}
          weekStartsOn={1}
          disabled={[
            ...(min ? [{ before: new Date(`${min.slice(0, 10)}T00:00`) }] : []),
            ...(max ? [{ after: new Date(`${max.slice(0, 10)}T00:00`) }] : []),
          ]}
          onSelect={(d) => d && onChange(`${dateKey(d)}T${time}`)}
          className="rounded-2xl"
        />
        <div className="flex items-center gap-2 border-t border-border/70 p-3">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="time"
            step={900}
            aria-label={t("timeLabel")}
            value={time}
            onChange={(e) => {
              if (!e.target.value) return;
              onChange(
                `${value ? value.slice(0, 10) : dateKey(new Date())}T${e.target.value}`,
              );
            }}
            className="h-9 rounded-xl border border-input bg-background px-3 text-sm font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ms-auto h-9 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-200 ease-out active:scale-95"
          >
            {t("done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
