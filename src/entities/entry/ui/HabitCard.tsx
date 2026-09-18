import { useTranslation } from "react-i18next";
import type { Entry } from "../model/types";
import { formatHabitFrequency } from "../model/frequency";
import { tagEmoji } from "../model/tags";
import { StreakPill } from "./StreakPill";
import { NotificationBell } from "./NotificationBell";

interface HabitCardProps {
  habit: Entry;
  onToggleActive?: (active: boolean) => void;
  onToggleNotifications?: (enabled: boolean) => void;
  onClick?: () => void;
}

export function HabitCard({
  habit,
  onToggleActive,
  onToggleNotifications,
  onClick,
}: HabitCardProps) {
  const { t } = useTranslation();

  const dayShort = t("habit.days_short", { returnObjects: true }) as string[];
  const freqLabel = formatHabitFrequency(
    habit.frequency_type,
    habit.interval_days,
    habit.days_of_week,
    {
      daily: t("habit.frequency_daily"),
      everyNDays: (n) => t("habit.every_n_days", { n }),
      dayShort,
    }
  );

  return (
    <div
      className="flex items-center rounded-2xl bg-white cursor-pointer"
      style={{
        gap: 12,
        padding: "0 16px",
        height: 80,
        boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
        opacity: habit.active ? 1 : 0.55,
      }}
      onClick={onClick}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center"
        style={{ backgroundColor: habit.tag ? "#FFF7ED" : "#F5F5F4" }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">
          {tagEmoji(habit.tag)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[16px] font-semibold leading-snug truncate"
          style={{ color: habit.corrupted ? "#A8A29E" : "#1C1917" }}
        >
          {habit.corrupted ? t("today.corrupted_entry") : habit.name}
        </p>
        <p className="text-[12px] mt-0.5 truncate" style={{ color: "#A8A29E" }}>
          {habit.time} &middot; {freqLabel}
        </p>
      </div>

      <StreakPill streak={habit.streak_current} />

      {(onToggleActive || onToggleNotifications) && (
        <div
          className="flex-shrink-0 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onToggleNotifications && (
            <NotificationBell entry={habit} onToggle={onToggleNotifications} />
          )}
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(!habit.active)}
              role="switch"
              aria-checked={habit.active}
              aria-label="toggle-active"
              className="cursor-pointer w-[42px] h-[26px] rounded-full relative transition-colors duration-200"
              style={{ backgroundColor: habit.active ? "#059669" : "#E7E5E4" }}
            >
              <span
                className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: habit.active ? "translateX(19px)" : "translateX(3px)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
                  left: 0,
                }}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
