import type { MarkEntryKind, MarkRangeItem } from "@/entities/mark";
import { colorHex } from "@/entities/entry";

export const KIND_ORDER: readonly MarkEntryKind[] = ["med", "habit", "task", "doc"];

export const KIND_DOT_COLORS: Record<MarkEntryKind, string> = {
  med: "#059669",
  habit: "#C77414",
  task: "#7C3AED",
  doc: "#E11D48",
};

export const MAX_VISIBLE_DOTS = 3;

export function medColorByDate(items: readonly MarkRangeItem[]): Map<string, string | null> {
  const result = new Map<string, string | null>();
  for (const item of items) {
    if (item.entry_kind !== "med") continue;
    if (result.get(item.date) != null) continue;
    result.set(item.date, colorHex(item.entry_color));
  }
  return result;
}

export function resolveDotColor(
  kind: MarkEntryKind,
  date: string,
  medColors: ReadonlyMap<string, string | null>
): string {
  if (kind === "med") {
    return medColors.get(date) ?? KIND_DOT_COLORS.med;
  }
  return KIND_DOT_COLORS[kind];
}

export function kindsByDate(items: readonly MarkRangeItem[]): Map<string, MarkEntryKind[]> {
  const sets = new Map<string, Set<MarkEntryKind>>();
  for (const item of items) {
    const set = sets.get(item.date) ?? new Set<MarkEntryKind>();
    set.add(item.entry_kind);
    sets.set(item.date, set);
  }

  const result = new Map<string, MarkEntryKind[]>();
  for (const [date, set] of sets) {
    result.set(
      date,
      KIND_ORDER.filter((kind) => set.has(kind))
    );
  }
  return result;
}
