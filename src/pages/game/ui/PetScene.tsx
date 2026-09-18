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
        backgroundColor: slot.earned ? "#ECFDF5" : "#F5F5F4",
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
        className="rounded-[22px] flex flex-col items-center text-center"
        style={{
          padding: "24px 20px",
          gap: 8,
          background: "var(--gradient-card-mint)",
          border: "1px solid rgba(5, 150, 105, 0.1)",
          boxShadow: "0 1px 2px rgba(30,41,59,0.05), 0 8px 20px -12px rgba(5,150,105,0.18)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 96,
            height: 96,
            background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D9F5E6 100%)",
            boxShadow: "0 8px 20px -8px rgba(5,150,105,0.35), inset 0 -4px 8px rgba(5,150,105,0.08)",
          }}
        >
          <span style={{ fontSize: 56, lineHeight: 1 }} aria-hidden="true">
            {stageEmoji}
          </span>
        </div>
        <p className="text-[16px] font-bold" style={{ color: "#1C1917" }}>
          {t("pet.title_line", { name: t("pet.plant_name"), level: pet.level })}
        </p>
        <p className="text-[13px]" style={{ color: "#57534E" }}>
          {t(`pet.mood.${mood}`)}
        </p>

        <div className="w-full" style={{ marginTop: 8 }}>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{
              height: 10,
              backgroundColor: "#E4EFE9",
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
                borderRadius: 999,
                background: "var(--gradient-primary)",
                boxShadow: "0 0 10px rgba(52,211,153,0.55)",
                transition: "width 400ms ease",
              }}
            />
          </div>
          <p className="text-[12px] mt-1" style={{ color: "#A8A29E" }}>
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
        className="rounded-[20px] bg-white"
        style={{
          padding: "16px 20px",
          border: "1px solid rgba(30, 41, 59, 0.05)",
          boxShadow: "0 1px 2px rgba(30,41,59,0.05), 0 8px 20px -12px rgba(30,41,59,0.1)",
        }}
      >
        <p className="text-[13px] font-semibold" style={{ color: "#1C1917", marginBottom: 4 }}>
          {t("pet.about_title")}
        </p>
        <p className="text-[13px]" style={{ color: "#57534E" }}>
          {t("pet.about_body")}
        </p>
      </div>
    </div>
  );
}
