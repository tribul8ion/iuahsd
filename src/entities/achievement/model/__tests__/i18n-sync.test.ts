import ru from "@/shared/i18n/ru.json";
import en from "@/shared/i18n/en.json";
import { VALID_TAGS } from "@/entities/entry";
import { ACHIEVEMENTS, ladderStagesForTag } from "../catalog";

type Locale = typeof ru;

function badgeNames(locale: Locale): Record<string, { name?: string; condition?: string }> {
  return locale.achievements.badges as Record<string, { name?: string; condition?: string }>;
}

describe("achievement catalog <-> i18n invariant", () => {
  it("has a ru and en name/condition for every catalog id, including all 32 ladder ids", () => {
    const ruBadges = badgeNames(ru);
    const enBadges = badgeNames(en);

    for (const entry of ACHIEVEMENTS) {
      expect(ruBadges[entry.id]?.name, `ru name missing for ${entry.id}`).toBeTruthy();
      expect(ruBadges[entry.id]?.condition, `ru condition missing for ${entry.id}`).toBeTruthy();
      expect(enBadges[entry.id]?.name, `en name missing for ${entry.id}`).toBeTruthy();
      expect(enBadges[entry.id]?.condition, `en condition missing for ${entry.id}`).toBeTruthy();
    }
  });

  it("keeps every ladder display name at or under 24 characters in both locales", () => {
    const ruBadges = badgeNames(ru);
    const enBadges = badgeNames(en);
    const ladderIds = VALID_TAGS.flatMap((tag) => ladderStagesForTag(tag).map((s) => s.id));
    expect(ladderIds).toHaveLength(32);

    for (const id of ladderIds) {
      expect(ruBadges[id]!.name!.length, `ru ${id}`).toBeLessThanOrEqual(24);
      expect(enBadges[id]!.name!.length, `en ${id}`).toBeLessThanOrEqual(24);
    }
  });
});
