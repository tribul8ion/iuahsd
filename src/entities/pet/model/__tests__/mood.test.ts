import { moodForProgress } from "../mood";

describe("pet mood from today's progress", () => {
  it("is waiting when there are no marks today", () => {
    expect(moodForProgress(0, 0)).toBe("waiting");
  });

  it("is waiting below one third done", () => {
    expect(moodForProgress(0, 3)).toBe("waiting");
    expect(moodForProgress(1, 6)).toBe("waiting");
  });

  it("is encouraged at exactly one third and above, but below all done", () => {
    expect(moodForProgress(1, 3)).toBe("encouraged");
    expect(moodForProgress(2, 3)).toBe("encouraged");
    expect(moodForProgress(4, 5)).toBe("encouraged");
  });

  it("is blooming when everything today is done", () => {
    expect(moodForProgress(3, 3)).toBe("blooming");
    expect(moodForProgress(1, 1)).toBe("blooming");
  });
});
