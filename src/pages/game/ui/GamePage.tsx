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
        className="rounded-b-[32px] flex flex-col justify-center gap-1 overflow-hidden"
        style={{
          position: "relative",
          background: "var(--gradient-header)",
          height: 140,
          padding: "52px 20px 24px 20px",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none rounded-full"
          style={{
            position: "absolute",
            top: -70,
            right: -40,
            width: 190,
            height: 190,
            background: "radial-gradient(circle, rgba(167,243,208,0.35) 0%, rgba(167,243,208,0) 68%)",
          }}
        />
        <h1
          className="text-white text-[27px] font-extrabold leading-tight"
          style={{ letterSpacing: "-0.4px" }}
        >
          {t("game.title")}
        </h1>
      </div>

      <div style={{ padding: "16px 16px 0 16px" }}>
        <div
          className="flex rounded-2xl"
          style={{ backgroundColor: "#E6EEEA", padding: 4, gap: 4 }}
          role="tablist"
          aria-label="game-segment"
        >
          {(["pet", "shelf"] as GameSegment[]).map((seg) => (
            <button
              key={seg}
              onClick={() => setSegment(seg)}
              role="tab"
              aria-selected={segment === seg}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium cursor-pointer transition-all"
              style={{
                backgroundColor: segment === seg ? "#FFFFFF" : "transparent",
                color: segment === seg ? "#047857" : "#57534E",
                fontWeight: segment === seg ? 700 : 500,
                boxShadow: segment === seg ? "0 2px 6px rgba(30,41,59,0.08)" : "none",
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
