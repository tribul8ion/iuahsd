import { useTranslation } from "react-i18next";

interface ProfileStatsProps {
  entriesCount: number;
  achievementsEarned: number;
  achievementsTotal: number;
  bestStreak: number;
}

function StatColumn({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex-1 flex flex-col items-center text-center min-w-0"
      style={{ padding: "14px 8px", gap: 4 }}
    >
      <span className="text-[18px] font-bold truncate" style={{ color: "#1C1917" }}>
        {value}
      </span>
      <span className="text-[11px] leading-tight" style={{ color: "#A8A29E" }}>
        {label}
      </span>
    </div>
  );
}

export function ProfileStats({
  entriesCount,
  achievementsEarned,
  achievementsTotal,
  bestStreak,
}: ProfileStatsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-[20px] bg-white flex items-stretch"
      style={{
        border: "1px solid rgba(30, 41, 59, 0.05)",
        boxShadow: "0 1px 2px rgba(30,41,59,0.05), 0 8px 20px -12px rgba(30,41,59,0.1)",
      }}
    >
      <StatColumn value={String(entriesCount)} label={t("profile.stats_entries")} />
      <div style={{ width: 1, backgroundColor: "#F5F5F4" }} />
      <StatColumn
        value={t("achievements.counter", { count: achievementsEarned, total: achievementsTotal })}
        label={t("profile.stats_achievements")}
      />
      <div style={{ width: 1, backgroundColor: "#F5F5F4" }} />
      <StatColumn
        value={bestStreak > 0 ? `🔥 ${bestStreak}` : "—"}
        label={t("profile.stats_streak")}
      />
    </div>
  );
}
