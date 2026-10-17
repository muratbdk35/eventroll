import { describe, expect, it } from "vitest";
import { DAY, noticeDue } from "@/lib/events/notices";

const now = new Date("2026-06-20T07:00:00Z");
const ev = (daysLeft: number, sent: Partial<Record<string, Date>> = {}) => ({
  expiresAt: new Date(now.getTime() + daysLeft * DAY),
  albumReadyMailAt: sent.ready ?? null,
  reminder3MailAt: sent.r3 ?? null,
  reminder1MailAt: sent.r1 ?? null,
});

describe("noticeDue", () => {
  it("sends 'album ready' first", () => {
    expect(noticeDue(ev(6), now)).toBe("albumReady");
  });
  it("then nothing until three days are left", () => {
    expect(noticeDue(ev(5, { ready: now }), now)).toBeNull();
    expect(noticeDue(ev(2.5, { ready: now }), now)).toBe("reminder3");
  });
  it("sends the 3-day reminder once", () => {
    expect(noticeDue(ev(2, { ready: now, r3: now }), now)).toBeNull();
  });
  it("sends the last reminder within a day, once", () => {
    expect(noticeDue(ev(0.5, { ready: now, r3: now }), now)).toBe("reminder1");
    expect(
      noticeDue(ev(0.5, { ready: now, r3: now, r1: now }), now),
    ).toBeNull();
  });
  it("sends 'album ready' even when the event enters the last days unnotified", () => {
    expect(noticeDue(ev(2), now)).toBe("albumReady");
  });
  it("sends nothing once the window is over", () => {
    expect(noticeDue(ev(-1), now)).toBeNull();
  });
});
