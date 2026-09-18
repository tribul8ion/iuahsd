import {
  DecryptError,
  UnsupportedVersionError,
  decryptPayload,
} from "@/shared/crypto";
import type { DosageUnit, Entry, EntryDto } from "./types";

function metadataOf(dto: EntryDto): Omit<
  Entry,
  "name" | "doseAmount" | "doseUnit" | "notes" | "corrupted"
> {
  return {
    id: dto.id,
    kind: dto.kind,
    schedule: dto.schedule,
    time: dto.time,
    frequency_type: dto.frequency_type,
    interval_days: dto.interval_days,
    days_of_week: dto.days_of_week,
    date_once: dto.date_once,
    tag: dto.tag,
    color: dto.color,
    start_date: dto.start_date,
    active: dto.active,
    notifications_enabled: dto.notifications_enabled,
    muted_today: dto.muted_today,
    streak_current: dto.streak_current,
    streak_best: dto.streak_best,
    next_run_at: dto.next_run_at,
    last_sent_at: dto.last_sent_at,
    created_at: dto.created_at,
    pre_remind: dto.pre_remind,
    project_id: dto.project_id,
    done: dto.done,
  };
}

export async function toEntry(dto: EntryDto, key: Uint8Array): Promise<Entry> {
  try {
    const payload = await decryptPayload(dto.payload_encrypted, key);
    return {
      ...metadataOf(dto),
      name: payload.name,
      doseAmount: payload.dose_amount,
      doseUnit: payload.dose_unit as DosageUnit | null,
      notes: payload.notes,
      corrupted: false,
    };
  } catch (error) {
    if (
      error instanceof DecryptError ||
      error instanceof UnsupportedVersionError ||
      error instanceof SyntaxError
    ) {
      return {
        ...metadataOf(dto),
        name: "",
        doseAmount: null,
        doseUnit: null,
        notes: null,
        corrupted: true,
      };
    }
    throw error;
  }
}
