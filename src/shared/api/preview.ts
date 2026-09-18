import { encryptPayload } from "@/shared/crypto";
import type { ApiResponse } from "@/shared/api/types";
import type { EntryDto } from "@/entities/entry/model/types";
import type { MarkItem, MarkRangeItem } from "@/entities/mark/model/types";
import type { PetDto } from "@/entities/pet/model/types";
import type { User, UserSettings } from "@/entities/user/model/types";

/**
 * ВРЕМЕННЫЙ демо-провайдер для предпросмотра без Telegram и бэкенда.
 * Данные живут только в памяти вкладки и никуда не отправляются.
 */

interface DemoState {
  key: Uint8Array | null;
  me: User;
  settings: UserSettings;
  pet: PetDto;
  earned: { achievement_id: string; earned_at: string }[];
  entries: EntryDto[];
  marks: MarkItem[];
  rangeDots: MarkRangeItem[];
  nextEntryId: number;
  nextMarkId: number;
}

function localISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISOLocal(): string {
  return localISO(new Date());
}

const state: DemoState = {
  key: null,
  me: {
    id: 1,
    telegram_id: 0,
    language: "ru",
    is_admin: false,
    created_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    last_active: new Date().toISOString(),
    medications_count: 3,
    entries_count: 6,
    crypto_initialized: true,
    current_policy_version: "1.0",
    last_accepted_policy_version: "1.0",
    needs_consent_refresh: false,
  },
  settings: {
    reminders_enabled: true,
    reminder_repeat_minutes: 15,
    muted_today: false,
    language: "ru",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  pet: { xp: 420, level: 3, next_level_xp: 700 },
  earned: [
    { achievement_id: "first_step", earned_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString() },
    { achievement_id: "combo_5", earned_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  ],
  entries: [],
  marks: [],
  rangeDots: [],
  nextEntryId: 100,
  nextMarkId: 1000,
};

interface EntrySeed {
  id: number;
  kind: EntryDto["kind"];
  name: string;
  schedule: EntryDto["schedule"];
  time: string;
  tag: string | null;
  color: string | null;
  streak: number;
  doseAmount?: number | null;
  doseUnit?: string | null;
  frequency?: EntryDto["frequency_type"];
}

const ENTRY_SEEDS: EntrySeed[] = [
  { id: 1, kind: "habit", name: "Утренняя зарядка", schedule: "morning", time: "07:30", tag: "gym", color: null, streak: 15 },
  { id: 2, kind: "med", name: "Магний B6", schedule: "morning", time: "08:30", tag: null, color: "blue", streak: 5, doseAmount: 1, doseUnit: "tablet" },
  { id: 3, kind: "med", name: "Витамин D3", schedule: "morning", time: "09:00", tag: null, color: "lime", streak: 12, doseAmount: 2000, doseUnit: "iu" },
  { id: 4, kind: "habit", name: "Стакан воды", schedule: "custom", time: "10:00", tag: "water", color: null, streak: 8 },
  { id: 5, kind: "doc", name: "Приём у терапевта", schedule: "custom", time: "16:00", tag: null, color: null, streak: 0, frequency: "once" },
  { id: 6, kind: "med", name: "Омега-3", schedule: "evening", time: "21:00", tag: null, color: "indigo", streak: 3, doseAmount: 2, doseUnit: "tablet" },
];

const TAKEN_ENTRY_IDS = new Set([1, 3, 5]);

async function buildEntryDto(seed: EntrySeed): Promise<EntryDto> {
  const payloadEncrypted = await encryptPayload(
    {
      v: 1,
      name: seed.name,
      dose_amount: seed.doseAmount ?? null,
      dose_unit: seed.doseUnit ?? null,
      notes: null,
    },
    state.key as Uint8Array
  );
  return {
    id: seed.id,
    kind: seed.kind,
    payload_encrypted: payloadEncrypted,
    schedule: seed.schedule,
    time: seed.time,
    frequency_type: seed.frequency ?? "daily",
    interval_days: null,
    days_of_week: null,
    date_once: seed.frequency === "once" ? todayISOLocal() : null,
    tag: seed.tag,
    color: seed.color,
    start_date: null,
    active: true,
    notifications_enabled: true,
    muted_today: false,
    streak_current: seed.streak,
    streak_best: Math.max(seed.streak, 20),
    next_run_at: null,
    last_sent_at: null,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    pre_remind: seed.kind === "doc" ? [60, 1440] : null,
    project_id: null,
    done: null,
  };
}

function buildMark(seed: EntrySeed, date: string): MarkItem {
  return {
    id: state.nextMarkId++,
    entry_id: seed.id,
    entry_kind: seed.kind as MarkItem["entry_kind"],
    entry_time: seed.time,
    schedule: seed.schedule,
    date,
    status: TAKEN_ENTRY_IDS.has(seed.id),
    updated_at: null,
    entry_frequency: (seed.frequency ?? "daily") as MarkItem["entry_frequency"],
    entry_interval_days: null,
    entry_color: seed.color,
  };
}

function buildRangeDots(): MarkRangeItem[] {
  const items: MarkRangeItem[] = [];
  const base = new Date();
  // пара предыдущих дней — чтобы календарь выглядел живым
  for (const offset of [-4, -3, -2, -1]) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    const iso = localISO(d);
    items.push(
      { date: iso, entry_kind: "med", status: true, entry_color: "blue" },
      { date: iso, entry_kind: "med", status: true, entry_color: "lime" },
      { date: iso, entry_kind: "med", status: true, entry_color: "indigo" },
      { date: iso, entry_kind: "habit", status: true, entry_color: null }
    );
  }
  // сегодня — из актуальных меток
  const today = todayISOLocal();
  for (const mark of state.marks) {
    items.push({
      date: today,
      entry_kind: mark.entry_kind,
      status: mark.status,
      entry_color: mark.entry_color,
    });
  }
  // завтра — доктор
  const tomorrow = new Date(base);
  tomorrow.setDate(tomorrow.getDate() + 1);
  items.push({ date: localISO(tomorrow), entry_kind: "doc", status: null, entry_color: null });
  return items;
}

export async function initPreviewSession(): Promise<Uint8Array> {
  const key = crypto.getRandomValues(new Uint8Array(32));
  state.key = key;
  state.entries = [];
  for (const seed of ENTRY_SEEDS) {
    state.entries.push(await buildEntryDto(seed));
  }
  state.marks = [];
  const today = todayISOLocal();
  for (const seed of ENTRY_SEEDS) {
    state.marks.push(buildMark(seed, today));
  }
  state.rangeDots = buildRangeDots();
  return key;
}

export function previewUser(): User {
  return { ...state.me };
}

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data, error: null };
}

