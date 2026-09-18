import { Sunrise, Sun, Moon, type LucideIcon } from "lucide-react";

export type DaySlot = "morning" | "day" | "evening";

const MORNING_START_MIN = 4 * 60;
const DAY_START_MIN = 12 * 60;
const EVENING_START_MIN = 18 * 60;

export function daySlotForTime(time: string): DaySlot {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw ?? "0");
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes >= MORNING_START_MIN && totalMinutes < DAY_START_MIN) return "morning";
  if (totalMinutes >= DAY_START_MIN && totalMinutes < EVENING_START_MIN) return "day";
  return "evening";
}

export const DAY_SLOT_ICONS: Record<DaySlot, LucideIcon> = {
  morning: Sunrise,
  day: Sun,
  evening: Moon,
};

export const DAY_SLOT_COLORS: Record<DaySlot, { icon: string; bg: string }> = {
  morning: { icon: "#D97706", bg: "#FEF3C7" },
  day: { icon: "#EA580C", bg: "#FFEDD5" },
  evening: { icon: "#7C3AED", bg: "#EDE9FE" },
};
