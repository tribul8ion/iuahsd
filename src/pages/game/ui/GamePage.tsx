import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AchievementsShelf } from "@/widgets/achievements-shelf";
import { PetScene } from "./PetScene";
import { LadderSection } from "./LadderSection";

type GameSegment = "pet" | "shelf";

export function GamePage() {
  const { t } = useTranslation();
  const [segment, setSegment] = useState<GameSegment>("pet");

  return (
    <div className="min-h-full" style={{ paddingBottom: "calc(74px + 16px + env(safe-area-inset-bottom))" }}>
      <div
        className="rounded-b-[28px] flex flex-col justify-center gap-1"
        style={{
          background: "linear-gradient(160deg, #059669 0%, #0D9488 100%)",
          height: 140,
          padding: "52px 20px 24px 20px",
        }}
      >
        <h1 className="text-white text-[26px] font-bold leading-tight">{t("game.title")}</h1>
      </div>

      <div style={{ padding: "16px 16px 0 16px" }}>
        <div
          className="flex rounded-xl"
          style={{ backgroundColor: "#E7EBE9", padding: 4, gap: 4 }}
          role="tablist"
          aria-label="game-segment"
        >
          {(["pet", "shelf"] as GameSegment[]).map((seg) => (
            <button
              key={seg}
              onClick={() => setSegment(seg)}
              role="tab"
              aria-selected={segment === seg}
              className="flex-1 h-10 rounded-lg text-[13px] font-medium cursor-pointer transition-all"
              style={{
                backgroundColor: segment === seg ? "#FFFFFF" : "transparent",
                color: segment === seg ? "#1C1917" : "#57534E",
                fontWeight: segment === seg ? 600 : 500,
                boxShadow: segment === seg ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {seg === "pet" ? t("game.segment_pet") : t("game.segment_shelf")}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          {segment === "pet" ? (
            <PetScene />
          ) : (
            <>
              <AchievementsShelf />
              <LadderSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
