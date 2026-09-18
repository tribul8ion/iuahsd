import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PartyPopper, AlertCircle, ClipboardList, Flame } from "lucide-react";
import {
  MarkCard,
  groupMarksByTime,
  resolveEntryName,
  useTodayMarks,
  useMarksRange,
  formatMarkSchedule,
} from "@/entities/mark";
import type { MarkItem } from "@/entities/mark";
import { useEntries, StreakPill } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { MarkTakenButton } from "@/features/mark-taken";
import { Spinner, Confetti, EmptyState } from "@/shared/ui";
import { isoDate, todayISO } from "@/shared/lib/date";

const CONFETTI_STORAGE_PREFIX = "rhythm_confetti_shown_";
const CONFETTI_VISIBLE_MS = 1600;

function buildSubLabel(
  mark: MarkItem,
  entry: Entry | undefined,
  t: (key: string, vars?: Record<string, unknown>) => string,
  dayShort: string[]
): string {
  const schedule = formatMarkSchedule(mark, entry, { t, dayShort });
  return schedule ? `${mark.entry_time} · ${schedule}` : mark.entry_time;
}

export function TodayFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: marks, isLoading, isError } = useTodayMarks();
  const { data: entries } = useEntries();
  const [showConfetti, setShowConfetti] = useState(false);
  const [handledConfettiKey, setHandledConfettiKey] = useState<string | null>(null);

  const weekFrom = (() => {
    const now = new Date();
    const mondayOffset = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    return isoDate(monday);
  })();
  const { data: weekData } = useMarksRange(weekFrom, todayISO());

  const items = marks?.items ?? [];
  const takenCount = items.filter((e) => e.status).length;
  const allTaken = items.length > 0 && takenCount === items.length;

  const weekItems = weekData?.items ?? [];
  const weekTaken = weekItems.filter((i) => i.status).length;
  const weekPct = weekItems.length > 0 ? Math.round((weekTaken / weekItems.length) * 100) : 0;

  const bestStreak = entries?.reduce((max, e) => Math.max(max, e.streak_current), 0) ?? 0;

  const confettiKey = allTaken && marks?.date ? `${CONFETTI_STORAGE_PREFIX}${marks.date}` : null;
  if (confettiKey && handledConfettiKey !== confettiKey) {
    setHandledConfettiKey(confettiKey);
    if (!localStorage.getItem(confettiKey)) {
      localStorage.setItem(confettiKey, "1");
      setShowConfetti(true);
    }
  }

  useEffect(() => {
    if (!showConfetti) return;
    const timer = setTimeout(() => setShowConfetti(false), CONFETTI_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-danger-soft flex items-center justify-center">
          <AlertCircle size={32} className="text-danger" strokeWidth={1.5} />
        </div>
        <p className="text-text-secondary text-sm">{t("common.error")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={36} color="var(--color-text-hint)" strokeWidth={1.5} />}
        title={t("today.empty_title")}
        subtitle={t("today.empty_subtitle")}
        minHeight="calc(100vh - 180px - 96px - 32px)"
        size="lg"
      />
    );
  }

  const pct = Math.round((takenCount / items.length) * 100);
  const dayShort = t("habit.days_short", { returnObjects: true }) as string[];
  const groups = groupMarksByTime(items);

  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      {showConfetti && <Confetti />}
      <div
        className="glass rounded-[24px] flex items-center justify-between"
        style={{ padding: "20px 22px", gap: 16 }}
      >
        <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 4 }}>
          <p className="section-label">{t("nav.today")}</p>
          <p
            className="font-bold"
            style={{ fontSize: 44, lineHeight: "44px", letterSpacing: "-0.03em", color: "#F9FFD0" }}
          >
            {takenCount}/{items.length}
          </p>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            {t("checklist.progress_count", { taken: takenCount, total: items.length })}
          </p>
          <div className="flex items-center" style={{ gap: 6, marginTop: 2 }}>
            {allTaken && <PartyPopper size={14} color="#B8D220" strokeWidth={2} aria-hidden="true" />}
            <p className="text-[13px] font-medium uppercase" style={{ color: "#B8D220", letterSpacing: "0.06em" }}>
              {allTaken ? t("checklist.all_taken_congrats") : t("checklist.keep_going")}
            </p>
          </div>
        </div>
        <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
          <svg viewBox="0 0 112 112" style={{ width: 96, height: 96, transform: "rotate(-90deg)" }}>
            <circle cx="56" cy="56" r="48" fill="none" stroke="#2C2C2E" strokeWidth="8" />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="#F9FFD0"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={301.59}
              strokeDashoffset={301.59 * (1 - pct / 100)}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[13px] font-bold uppercase"
            style={{ color: "var(--color-text)", letterSpacing: "0.05em" }}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: 12 }}>
        <div className="glass rounded-[24px] flex flex-col justify-between" style={{ padding: 16, gap: 14, minHeight: 108 }}>
          <div className="flex justify-between items-start">
            <p className="section-label">{t("profile.stats_streak")}</p>
            <Flame size={18} color="#F9FFD0" strokeWidth={1.9} aria-hidden="true" />
          </div>
          <p
            className="font-bold"
            style={{ fontSize: 26, lineHeight: "30px", letterSpacing: "-0.02em", color: "var(--color-text)" }}
          >
            {bestStreak}
          </p>
        </div>
        <div className="glass rounded-[24px] flex flex-col justify-between" style={{ padding: 16, gap: 14, minHeight: 108 }}>
          <div className="flex justify-between items-baseline">
            <p className="section-label">{t("today.week_progress")}</p>
            <p className="text-[11px] font-semibold" style={{ color: "var(--color-text-secondary)", letterSpacing: "0.04em" }}>
              {t("calendar.agenda_progress", { taken: weekTaken, total: weekItems.length })}
            </p>
          </div>
          <div className="rounded-full" style={{ width: "100%", height: 8, backgroundColor: "#2C2C2E" }}>
            <div
              className="rounded-full"
              style={{ width: `${weekPct}%`, height: "100%", backgroundColor: "#F9FFD0", transition: "width 300ms ease" }}
            />
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.time} className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex items-center" style={{ gap: 8, padding: "0 6px" }}>
            <span
              className="rounded-full section-label"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 12px",
                backgroundColor: "#2C2C2E",
              }}
            >
              {group.time}
            </span>
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {group.items.map((mark) => {
              const entry = entries?.find((e) => e.id === mark.entry_id);
              return (
                <MarkCard
                  key={mark.id}
                  mark={mark}
                  entryName={resolveEntryName(mark.entry_id, entries)}
                  subLabel={buildSubLabel(mark, entry, t, dayShort)}
                  tag={entry?.tag ?? null}
                  after={
                    <div className="flex items-center" style={{ gap: 8 }}>
                      {entry && (
                        <StreakPill
                          streak={entry.streak_current}
                          onClick={() => navigate("/game")}
                        />
                      )}
                      <MarkTakenButton markId={mark.id} isTaken={mark.status} />
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
