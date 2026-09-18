import { formatMemberSinceDate, computeBestStreak } from "../stats";
import type { Entry } from "@/entities/entry";
import { mockEntries } from "@/test/mocks/handlers";

describe("formatMemberSinceDate", () => {
  it("returns the genitive month form for Russian", () => {
    expect(formatMemberSinceDate("2026-07-12T00:00:00Z", "ru")).toBe("июля 2026");
  });

  it("returns the long month form for English", () => {
    expect(formatMemberSinceDate("2026-07-12T00:00:00Z", "en")).toBe("July 2026");
  });

  it("returns null when created_at is null", () => {
    expect(formatMemberSinceDate(null, "en")).toBeNull();
  });

  it("returns null when created_at is not a valid date", () => {
    expect(formatMemberSinceDate("not-a-date", "en")).toBeNull();
  });
});

describe("computeBestStreak", () => {
  it("returns 0 when entries is undefined", () => {
    expect(computeBestStreak(undefined)).toBe(0);
  });

  it("returns 0 when entries is empty", () => {
    expect(computeBestStreak([])).toBe(0);
  });

  it("returns the maximum streak_best across all entries", () => {
    const entries: Entry[] = [
      { ...mockEntries[0], streak_best: 3 },
      { ...mockEntries[1], streak_best: 12 },
      { ...mockEntries[2], streak_best: 7 },
    ];
    expect(computeBestStreak(entries)).toBe(12);
  });

  it("returns 0 when all streaks are 0", () => {
    const entries: Entry[] = [
      { ...mockEntries[0], streak_best: 0 },
      { ...mockEntries[1], streak_best: 0 },
    ];
    expect(computeBestStreak(entries)).toBe(0);
  });
});
