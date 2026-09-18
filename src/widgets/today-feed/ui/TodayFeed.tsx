import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PartyPopper, AlertCircle, ClipboardList } from "lucide-react";
import {
  MarkCard,
  groupMarksByTime,
  resolveEntryName,
  useTodayMarks,
  formatMarkSchedule,
} from "@/entities/mark";
import type { MarkItem } from "@/entities/mark";
import { useEntries, StreakPill } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { MarkTakenButton } from "@/features/mark-taken";
import { Spinner, Confetti, EmptyState } from "@/shared/ui";

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

  const items = marks?.items ?? [];
  const takenCount = items.filter((e) => e.status).length;
  const allTaken = items.length > 0 && takenCount === items.length;

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
        icon={<ClipboardList size={36} color="#A8A29E" strokeWidth={1.5} />}
        title={t("today.empty_title")}
        subtitle={t("today.empty_subtitle")}
        minHeight="calc(100vh - 180px - 74px - 32px)"
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
        className="rounded-[22px] flex items-center"
        style={{
          padding: "16px 20px",
          gap: 16,
          background: "var(--gradient-card-mint)",
          border: "1px solid rgba(5, 150, 105, 0.1)",
          boxShadow: "0 1px 2px rgba(30,41,59,0.05), 0 8px 20px -12px rgba(5,150,105,0.18)",
        }}
      >
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: 56, height: 56, transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="progress-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="15" fill="none" stroke="#DCEEE5" strokeWidth="4" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="url(#progress-ring)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${pct * 0.942} 100`}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold"
            style={{ color: "#1C1917" }}
          >
            {pct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold" style={{ color: "#1C1917" }}>
            {t("checklist.progress_count", { taken: takenCount, total: items.length })}
          </p>
          <p className="text-[13px]" style={{ color: "#78716C", marginTop: 2 }}>
            {allTaken ? t("checklist.all_taken_congrats") : t("checklist.keep_going")}
          </p>
        </div>
        {allTaken && (
          <PartyPopper size={24} color="#16A34A" style={{ flexShrink: 0, marginLeft: -8 }} />
        )}
      </div>

      {groups.map((group) => (
        <div key={group.time} className="flex flex-col" style={{ gap: 8 }}>
          <div className="flex items-center" style={{ gap: 8, padding: "0 4px" }}>
            <span
              className="rounded-full"
              style={{
                width: 22,
                height: 3,
                background: "var(--gradient-primary)",
                opacity: 0.85,
              }}
              aria-hidden="true"
            />
            <p
              className="text-[11px] font-bold uppercase"
              style={{ color: "#78716C", letterSpacing: "1.2px" }}
            >
              {group.time}
            </p>
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
