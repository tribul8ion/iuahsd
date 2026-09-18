import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  CALENDAR_MONTH_RANGE,
  clampMonthShift,
  isoDate,
  monthPrefix,
  monthsBetween,
  shiftMonth,
} from "../grid";

describe("isoDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(isoDate(new Date(2026, 3, 7))).toBe("2026-04-07");
  });

  it("pads single-digit month and day", () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("buildMonthGrid", () => {
  it("returns exactly 42 cells", () => {
    expect(buildMonthGrid(2026, 4)).toHaveLength(42);
  });

  it("starts the grid on a Monday", () => {
    const grid = buildMonthGrid(2026, 4);
    const firstDate = new Date(grid[0].iso);
    expect((firstDate.getDay() + 6) % 7).toBe(0);
  });

  it("marks days belonging to the requested month", () => {
    const grid = buildMonthGrid(2026, 4);
    const inMonthDays = grid.filter((d) => d.inMonth);
    expect(inMonthDays).toHaveLength(30);
    expect(inMonthDays[0].iso).toBe("2026-04-01");
    expect(inMonthDays[inMonthDays.length - 1].iso).toBe("2026-04-30");
  });

  it("includes padding days from the previous and next month", () => {
    const grid = buildMonthGrid(2026, 4);
    expect(grid[0].inMonth).toBe(false);
    expect(grid[grid.length - 1].inMonth).toBe(false);
  });
});

describe("shiftMonth", () => {
  it("moves forward within the same year", () => {
    expect(shiftMonth(2026, 4, 1)).toEqual({ year: 2026, month: 5 });
  });

  it("moves backward within the same year", () => {
    expect(shiftMonth(2026, 4, -1)).toEqual({ year: 2026, month: 3 });
  });

  it("wraps forward into the next year", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("wraps backward into the previous year", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("monthPrefix", () => {
  it("formats a zero-padded year-month prefix", () => {
    expect(monthPrefix(2026, 4)).toBe("2026-04");
    expect(monthPrefix(2026, 11)).toBe("2026-11");
  });
});

describe("monthsBetween", () => {
  it("returns 0 for the same month", () => {
    expect(monthsBetween({ year: 2026, month: 4 }, { year: 2026, month: 4 })).toBe(0);
  });

  it("returns a positive count moving forward, including across years", () => {
    expect(monthsBetween({ year: 2026, month: 4 }, { year: 2026, month: 7 })).toBe(3);
    expect(monthsBetween({ year: 2026, month: 11 }, { year: 2027, month: 2 })).toBe(3);
  });

  it("returns a negative count moving backward, including across years", () => {
    expect(monthsBetween({ year: 2026, month: 7 }, { year: 2026, month: 4 })).toBe(-3);
    expect(monthsBetween({ year: 2027, month: 2 }, { year: 2026, month: 11 })).toBe(-3);
  });
});

describe("clampMonthShift", () => {
  const reference = { year: 2026, month: 4 };

  it("shifts forward within the 12-month range", () => {
    expect(clampMonthShift(reference, 1, reference)).toEqual({ year: 2026, month: 5 });
  });

  it("shifts backward within the 12-month range", () => {
    expect(clampMonthShift(reference, -1, reference)).toEqual({ year: 2026, month: 3 });
  });

  it("allows reaching exactly the +12 month boundary", () => {
    const atBoundary = { year: 2027, month: 4 };
    expect(monthsBetween(reference, atBoundary)).toBe(CALENDAR_MONTH_RANGE);
    expect(clampMonthShift(atBoundary, 0, reference)).toEqual(atBoundary);
  });

  it("blocks moving past the +12 month boundary and returns the unchanged month", () => {
    const atBoundary = { year: 2027, month: 4 };
    expect(clampMonthShift(atBoundary, 1, reference)).toEqual(atBoundary);
  });

  it("allows reaching exactly the -12 month boundary", () => {
    const atBoundary = { year: 2025, month: 4 };
    expect(monthsBetween(reference, atBoundary)).toBe(-CALENDAR_MONTH_RANGE);
    expect(clampMonthShift(atBoundary, 0, reference)).toEqual(atBoundary);
  });

  it("blocks moving past the -12 month boundary and returns the unchanged month", () => {
    const atBoundary = { year: 2025, month: 4 };
    expect(clampMonthShift(atBoundary, -1, reference)).toEqual(atBoundary);
  });
});
