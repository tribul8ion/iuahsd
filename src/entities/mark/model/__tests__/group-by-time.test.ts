import { describe, expect, it } from "vitest";
import { groupMarksByTime } from "../group-by-time";
import type { MarkItem } from "../types";

function mark(overrides: Partial<MarkItem>): MarkItem {
  return {
    id: 1,
    entry_id: 1,
    entry_kind: "med",
    entry_time: "08:00",
    schedule: "morning",
    date: "2026-04-07",
    status: false,
    updated_at: null,
    entry_frequency: "daily",
    entry_interval_days: null,
    entry_color: null,
    ...overrides,
  };
}

describe("groupMarksByTime", () => {
  it("returns an empty list for no items", () => {
    expect(groupMarksByTime([])).toEqual([]);
  });

  it("groups items sharing the same entry_time together", () => {
    const items = [
      mark({ id: 1, entry_time: "08:00" }),
      mark({ id: 2, entry_time: "08:00" }),
    ];
    const groups = groupMarksByTime(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].time).toBe("08:00");
    expect(groups[0].items.map((i) => i.id)).toEqual([1, 2]);
  });

  it("sorts groups chronologically regardless of input order", () => {
    const items = [
      mark({ id: 1, entry_time: "20:00" }),
      mark({ id: 2, entry_time: "07:00" }),
      mark({ id: 3, entry_time: "13:00" }),
    ];
    const groups = groupMarksByTime(items);
    expect(groups.map((g) => g.time)).toEqual(["07:00", "13:00", "20:00"]);
  });

  it("keeps med and habit marks in the same time group", () => {
    const items = [
      mark({ id: 1, entry_time: "08:00", entry_kind: "med" }),
      mark({ id: 2, entry_time: "08:00", entry_kind: "habit" }),
    ];
    const groups = groupMarksByTime(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const items = [mark({ id: 1, entry_time: "20:00" }), mark({ id: 2, entry_time: "07:00" })];
    const original = [...items];
    groupMarksByTime(items);
    expect(items).toEqual(original);
  });
});
