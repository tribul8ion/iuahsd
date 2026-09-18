import { notificationState } from "../notification-state";
import type { Entry } from "../types";

const baseEntry: Entry = {
  id: 1,
  kind: "med",
  name: "Aspirin",
  doseAmount: null,
  doseUnit: null,
  notes: null,
  schedule: "morning",
  time: "08:00",
  frequency_type: "daily",
  interval_days: null,
  days_of_week: null,
  date_once: null,
  tag: null,
  color: null,
  start_date: null,
  active: true,
  notifications_enabled: true,
  muted_today: false,
  streak_current: 0,
  streak_best: 0,
  next_run_at: null,
  last_sent_at: null,
  created_at: "2026-01-01T00:00:00Z",
  pre_remind: null,
  project_id: null,
  done: null,
  corrupted: false,
};

describe("notificationState", () => {
  it("is on when notifications are enabled and the day is not muted", () => {
    expect(notificationState(baseEntry)).toBe("on");
  });

  it("is muted_today when the entry is silenced for the current day only", () => {
    expect(notificationState({ ...baseEntry, muted_today: true })).toBe("muted_today");
  });

  it("is off when notifications are disabled", () => {
    expect(notificationState({ ...baseEntry, notifications_enabled: false })).toBe("off");
  });

  it("prefers off over muted_today when both apply", () => {
    expect(
      notificationState({ ...baseEntry, notifications_enabled: false, muted_today: true })
    ).toBe("off");
  });
});
