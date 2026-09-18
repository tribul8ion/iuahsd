import { formatHabitFrequency } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import type { MarkItem } from "./types";

export interface ScheduleLabelDeps {
  t: (key: string, vars?: Record<string, unknown>) => string;
  dayShort: readonly string[];
}

export function formatMarkSchedule(
  mark: Pick<MarkItem, "entry_frequency" | "entry_interval_days" | "entry_kind" | "schedule">,
  entry: Entry | undefined,
  deps: ScheduleLabelDeps
): string | null {
  const { t, dayShort } = deps;

  if (mark.entry_frequency === "once") {
    return null;
  }
  if (mark.entry_frequency === "interval") {
    return t("habit.every_n_days", { n: mark.entry_interval_days ?? entry?.interval_days ?? 0 });
  }
  if (mark.entry_frequency === "weekly") {
    return formatHabitFrequency("weekly", null, entry?.days_of_week ?? null, {
      daily: t("habit.frequency_daily"),
      everyNDays: (n) => t("habit.every_n_days", { n }),
      dayShort: [...dayShort],
    });
  }
  if (mark.entry_kind === "med") {
    return t(`medications.${mark.schedule}`);
  }
  return t("habit.frequency_daily");
}
