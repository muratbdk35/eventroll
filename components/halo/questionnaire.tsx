"use client";

// Adapted from uiable "Questionnaire" (MIT, CodedThemes,
// https://github.com/codedthemes/uiable) on the headless
// @shadcn/react/questionnaire: one question per screen, choices with letter
// shortcuts, previous/next/submit. Changes by eventroll: Halo styling
// (frosted choice cards with the warm rim, Halo buttons), a larger heading
// for single-question screens, and a slide/fade between questions.

import { Questionnaire as Q } from "@shadcn/react/questionnaire";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HaloButton } from "./halo-button";
import { haloRim } from "./glow";

export function Questionnaire({
  className,
  ...props
}: ComponentProps<typeof Q.Root>) {
  return (
    <Q.Root
      data-slot="questionnaire"
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

export function QuestionnaireItem({
  className,
  ...props
}: ComponentProps<typeof Q.Item>) {
  return (
    <Q.Item
      data-slot="questionnaire-item"
      data-multiple={props.multiple ? "" : undefined}
      className={cn(
        "question-in flex min-w-0 flex-col border-0 p-0 outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnaireTitle({
  className,
  ...props
}: ComponentProps<typeof Q.Title>) {
  return (
    <Q.Title
      data-slot="questionnaire-title"
      className={cn(
        "font-heading text-[1.65rem] leading-tight font-bold tracking-tight text-balance sm:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

export function QuestionnaireDescription({
  className,
  ...props
}: ComponentProps<typeof Q.Description>) {
  return (
    <Q.Description
      data-slot="questionnaire-description"
      className={cn(
        "mt-2 text-[15px] text-pretty text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Body of a question (inputs, choices, custom controls). */
export function QuestionnaireBody({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("mt-7 min-w-0", className)} {...props} />;
}

export function QuestionnaireChoices({
  className,
  ...props
}: ComponentProps<typeof Q.Choices>) {
  return (
    <Q.Choices
      data-slot="questionnaire-choices"
      className={cn("grid min-w-0 gap-2.5", className)}
      {...props}
    />
  );
}

export function QuestionnaireChoice({
  children,
  icon,
  className,
  ...props
}: ComponentProps<typeof Q.Choice> & { icon?: ReactNode }) {
  return (
    <Q.Choice
      data-slot="questionnaire-choice"
      className={cn(
        "group/choice relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border bg-card/80 px-3.5 py-3 text-start text-[15px] font-medium select-none",
        haloRim,
        "shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(0,0,0,0.03),0_6px_16px_-10px_rgba(60,30,10,0.18)]",
        "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out outline-none active:scale-[0.98]",
        "fine-hover:hover:border-ring/50 fine-hover:hover:bg-card",
        "has-[>input:focus-visible]:ring-2 has-[>input:focus-visible]:ring-ring/40",
        "data-checked:border-primary data-checked:bg-accent data-checked:shadow-[inset_0_0_0_1px_var(--primary),0_10px_24px_-14px_var(--primary)]",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Q.ChoiceInput className="absolute inset-0 z-10 size-full cursor-pointer opacity-0" />
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-data-checked/choice:bg-primary group-data-checked/choice:text-primary-foreground [&_svg]:size-[18px]">
          {icon}
        </span>
      )}
      <Q.ChoiceLabel className="min-w-0 flex-1 leading-snug">
        {children}
      </Q.ChoiceLabel>
      <Q.ChoiceShortcut className="pointer-events-none hidden size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-[11px] font-semibold text-muted-foreground group-data-checked/choice:hidden sm:group-data-[shortcut]/choice:inline-flex" />
      <span
        aria-hidden
        className="hidden size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground group-data-checked/choice:flex"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </Q.Choice>
  );
}

export function QuestionnaireError({
  className,
  ...props
}: ComponentProps<typeof Q.Error>) {
  return (
    <Q.Error
      data-slot="questionnaire-error"
      className={cn("mt-3 text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
}

export function QuestionnaireActions({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "mt-9 flex min-h-11 w-full items-center justify-end gap-3",
        className,
      )}
      {...props}
    />
  );
}

type NavProps = { children: string; className?: string };
type RenderProps = Record<string, unknown> & { hidden?: boolean };

export function QuestionnairePrevious({
  children,
  className,
  ...props
}: NavProps & Omit<ComponentProps<typeof Q.Previous>, "children">) {
  return (
    <Q.Previous
      {...props}
      render={(p: RenderProps) =>
        p.hidden ? (
          <span className="me-auto" />
        ) : (
          <HaloButton
            {...(p as ComponentProps<"button">)}
            tone="secondary"
            className={cn("me-auto", className)}
            leading={<ArrowLeft className="rtl:rotate-180" />}
          >
            {children}
          </HaloButton>
        )
      }
    />
  );
}

export function QuestionnaireNext({
  children,
  className,
  ...props
}: NavProps & Omit<ComponentProps<typeof Q.Next>, "children">) {
  return (
    <Q.Next
      {...props}
      render={(p: RenderProps) =>
        p.hidden ? (
          <span />
        ) : (
          <HaloButton
            {...(p as ComponentProps<"button">)}
            className={className}
            trailing={<ArrowRight />}
          >
            {children}
          </HaloButton>
        )
      }
    />
  );
}

export function QuestionnaireSubmit({
  children,
  className,
  trailing = <ArrowRight />,
  ...props
}: NavProps & { trailing?: ReactNode } & Omit<
    ComponentProps<typeof Q.Submit>,
    "children"
  >) {
  return (
    <Q.Submit
      {...props}
      render={(p: RenderProps) =>
        p.hidden ? (
          <span />
        ) : (
          <HaloButton
            {...(p as ComponentProps<"button">)}
            className={className}
            trailing={trailing}
          >
            {children}
          </HaloButton>
        )
      }
    />
  );
}
