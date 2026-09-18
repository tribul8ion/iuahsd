import type { ApiResponse } from "@/shared/api/types";
import type { Entry, EntryDto } from "@/entities/entry/model/types";
import type { MarkItem } from "@/entities/mark/model/types";
import { encryptPayload } from "@/shared/crypto";
import type { EntryPayloadV1 } from "@/shared/crypto";

export const TEST_CRYPTO_KEY: Uint8Array = new Uint8Array(32).fill(7);

export const mockEntries: Entry[] = [
  {
    id: 1,
    kind: "med",
    name: "Aspirin",
    doseAmount: null,
    doseUnit: null,
    notes: null,
    schedule: "morning",
    time: "08:00",
    frequency_type: "daily",
    interval_days: null,
    days_of_week: null,
    date_once: null,
    tag: null,
    color: null,
    start_date: null,
    active: true,
    notifications_enabled: true,
    muted_today: false,
    streak_current: 0,
    streak_best: 0,
    next_run_at: null,
    last_sent_at: null,
    created_at: "2026-01-01T00:00:00Z",
    pre_remind: null,
    project_id: null,
    done: null,
    corrupted: false,
  },
  {
    id: 2,
    kind: "med",
    name: "Vitamin D",
    doseAmount: null,
    doseUnit: null,
    notes: null,
    schedule: "evening",
    time: "20:00",
    frequency_type: "daily",
    interval_days: null,
    days_of_week: null,
    date_once: null,
    tag: null,
    color: "blue",
    start_date: null,
    active: true,
    notifications_enabled: true,
    muted_today: false,
    streak_current: 0,
    streak_best: 0,
    next_run_at: null,
    last_sent_at: null,
    created_at: "2026-01-02T00:00:00Z",
    pre_remind: null,
    project_id: null,
    done: null,
    corrupted: false,
  },
  {
    id: 3,
    kind: "habit",
    name: "Meditation",
    doseAmount: null,
    doseUnit: null,
    notes: null,
    schedule: "custom",
    time: "07:00",
    frequency_type: "daily",
    interval_days: null,
    days_of_week: null,
    date_once: null,
    tag: null,
    color: null,
    start_date: null,
    active: true,
    notifications_enabled: true,
    muted_today: false,
    streak_current: 0,
    streak_best: 0,
    next_run_at: null,
    last_sent_at: null,
    created_at: "2026-01-03T00:00:00Z",
    pre_remind: null,
    project_id: null,
    done: null,
    corrupted: false,
  },
];

export const mockMedEntries: Entry[] = mockEntries.filter((e) => e.kind === "med");

export async function buildEntryDto(
  entry: Entry,
  key: Uint8Array = TEST_CRYPTO_KEY
): Promise<EntryDto> {
  const payload: EntryPayloadV1 = {
    v: 1,
    name: entry.name,
    dose_amount: entry.doseAmount,
    dose_unit: entry.doseUnit,
    notes: entry.notes,
  };
  return {
    id: entry.id,
    kind: entry.kind,
    payload_encrypted: await encryptPayload(payload, key),
    schedule: entry.schedule,
    time: entry.time,
    frequency_type: entry.frequency_type,
    interval_days: entry.interval_days,
    days_of_week: entry.days_of_week,
    date_once: entry.date_once,
    tag: entry.tag,
    color: entry.color,
    start_date: entry.start_date,
    active: entry.active,
    notifications_enabled: entry.notifications_enabled,
    muted_today: entry.muted_today,
    streak_current: entry.streak_current,
    streak_best: entry.streak_best,
    next_run_at: entry.next_run_at,
    last_sent_at: entry.last_sent_at,
    created_at: entry.created_at,
    pre_remind: entry.pre_remind,
    project_id: entry.project_id,
    done: entry.done,
  };
}

export const mockMarkItems: MarkItem[] = [
  {
    id: 10,
    date: "2026-04-07",
    entry_id: 1,
    entry_kind: "med",
    status: false,
    updated_at: "2026-04-07T00:00:00Z",
    entry_time: "08:00",
    schedule: "morning",
    entry_frequency: "daily",
    entry_interval_days: null,
    entry_color: null,
  },
  {
    id: 11,
    date: "2026-04-07",
    entry_id: 2,
    entry_kind: "med",
    status: true,
    updated_at: "2026-04-07T12:00:00Z",
    entry_time: "20:00",
    schedule: "evening",
    entry_frequency: "daily",
    entry_interval_days: null,
    entry_color: "blue",
  },
];

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

export function createErrorResponse(error: string): ApiResponse<null> {
  return { success: false, data: null, error };
}
