import type { MarkItem } from "./types";

export interface MarkTimeGroup {
  time: string;
  items: MarkItem[];
}

export function groupMarksByTime(items: readonly MarkItem[]): MarkTimeGroup[] {
  const sorted = [...items].sort((a, b) => a.entry_time.localeCompare(b.entry_time));
  const groups: MarkTimeGroup[] = [];

  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.time === item.entry_time) {
      last.items.push(item);
    } else {
      groups.push({ time: item.entry_time, items: [item] });
    }
  }

  return groups;
}
