import { describe, expect, it } from "vitest";
import {
  formatHabitFrequency,
  hasDayBit,
  maskFromSelectedDays,
  selectedDaysFromMask,
  toggleDayBit,
} from "../frequency";

const LABELS = {
  daily: "Every day",
  everyNDays: (n: number) => `every ${n} days`,
  dayShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

describe("day bitmask helpers", () => {
  it("sets Mon=1, Tue=2, Wed=4 ... Sun=64", () => {
    expect(maskFromSelectedDays([0])).toBe(1);
    expect(maskFromSelectedDays([1])).toBe(2);
    expect(maskFromSelectedDays([2])).toBe(4);
    expect(maskFromSelectedDays([6])).toBe(64);
  });

  it("combines multiple days into one mask", () => {
    expect(maskFromSelectedDays([0, 2, 4])).toBe(1 + 4 + 16);
  });

  it("recovers the original day list from a mask", () => {
    expect(selectedDaysFromMask(21)).toEqual([0, 2, 4]);
  });

  it("returns an empty list for a zero mask", () => {
    expect(selectedDaysFromMask(0)).toEqual([]);
  });

  it("detects an individual day bit", () => {
    expect(hasDayBit(21, 0)).toBe(true);
    expect(hasDayBit(21, 1)).toBe(false);
  });

  it("toggles a day bit on and off", () => {
    const withMonday = toggleDayBit(0, 0);
    expect(withMonday).toBe(1);
    expect(toggleDayBit(withMonday, 0)).toBe(0);
  });
});

describe("formatHabitFrequency", () => {
  it("returns the daily label for daily frequency", () => {
    expect(formatHabitFrequency("daily", null, null, LABELS)).toBe("Every day");
  });

  it("returns an interval label for interval frequency", () => {
    expect(formatHabitFrequency("interval", 3, null, LABELS)).toBe("every 3 days");
  });

  it("treats a missing interval as zero", () => {
    expect(formatHabitFrequency("interval", null, null, LABELS)).toBe("every 0 days");
  });

  it("lists short day labels for weekly frequency", () => {
    expect(formatHabitFrequency("weekly", null, 21, LABELS)).toBe("Mon · Wed · Fri");
  });

  it("returns an empty string for weekly with no days selected", () => {
    expect(formatHabitFrequency("weekly", null, 0, LABELS)).toBe("");
  });

  it("treats a missing days_of_week as zero for weekly", () => {
    expect(formatHabitFrequency("weekly", null, null, LABELS)).toBe("");
  });
});
