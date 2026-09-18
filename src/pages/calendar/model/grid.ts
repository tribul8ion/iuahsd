import { isoDate, todayISO } from "@/shared/lib";

export { isoDate, todayISO };

export interface GridDay {
  iso: string;
  day: number;
  inMonth: boolean;
}

const GRID_CELLS = 42;

export function buildMonthGrid(year: number, month: number): GridDay[] {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - firstWeekday);

  const days: GridDay[] = [];
  for (let i = 0; i < GRID_CELLS; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ iso: isoDate(d), day: d.getDate(), inMonth: d.getMonth() === month - 1 });
  }
  return days;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + delta;
  const y = Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  return { year: y, month: m + 1 };
}

export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export const CALENDAR_MONTH_RANGE = 12;

export function monthsBetween(
  from: { year: number; month: number },
  to: { year: number; month: number }
): number {
  return (to.year - from.year) * 12 + (to.month - from.month);
}

export function clampMonthShift(
  current: { year: number; month: number },
  delta: number,
  reference: { year: number; month: number }
): { year: number; month: number } {
  const next = shiftMonth(current.year, current.month, delta);
  const offset = monthsBetween(reference, next);
  if (offset < -CALENDAR_MONTH_RANGE || offset > CALENDAR_MONTH_RANGE) {
    return current;
  }
  return next;
}
