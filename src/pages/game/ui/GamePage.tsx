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
        className="rounded-b-[36px] flex flex-col justify-center gap-1 overflow-hidden"
        style={{
          position: "relative",
          background: "var(--gradient-header)",
          height: 140,
          padding: "52px 20px 24px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "0 18px 40px -18px rgba(7, 94, 84, 0.45)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none rounded-full"
          style={{
            position: "absolute",
            top: -80,
            right: -50,
            width: 230,
            height: 230,
            background: "radial-gradient(circle, rgba(167,243,208,0.42) 0%, rgba(167,243,208,0) 66%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none rounded-full"
          style={{
            position: "absolute",
            bottom: -110,
            left: "30%",
            width: 240,
            height: 240,
            background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
        <h1
          className="text-white text-[27px] font-extrabold leading-tight"
          style={{ letterSpacing: "-0.4px", textShadow: "0 1px 2px rgba(7,94,84,0.25)" }}
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
                backgroundColor: segment === seg ? "rgba(255,255,255,0.92)" : "transparent",
                color: segment === seg ? "#047857" : "#51706A",
                fontWeight: segment === seg ? 700 : 500,
                boxShadow: segment === seg
                  ? "0 2px 8px rgba(13,84,73,0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
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
