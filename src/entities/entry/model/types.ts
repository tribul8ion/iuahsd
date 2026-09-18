export type EntryKind = "med" | "habit" | "task" | "doc" | "note";

export type EntrySchedule = "morning" | "day" | "evening" | "custom";

export type FrequencyType = "daily" | "interval" | "weekly" | "once" | "none";

export const PRE_REMIND_OPTIONS = [30, 60, 180, 720, 1440, 2880] as const;

export type PreRemindMinutes = (typeof PRE_REMIND_OPTIONS)[number];

export type DosageUnit = "tablet" | "ml" | "drop" | "mg" | "iu" | "pcs";

export interface EntryDto {
  id: number;
  kind: EntryKind;
  payload_encrypted: string;
  schedule: EntrySchedule;
  time: string;
  frequency_type: FrequencyType;
  interval_days: number | null;
  days_of_week: number | null;
  date_once: string | null;
  tag: string | null;
  color: string | null;
  start_date: string | null;
  active: boolean;
  notifications_enabled: boolean;
  muted_today: boolean;
  streak_current: number;
  streak_best: number;
  next_run_at: string | null;
  last_sent_at: string | null;
  created_at: string | null;
  pre_remind: number[] | null;
  project_id: number | null;
  done: boolean | null;
}

export interface Entry {
  id: number;
  kind: EntryKind;
  name: string;
  doseAmount: number | null;
  doseUnit: DosageUnit | null;
  notes: string | null;
  schedule: EntrySchedule;
  time: string;
  frequency_type: FrequencyType;
  interval_days: number | null;
  days_of_week: number | null;
  date_once: string | null;
  tag: string | null;
  color: string | null;
  start_date: string | null;
  active: boolean;
  notifications_enabled: boolean;
  muted_today: boolean;
  streak_current: number;
  streak_best: number;
  next_run_at: string | null;
  last_sent_at: string | null;
  created_at: string | null;
  pre_remind: number[] | null;
  project_id: number | null;
  done: boolean | null;
  corrupted: boolean;
}

export interface EntryFormValues {
  name: string;
  doseAmount: number | null;
  doseUnit: DosageUnit | null;
  notes: string | null;
  schedule: EntrySchedule;
  time: string;
  frequency_type: FrequencyType;
  interval_days: number | null;
  start_date: string | null;
  active: boolean;
  color: string | null;
  pre_remind: number[];
}

export interface HabitFormValues {
  name: string;
  notes: string | null;
  time: string;
  frequency_type: FrequencyType;
  days_of_week: number | null;
  interval_days: number | null;
  start_date: string | null;
  active: boolean;
  tag: string | null;
}

export interface OnceFormValues {
  name: string;
  notes: string | null;
  date_once: string;
  time: string;
  pre_remind: number[];
  project_id?: number | null;
}

export interface NoteFormValues {
  name: string;
  notes: string | null;
}
