import { TAGS, VALID_TAGS, NO_TAG_EMOJI, isTagKey, tagEmoji } from "../tags";

describe("tag catalog", () => {
  it("lists exactly the eight whitelisted tag keys", () => {
    expect(VALID_TAGS).toEqual([
      "coffee",
      "water",
      "gym",
      "sleep",
      "book",
      "nosmoke",
      "meditate",
      "food",
    ]);
  });

  it("assigns a unique emoji to every tag", () => {
    const emojis = VALID_TAGS.map((key) => TAGS[key]);
    expect(new Set(emojis).size).toBe(VALID_TAGS.length);
  });

  it("recognizes only whitelisted keys as valid tags", () => {
    expect(isTagKey("coffee")).toBe(true);
    expect(isTagKey("invalid")).toBe(false);
    expect(isTagKey(null)).toBe(false);
  });

  it("resolves the tag emoji, or the lock emoji when absent or invalid", () => {
    expect(tagEmoji("coffee")).toBe(TAGS.coffee);
    expect(tagEmoji(null)).toBe(NO_TAG_EMOJI);
    expect(tagEmoji("not_a_tag")).toBe(NO_TAG_EMOJI);
  });
});
