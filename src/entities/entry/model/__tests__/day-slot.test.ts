import { describe, expect, it } from "vitest";
import { daySlotForTime } from "../day-slot";

describe("daySlotForTime", () => {
  it("classifies 03:59 as evening (just before the morning boundary)", () => {
    expect(daySlotForTime("03:59")).toBe("evening");
  });

  it("classifies 04:00 as morning (the morning boundary)", () => {
    expect(daySlotForTime("04:00")).toBe("morning");
  });

  it("classifies 11:59 as morning (just before the day boundary)", () => {
    expect(daySlotForTime("11:59")).toBe("morning");
  });

  it("classifies 12:00 as day (the day boundary)", () => {
    expect(daySlotForTime("12:00")).toBe("day");
  });

  it("classifies 17:59 as day (just before the evening boundary)", () => {
    expect(daySlotForTime("17:59")).toBe("day");
  });

  it("classifies 18:00 as evening (the evening boundary)", () => {
    expect(daySlotForTime("18:00")).toBe("evening");
  });

  it("classifies midnight as evening", () => {
    expect(daySlotForTime("00:00")).toBe("evening");
  });
});
