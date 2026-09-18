import { Sunrise, Sun, Moon, Clock, type LucideIcon } from "lucide-react";
import type { EntrySchedule } from "./types";

export const SCHEDULES: EntrySchedule[] = ["morning", "day", "evening", "custom"];

export const DEFAULT_TIMES: Record<EntrySchedule, string> = {
  morning: "08:00",
  day: "13:00",
  evening: "20:00",
  custom: "12:00",
};

export const SCHEDULE_ICONS: Record<EntrySchedule, LucideIcon> = {
  morning: Sunrise,
  day: Sun,
  evening: Moon,
  custom: Clock,
};

export const INTERVAL_MIN = 2;
export const INTERVAL_DEFAULT = 7;
export const MED_INTERVAL_MAX = 30;
export const HABIT_INTERVAL_MAX = 365;

export function clampInterval(
  value: number,
  max: number,
  min: number = INTERVAL_MIN
): number {
  if (Number.isNaN(value)) return INTERVAL_DEFAULT;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function parseDosageAmount(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}
