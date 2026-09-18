import { useTranslation } from "react-i18next";
import { Clock, ListTodo, Stethoscope, type LucideIcon } from "lucide-react";
import { tagEmoji, daySlotForTime, DAY_SLOT_ICONS, DAY_SLOT_COLORS, colorHex } from "@/entities/entry";
import type { MarkItem } from "../model/types";

interface MarkCardProps {
  mark: MarkItem;
  entryName: string | null;
  subLabel: string;
  after?: React.ReactNode;
  tag?: string | null;
}

const HABIT_COLORS = { icon: "#EA580C", bg: "#FFF7ED" };
const TASK_COLORS = { icon: "#7C3AED", bg: "#F1EDFD" };
const DOC_COLORS = { icon: "#E11D48", bg: "#FFF1F2" };

const KIND_ICONS: Partial<Record<string, LucideIcon>> = {
  task: ListTodo,
  doc: Stethoscope,
};

const KIND_COLORS: Partial<Record<string, { icon: string; bg: string }>> = {
  habit: HABIT_COLORS,
  task: TASK_COLORS,
  doc: DOC_COLORS,
};

export function MarkCard({ mark, entryName, subLabel, after, tag }: MarkCardProps) {
  const { t } = useTranslation();

  const isMed = mark.entry_kind === "med";
  const isHabit = mark.entry_kind === "habit";
  const slot = daySlotForTime(mark.entry_time);
  const Icon = isMed ? DAY_SLOT_ICONS[slot] : KIND_ICONS[mark.entry_kind] ?? Clock;
  const colors = isMed ? DAY_SLOT_COLORS[slot] : KIND_COLORS[mark.entry_kind] ?? HABIT_COLORS;
  const tileBg = isHabit ? (tag ? HABIT_COLORS.bg : "#F5F5F4") : colors.bg;
  const medColorHex = isMed ? colorHex(mark.entry_color) : null;

  return (
    <div
      className="rounded-2xl bg-white flex items-center"
      style={{ gap: 12, padding: "0 16px", height: 72, boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
        style={{ backgroundColor: tileBg }}
      >
        {isHabit ? (
          <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true">
            {tagEmoji(tag ?? null)}
          </span>
        ) : (
          <Icon size={18} color={colors.icon} strokeWidth={1.8} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center" style={{ gap: 6 }}>
          <p
            className="text-[15px] font-semibold leading-snug truncate"
            style={{ color: entryName === null ? "#A8A29E" : "#1C1917" }}
          >
            {entryName ?? t("today.corrupted_entry")}
          </p>
          {medColorHex && (
            <span
              aria-label="mark-medication-color"
              className="rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, backgroundColor: medColorHex }}
            />
          )}
        </div>
        <p className="text-[12px]" style={{ color: "#A8A29E", marginTop: 2 }}>
          {subLabel}
        </p>
      </div>

      {after && <div className="flex-shrink-0">{after}</div>}
    </div>
  );
}
