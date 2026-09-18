import { describe, expect, it } from "vitest";
import { kindsByDate, medColorByDate, resolveDotColor, KIND_DOT_COLORS } from "../dots";
import type { MarkRangeItem } from "@/entities/mark";

function item(
  date: string,
  entry_kind: MarkRangeItem["entry_kind"],
  entry_color: string | null = null
): MarkRangeItem {
  return { date, entry_kind, status: null, entry_color };
}

describe("kindsByDate", () => {
  it("groups distinct kinds per date", () => {
    const result = kindsByDate([
      item("2026-04-07", "med"),
      item("2026-04-07", "habit"),
      item("2026-04-08", "task"),
    ]);
    expect(result.get("2026-04-07")).toEqual(["med", "habit"]);
    expect(result.get("2026-04-08")).toEqual(["task"]);
  });

  it("deduplicates repeated kinds on the same date", () => {
    const result = kindsByDate([
      item("2026-04-07", "med"),
      item("2026-04-07", "med"),
    ]);
    expect(result.get("2026-04-07")).toEqual(["med"]);
  });

  it("orders kinds deterministically as med, habit, task, doc", () => {
    const result = kindsByDate([
      item("2026-04-07", "doc"),
      item("2026-04-07", "task"),
      item("2026-04-07", "habit"),
      item("2026-04-07", "med"),
    ]);
    expect(result.get("2026-04-07")).toEqual(["med", "habit", "task", "doc"]);
  });

  it("returns an empty map for no items", () => {
    expect(kindsByDate([]).size).toBe(0);
  });
});

describe("medColorByDate", () => {
  it("maps a date to the hex of the first colored med item", () => {
    const result = medColorByDate([item("2026-04-07", "med", "blue")]);
    expect(result.get("2026-04-07")).toBe("#3B82F6");
  });

  it("maps a date to null when the med item has no color", () => {
    const result = medColorByDate([item("2026-04-07", "med", null)]);
    expect(result.get("2026-04-07")).toBeNull();
  });

  it("ignores non-med kinds", () => {
    const result = medColorByDate([item("2026-04-07", "habit", "blue")]);
    expect(result.has("2026-04-07")).toBe(false);
  });

  it("keeps the first med item's color when several exist for the same date", () => {
    const result = medColorByDate([
      item("2026-04-07", "med", "blue"),
      item("2026-04-07", "med", "red"),
    ]);
    expect(result.get("2026-04-07")).toBe("#3B82F6");
  });
});

describe("resolveDotColor", () => {
  it("returns the entry color for a med dot when present", () => {
    const medColors = new Map([["2026-04-07", "#3B82F6"]]);
    expect(resolveDotColor("med", "2026-04-07", medColors)).toBe("#3B82F6");
  });

  it("falls back to the type color for a med dot without a color", () => {
    const medColors = new Map([["2026-04-07", null]]);
    expect(resolveDotColor("med", "2026-04-07", medColors)).toBe(KIND_DOT_COLORS.med);
  });

  it("returns the type color for non-med kinds regardless of medColors", () => {
    const medColors = new Map([["2026-04-07", "#3B82F6"]]);
    expect(resolveDotColor("habit", "2026-04-07", medColors)).toBe(KIND_DOT_COLORS.habit);
  });
});
