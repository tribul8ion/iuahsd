import { useTranslation } from "react-i18next";
import { usePet, stageEmojiForLevel, moodForProgress, levelFloorXp } from "@/entities/pet";
import { useTodayMarks } from "@/entities/mark";
import { useAchievements } from "@/entities/achievement";
import { Spinner } from "@/shared/ui";

interface CosmeticSlot {
  key: string;
  emoji: string;
  earned: boolean;
}

function buildCosmeticSlots(earnedIds: ReadonlySet<string>): CosmeticSlot[] {
  return [
    { key: "hat", emoji: "🎩", earned: earnedIds.has("iron_will_30") },
    { key: "scarf", emoji: "🧣", earned: earnedIds.has("perfect_week") },
    { key: "crown", emoji: "👑", earned: [...earnedIds].some((id) => id.endsWith("_100")) },
    { key: "sunglasses", emoji: "🕶️", earned: earnedIds.has("night_owl_10") },
  ];
}

function CosmeticSlotTile({ slot }: { slot: CosmeticSlot }) {
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{
        backgroundColor: slot.earned ? "rgba(249,255,208,0.12)" : "rgba(255,255,255,0.06)",
        border: slot.earned ? "2px solid #34D399" : "2px solid transparent",
        filter: slot.earned ? "none" : "grayscale(1)",
        opacity: slot.earned ? 1 : 0.55,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{slot.earned ? slot.emoji : "🔒"}</span>
    </div>
  );
}

export function PetScene() {
  const { t } = useTranslation();
  const { data: pet, isLoading: petLoading } = usePet();
  const { data: marks } = useTodayMarks();
  const { data: earned } = useAchievements();

  const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id));
  const cosmeticSlots = buildCosmeticSlots(earnedIds);

  const items = marks?.items ?? [];
  const taken = items.filter((i) => i.status).length;
  const mood = moodForProgress(taken, items.length);

  if (petLoading || !pet) {
    return <Spinner />;
  }

  const stageEmoji = stageEmojiForLevel(pet.level);
  const floor = levelFloorXp(pet.level);
  const ceiling = pet.next_level_xp;
  const barPct = ceiling
    ? Math.min(Math.max(((pet.xp - floor) / (ceiling - floor)) * 100, 0), 100)
    : 100;

  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <div
        className="glass-mint rounded-[24px] flex flex-col items-center text-center"
        style={{ padding: "24px 20px", gap: 8 }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 96,
            height: 96,
            background: "radial-gradient(circle at 35% 30%, rgba(249,255,208,0.22) 0%, rgba(249,255,208,0.08) 70%)",
            border: "1px solid rgba(249,255,208,0.25)",
            boxShadow: "0 10px 24px -10px rgba(249,255,208,0.3), inset 0 1px 0 rgba(249,255,208,0.18)",
          }}
        >
          <span style={{ fontSize: 56, lineHeight: 1 }} aria-hidden="true">
            {stageEmoji}
          </span>
        </div>
        <p className="text-[16px] font-bold" style={{ color: "var(--color-text)" }}>
          {t("pet.title_line", { name: t("pet.plant_name"), level: pet.level })}
        </p>
        <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          {t(`pet.mood.${mood}`)}
        </p>

        <div className="w-full" style={{ marginTop: 8 }}>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{
              height: 10,
              backgroundColor: "rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 2px rgba(30,41,59,0.06)",
            }}
          >
            <div
              role="progressbar"
              aria-valuenow={Math.round(barPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                width: `${barPct}%`,
                height: "100%",
                borderRadius: 22,
                background: "var(--gradient-primary)",
                boxShadow: "0 0 12px rgba(249,255,208,0.5)",
                transition: "width 400ms ease",
              }}
            />
          </div>
          <p className="text-[12px] mt-1" style={{ color: "var(--color-text-hint)" }}>
            {ceiling
              ? t("pet.xp_label", { xp: pet.xp, nextLevel: pet.level + 1, remaining: ceiling - pet.xp })
              : t("pet.xp_label_max", { xp: pet.xp })}
          </p>
        </div>

        <div className="flex" style={{ gap: 10, marginTop: 8 }}>
          {cosmeticSlots.map((slot) => (
            <CosmeticSlotTile key={slot.key} slot={slot} />
          ))}
        </div>
      </div>

      <div
        className="glass rounded-[22px]"
        style={{ padding: "16px 20px" }}
      >
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text)", marginBottom: 4 }}>
          {t("pet.about_title")}
        </p>
        <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          {t("pet.about_body")}
        </p>
      </div>
    </div>
  );
}