function marksResponse(date: string) {
  const items = state.marks.filter((m) => m.date === date);
  return {
    items,
    date,
    total: items.length,
    taken: items.filter((m) => m.status).length,
  };
}

function rangeResponse(from: string, to: string): { items: MarkRangeItem[] } {
  const today = todayISOLocal();
  const items: MarkRangeItem[] = state.rangeDots
    .filter((d) => d.date >= from && d.date <= to && d.date !== today)
    .map((d) => ({ ...d }));
  // сегодняшние точки всегда из живого состояния меток
  for (const mark of state.marks) {
    if (mark.date >= from && mark.date <= to) {
      items.push({
        date: mark.date,
        entry_kind: mark.entry_kind,
        status: mark.status,
        entry_color: mark.entry_color,
      });
    }
  }
  return { items };
}

export async function previewRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const url = new URL(endpoint, "http://preview.local");
  const path = url.pathname;

  const body = options.body
    ? (JSON.parse(options.body as string) as Record<string, unknown>)
    : {};

  // --- мутации -----------------------------------------------------------
  if (method === "PATCH" && path.startsWith("/marks/")) {
    const id = Number(path.split("/")[2]);
    const mark = state.marks.find((m) => m.id === id);
    if (mark) {
      mark.status = Boolean(body.status);
      mark.updated_at = new Date().toISOString();
    }
    return ok({ status: mark?.status ?? false, newly_awarded: [] } as T);
  }

  if (method === "PUT" && path.startsWith("/entries/")) {
    const id = Number(path.split("/")[2]);
    const entry = state.entries.find((e) => e.id === id);
    if (entry) {
      Object.assign(entry, body, { id, payload_encrypted: entry.payload_encrypted });
    }
    return ok(entry as T);
  }

  if (method === "DELETE" && path.startsWith("/entries/")) {
    const id = Number(path.split("/")[2]);
    state.entries = state.entries.filter((e) => e.id !== id);
    state.marks = state.marks.filter((m) => m.entry_id !== id);
    return ok(null as T);
  }

  if (method === "POST" && path === "/entries") {
    const id = state.nextEntryId++;
    const dto: EntryDto = {
      id,
      kind: (body.kind as EntryDto["kind"]) ?? "med",
      payload_encrypted: (body.payload_encrypted as string) ?? "",
      schedule: (body.schedule as EntryDto["schedule"]) ?? "custom",
      time: (body.time as string) ?? "09:00",
      frequency_type: (body.frequency_type as EntryDto["frequency_type"]) ?? "daily",
      interval_days: (body.interval_days as number | null) ?? null,
      days_of_week: (body.days_of_week as number | null) ?? null,
      date_once: (body.date_once as string | null) ?? null,
      tag: (body.tag as string | null) ?? null,
      color: (body.color as string | null) ?? null,
      start_date: (body.start_date as string | null) ?? null,
      active: true,
      notifications_enabled: true,
      muted_today: false,
      streak_current: 0,
      streak_best: 0,
      next_run_at: null,
      last_sent_at: null,
      created_at: new Date().toISOString(),
      pre_remind: (body.pre_remind as number[] | null) ?? null,
      project_id: (body.project_id as number | null) ?? null,
      done: null,
    };
    state.entries.push(dto);
    if (dto.kind !== "note") {
      state.marks.push({
        id: state.nextMarkId++,
        entry_id: id,
        entry_kind: dto.kind as MarkItem["entry_kind"],
        entry_time: dto.time,
        schedule: dto.schedule,
        date: dto.date_once ?? todayISOLocal(),
        status: false,
        updated_at: null,
        entry_frequency: (dto.frequency_type === "none"
          ? "daily"
          : dto.frequency_type) as MarkItem["entry_frequency"],
        entry_interval_days: dto.interval_days,
        entry_color: dto.color,
      });
    }
    return ok(dto as T);
  }

  if (method === "PATCH" && path === "/settings") {
    Object.assign(state.settings, body);
    return ok({ ...state.settings } as T);
  }

  if (method === "POST" && path === "/settings/mute_today") {
    state.settings.muted_today = true;
    return ok({ ...state.settings } as T);
  }

  // --- чтение ------------------------------------------------------------
  if (method === "GET" && path === "/me") {
    return ok(previewUser() as T);
  }

  if (method === "GET" && path === "/settings") {
    return ok({ ...state.settings } as T);
  }

  if (method === "GET" && path === "/me/salt") {
    return { success: false, data: null, error: "crypto_not_initialized" };
  }

  if (method === "GET" && path === "/entries") {
    return ok({ entries: state.entries, count: state.entries.length } as T);
  }

  if (method === "GET" && path === "/marks") {
    const date = url.searchParams.get("date") ?? todayISOLocal();
    return ok(marksResponse(date) as T);
  }

  if (method === "GET" && path === "/marks/range") {
    return ok(
      rangeResponse(
        url.searchParams.get("date_from") ?? "",
        url.searchParams.get("date_to") ?? ""
      ) as T
    );
  }

  if (method === "GET" && path === "/pet") {
    return ok({ ...state.pet } as T);
  }

  if (method === "GET" && path === "/achievements") {
    return ok({ earned: [...state.earned] } as T);
  }

  if (method === "GET" && path === "/projects") {
    return ok({ projects: [] } as T);
  }

  if (method === "GET" && path === "/me/export") {
    return ok({ entries: [], projects: [] } as T);
  }

  // остальное — no-op успех (смена парольной фразы, экспорт и т.п. в демо не делают ничего)
  return ok(null as T);
}
