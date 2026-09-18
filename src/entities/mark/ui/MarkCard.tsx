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

const HABIT_COLORS = { icon: "#F26D21", bg: "#2C2C2E" };
const TASK_COLORS = { icon: "#A78BFA", bg: "#2C2C2E" };
const DOC_COLORS = { icon: "#FB7185", bg: "#2C2C2E" };

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
  const colors = isMed
    ? { icon: DAY_SLOT_COLORS[slot].icon, bg: "#2C2C2E" }
    : (KIND_COLORS[mark.entry_kind] ?? HABIT_COLORS);
  const medColorHex = isMed ? colorHex(mark.entry_color) : null;

  return (
    <div
      className="glass rounded-[24px] flex items-center"
      style={{ gap: 14, padding: "0 16px", height: 72 }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: colors.bg }}
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
            className="text-[13px] font-semibold leading-snug truncate uppercase"
            style={{
              letterSpacing: "0.05em",
              color: entryName === null ? "var(--color-text-hint)" : "var(--color-text)",
            }}
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
        <p className="text-[13px]" style={{ color: "var(--color-text-secondary)", marginTop: 2 }}>
          {subLabel}
        </p>
      </div>

      {after && <div className="flex-shrink-0">{after}</div>}
    </div>
  );
}
