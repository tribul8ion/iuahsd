import { describe, expect, it } from "vitest";
import { ENTRY_COLORS, VALID_COLORS, isColorKey, colorHex } from "../colors";

describe("ENTRY_COLORS", () => {
  it("has exactly 6 keys matching the shared backend palette", () => {
    expect(VALID_COLORS).toHaveLength(6);
    expect(Object.keys(ENTRY_COLORS)).toHaveLength(6);
    expect(ENTRY_COLORS).toEqual({
      blue: "#3B82F6",
      cyan: "#06B6D4",
      pink: "#EC4899",
      red: "#EF4444",
      indigo: "#6366F1",
      lime: "#84CC16",
    });
  });

  it("does not overlap with entry-kind type colors", () => {
    const kindColors = ["#059669", "#C77414", "#E11D48", "#7C3AED"];
    for (const hex of Object.values(ENTRY_COLORS)) {
      expect(kindColors).not.toContain(hex);
    }
  });
});

describe("isColorKey", () => {
  it("returns true for every valid color key", () => {
    for (const key of VALID_COLORS) {
      expect(isColorKey(key)).toBe(true);
    }
  });

  it("returns false for null", () => {
    expect(isColorKey(null)).toBe(false);
  });

  it("returns false for an unknown string", () => {
    expect(isColorKey("purple")).toBe(false);
  });
});

describe("colorHex", () => {
  it("resolves a valid key to its hex value", () => {
    expect(colorHex("blue")).toBe("#3B82F6");
  });

  it("returns null for null input", () => {
    expect(colorHex(null)).toBeNull();
  });

  it("returns null for an unknown key", () => {
    expect(colorHex("not-a-color")).toBeNull();
  });
});
