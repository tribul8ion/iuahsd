import type { FrequencyType } from "./types";

export function toggleDayBit(mask: number, dayIndex: number): number {
  return mask ^ (1 << dayIndex);
}

export function hasDayBit(mask: number, dayIndex: number): boolean {
  return (mask & (1 << dayIndex)) !== 0;
}

export function selectedDaysFromMask(mask: number): number[] {
  const days: number[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    if (hasDayBit(mask, dayIndex)) {
      days.push(dayIndex);
    }
  }
  return days;
}

export function maskFromSelectedDays(days: readonly number[]): number {
  return days.reduce((mask, day) => mask | (1 << day), 0);
}

export interface HabitFrequencyLabels {
  daily: string;
  everyNDays: (n: number) => string;
  dayShort: readonly string[];
}

export function formatHabitFrequency(
  frequencyType: FrequencyType,
  intervalDays: number | null,
  daysOfWeek: number | null,
  labels: HabitFrequencyLabels
): string {
  if (frequencyType === "daily") {
    return labels.daily;
  }
  if (frequencyType === "interval") {
    return labels.everyNDays(intervalDays ?? 0);
  }
  return selectedDaysFromMask(daysOfWeek ?? 0)
    .map((day) => labels.dayShort[day])
    .join(" · ");
}
