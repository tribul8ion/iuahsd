import { describe, expect, it } from "vitest";
import { formatMarkSchedule } from "../schedule-label";
import type { MarkItem } from "../types";
import type { Entry } from "@/entities/entry";

const t = (key: string, vars?: Record<string, unknown>): string => {
  if (vars && "n" in vars) return `every ${vars.n} days`;
  const map: Record<string, string> = {
    "medications.morning": "Morning",
    "habit.frequency_daily": "Every day",
  };
  return map[key] ?? key;
};

const dayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function baseMark(overrides: Partial<MarkItem> = {}): Pick<
  MarkItem,
  "entry_frequency" | "entry_interval_days" | "entry_kind" | "schedule"
> {
  return {
    entry_frequency: "daily",
    entry_interval_days: null,
    entry_kind: "med",
    schedule: "morning",
    ...overrides,
  };
}

describe("formatMarkSchedule", () => {
  it("returns null for a once mark", () => {
    expect(
      formatMarkSchedule(baseMark({ entry_frequency: "once" }), undefined, { t, dayShort })
    ).toBeNull();
  });

  it("formats an interval mark from mark fields alone", () => {
    expect(
      formatMarkSchedule(
        baseMark({ entry_frequency: "interval", entry_interval_days: 5 }),
        undefined,
        { t, dayShort }
      )
    ).toBe("every 5 days");
  });

  it("falls back to the entry's interval_days when the mark lacks it", () => {
    const entry = { interval_days: 9 } as Entry;
    expect(
      formatMarkSchedule(baseMark({ entry_frequency: "interval" }), entry, { t, dayShort })
    ).toBe("every 9 days");
  });

  it("formats a weekly mark using the entry's days_of_week", () => {
    const entry = { days_of_week: 5 } as Entry;
    expect(
      formatMarkSchedule(baseMark({ entry_frequency: "weekly" }), entry, { t, dayShort })
    ).toBe("Mon · Wed");
  });

  it("shows the schedule label for a daily med mark", () => {
    expect(formatMarkSchedule(baseMark(), undefined, { t, dayShort })).toBe("Morning");
  });

  it("shows the daily habit label for non-med daily marks", () => {
    expect(
      formatMarkSchedule(baseMark({ entry_kind: "habit" }), undefined, { t, dayShort })
    ).toBe("Every day");
  });
});
