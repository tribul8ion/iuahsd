export type MarkEntryKind = "med" | "habit" | "task" | "doc";

export type MarkEntryFrequency = "daily" | "interval" | "weekly" | "once";

export interface MarkItem {
  id: number;
  entry_id: number;
  entry_kind: MarkEntryKind;
  entry_time: string;
  schedule: string;
  date: string;
  status: boolean;
  updated_at: string | null;
  entry_frequency: MarkEntryFrequency;
  entry_interval_days: number | null;
  entry_color: string | null;
}

export interface MarksResponse {
  items: MarkItem[];
  date: string;
  total: number;
  taken: number;
}

export interface MarkRangeItem {
  date: string;
  entry_kind: MarkEntryKind;
  status: boolean | null;
  entry_color: string | null;
}

export interface MarksRangeResponse {
  items: MarkRangeItem[];
}
