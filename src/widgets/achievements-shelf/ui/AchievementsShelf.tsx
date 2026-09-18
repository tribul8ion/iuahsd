import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ACHIEVEMENTS, useAchievements } from "@/entities/achievement";
import type { AchievementCatalogEntry } from "@/entities/achievement";
import { Spinner } from "@/shared/ui";

interface AchievementTileProps {
  item: AchievementCatalogEntry;
  earned: boolean;
}

function AchievementTile({ item, earned }: AchievementTileProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center rounded-[20px] bg-white text-center"
      style={{
        padding: "16px 10px",
        gap: 6,
        border: earned ? "1px solid rgba(5, 150, 105, 0.14)" : "1px solid rgba(30, 41, 59, 0.05)",
        background: earned ? "var(--gradient-card-mint)" : "#FFFFFF",
        boxShadow: earned
          ? "0 6px 16px -10px rgba(5,150,105,0.3)"
          : "0 1px 2px rgba(30,41,59,0.05), 0 8px 20px -12px rgba(30,41,59,0.1)",
        filter: earned ? "none" : "grayscale(1)",
        opacity: earned ? 1 : 0.55,
      }}
    >
      <span style={{ fontSize: 32, lineHeight: 1 }}>{item.emoji}</span>
      <p className="text-[12px] font-semibold leading-tight" style={{ color: "#1C1917" }}>
        {t(item.nameKey)}
      </p>
      {!earned && (
        <p className="text-[10px] leading-tight" style={{ color: "#A8A29E" }}>
          {t(item.conditionKey)}
        </p>
      )}
    </div>
  );
}

export function AchievementsShelf() {
  const { t } = useTranslation();
  const { data: earned, isLoading } = useAchievements();

  const earnedIds = useMemo(
    () => new Set((earned ?? []).map((e) => e.achievement_id)),
    [earned]
  );

  const sortedAchievements = useMemo(
    () => [...ACHIEVEMENTS].sort((a, b) => a.order - b.order),
    []
  );

  return (
    <div className="flex flex-col" style={{ gap: 12 }}>
      <p className="text-[13px] font-medium" style={{ color: "#A8A29E" }}>
        {t("achievements.progress", { count: earnedIds.size, total: ACHIEVEMENTS.length })}
      </p>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-3" style={{ gap: 12 }}>
          {sortedAchievements.map((item) => (
            <AchievementTile
              key={item.id}
              item={item}
              earned={earnedIds.has(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
