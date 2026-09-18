import { describe, expect, it } from "vitest";
import { togglePreRemind } from "../pre-remind";

describe("togglePreRemind", () => {
  it("adds a new minute value in sorted order", () => {
    expect(togglePreRemind([180], 30)).toEqual([30, 180]);
  });

  it("removes an already-selected minute value", () => {
    expect(togglePreRemind([30, 180], 30)).toEqual([180]);
  });

  it("ignores additions once three values are already selected", () => {
    expect(togglePreRemind([30, 60, 180], 720)).toEqual([30, 60, 180]);
  });

  it("still allows removing a value when at the cap", () => {
    expect(togglePreRemind([30, 60, 180], 60)).toEqual([30, 180]);
  });

  it("does not mutate the input array", () => {
    const input = [30];
    togglePreRemind(input, 60);
    expect(input).toEqual([30]);
  });
});
