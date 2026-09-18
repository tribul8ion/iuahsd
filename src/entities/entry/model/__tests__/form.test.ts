import { clampInterval, parseDosageAmount, INTERVAL_DEFAULT } from "../form";

describe("clampInterval", () => {
  it("returns the default when value is NaN", () => {
    expect(clampInterval(NaN, 30)).toBe(INTERVAL_DEFAULT);
  });

  it("clamps below the minimum", () => {
    expect(clampInterval(1, 30)).toBe(2);
  });

  it("clamps above the max", () => {
    expect(clampInterval(50, 30)).toBe(30);
  });

  it("truncates fractional values", () => {
    expect(clampInterval(5.9, 30)).toBe(5);
  });

  it("respects a custom min", () => {
    expect(clampInterval(0, 30, 1)).toBe(1);
  });

  it("passes through values already within range", () => {
    expect(clampInterval(8, 30)).toBe(8);
  });
});

describe("parseDosageAmount", () => {
  it("returns null for an empty string", () => {
    expect(parseDosageAmount("")).toBeNull();
  });

  it("parses a plain number", () => {
    expect(parseDosageAmount("1.5")).toBe(1.5);
  });

  it("treats a comma as a decimal separator", () => {
    expect(parseDosageAmount("1,5")).toBe(1.5);
  });

  it("rounds to two decimal places", () => {
    expect(parseDosageAmount("1.239")).toBe(1.24);
  });

  it("returns null for zero or negative amounts", () => {
    expect(parseDosageAmount("0")).toBeNull();
    expect(parseDosageAmount("-5")).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseDosageAmount("abc")).toBeNull();
  });
});
