import { describe, expect, it } from "vitest";
import { resolveEntryName } from "../join";
import type { EntryNameSource } from "../join";

const entries: EntryNameSource[] = [
  { id: 1, name: "Aspirin", corrupted: false },
  { id: 2, name: "", corrupted: true },
];

describe("resolveEntryName", () => {
  it("returns the decrypted name for a known entry", () => {
    expect(resolveEntryName(1, entries)).toBe("Aspirin");
  });

  it("returns null for a corrupted entry", () => {
    expect(resolveEntryName(2, entries)).toBeNull();
  });

  it("returns null when the entry is missing from the cache", () => {
    expect(resolveEntryName(99, entries)).toBeNull();
  });

  it("returns null when the entries list is not loaded yet", () => {
    expect(resolveEntryName(1, undefined)).toBeNull();
  });
});
