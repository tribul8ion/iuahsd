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
    <div className="min-h-full" style={{ paddingBottom: "calc(96px + 16px + env(safe-area-inset-bottom))" }}>
      <div
        className="flex flex-col justify-center gap-1 flex-shrink-0"
        style={{
          backgroundColor: "#131313",
          height: 112,
          padding: "52px 20px 16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <h1
          className="text-[24px] font-bold leading-tight uppercase"
          style={{ letterSpacing: "-0.01em", color: "var(--color-text)" }}
        >
          {t("game.title")}
        </h1>
      </div>

      <div style={{ padding: "16px 16px 0 16px" }}>
        <div
          className="flex rounded-full glass"
          style={{ padding: 4, gap: 4 }}
          role="tablist"
          aria-label="game-segment"
        >
          {(["pet", "shelf"] as GameSegment[]).map((seg) => (
            <button
              key={seg}
              onClick={() => setSegment(seg)}
              role="tab"
              aria-selected={segment === seg}
              className="flex-1 h-10 rounded-full text-[13px] font-medium cursor-pointer transition-all"
              style={{
                background: segment === seg ? "var(--gradient-primary)" : "transparent",
                color: segment === seg ? "#2C3400" : "rgba(198,201,174,0.7)",
                fontWeight: segment === seg ? 700 : 500,
                boxShadow: segment === seg
                  ? "0 4px 12px -2px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)"
                  : "none",
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
