import { describe, expect, it } from "vitest";
import { formatPreRemindSummary } from "../pre-remind-summary";

const t = (key: string): string => {
  const map: Record<string, string> = {
    "once.pre_phrase_1440": "a day before",
    "once.pre_phrase_180": "3 hours before",
    "once.pre_phrase_30": "30 minutes before",
    "calendar.and": "and",
  };
  return map[key] ?? key;
};

describe("formatPreRemindSummary", () => {
  it("returns null for empty or missing input", () => {
    expect(formatPreRemindSummary(null, t)).toBeNull();
    expect(formatPreRemindSummary(undefined, t)).toBeNull();
    expect(formatPreRemindSummary([], t)).toBeNull();
  });

  it("returns a single phrase unchanged", () => {
    expect(formatPreRemindSummary([1440], t)).toBe("a day before");
  });

  it("joins two phrases with 'and'", () => {
    expect(formatPreRemindSummary([1440, 180], t)).toBe("a day before and 3 hours before");
  });

  it("joins three phrases with commas and a trailing 'and'", () => {
    expect(formatPreRemindSummary([1440, 180, 30], t)).toBe(
      "a day before, 3 hours before and 30 minutes before"
    );
  });
});
