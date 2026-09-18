import { stageForLevel, stageEmojiForLevel } from "../stage";

describe("pet plant stage", () => {
  it("maps levels 1-2 to the sprout stage", () => {
    expect(stageForLevel(1)).toBe("sprout");
    expect(stageForLevel(2)).toBe("sprout");
    expect(stageEmojiForLevel(1)).toBe("🌱");
  });

  it("maps levels 3-4 to the leaf stage", () => {
    expect(stageForLevel(3)).toBe("leaf");
    expect(stageForLevel(4)).toBe("leaf");
    expect(stageEmojiForLevel(4)).toBe("🌿");
  });

  it("maps levels 5-6 to the pot stage", () => {
    expect(stageForLevel(5)).toBe("pot");
    expect(stageForLevel(6)).toBe("pot");
    expect(stageEmojiForLevel(6)).toBe("🪴");
  });

  it("maps level 7 to the blossom stage", () => {
    expect(stageForLevel(7)).toBe("blossom");
    expect(stageEmojiForLevel(7)).toBe("🌸");
  });

  it("maps level 8 to the tree stage", () => {
    expect(stageForLevel(8)).toBe("tree");
    expect(stageEmojiForLevel(8)).toBe("🌳");
  });
});
