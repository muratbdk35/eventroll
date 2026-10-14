import type { EVENT_TYPES } from "@/lib/events/schemas";

/**
 * Everything the host fills in before having an account. Kept in this browser
 * only (localStorage) until sign-in, then saved as a real event and cleared.
 * Times are `datetime-local` values in the host's own time zone.
 */
export type Draft = {
  name: string;
  type: (typeof EVENT_TYPES)[number];
  starts: string;
  ends: string;
  requireName: boolean;
  pinOn: boolean;
  pin: string;
  hoursOn: boolean;
  opens: string;
  closes: string;
  perPhoneOn: boolean;
  perPhone: string;
};

const KEY = "eventroll:draft";

export function localInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Default: today 19:00 (or the next full hour if later) for five hours. */
export function emptyDraft(): Draft {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  if (start.getHours() < 19) start.setHours(19);
  else start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 5 * 3_600_000);
  return {
    name: "",
    type: "wedding",
    starts: localInput(start),
    ends: localInput(end),
    requireName: false,
    pinOn: false,
    pin: "",
    hoursOn: false,
    opens: "",
    closes: "",
    perPhoneOn: false,
    perPhone: "50",
  };
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? { ...emptyDraft(), ...(JSON.parse(raw) as Partial<Draft>) }
      : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Private mode or full storage: the flow still works within this page.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Problems that block "continue", shared by the form and the save step. */
export function draftProblems(d: Draft) {
  return {
    name: !d.name.trim(),
    range: !(new Date(d.ends) > new Date(d.starts)),
    pin: d.pinOn && !/^\d{4,8}$/.test(d.pin),
    hours:
      d.hoursOn &&
      !(d.opens && d.closes && new Date(d.closes) > new Date(d.opens)),
  };
}

export function draftOk(d: Draft) {
  return !Object.values(draftProblems(d)).some(Boolean);
}

/** Server action payload for `createEventFromDraft`. */
export function draftPayload(d: Draft) {
  const iso = (v: string) => new Date(v).toISOString();
  return [
    {
      name: d.name.trim(),
      type: d.type,
      startsAt: iso(d.starts),
      endsAt: iso(d.ends),
      eventDate: d.starts.slice(0, 10),
    },
    {
      requireName: d.requireName,
      pin: d.pinOn ? d.pin : undefined,
      uploadOpensAt: d.hoursOn && d.opens ? iso(d.opens) : null,
      uploadClosesAt: d.hoursOn && d.closes ? iso(d.closes) : null,
      maxUploadsPerDevice:
        d.perPhoneOn && d.perPhone ? Number(d.perPhone) : null,
    },
  ] as const;
}
