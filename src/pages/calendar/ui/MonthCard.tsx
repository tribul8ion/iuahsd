import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MarkRangeItem } from "@/entities/mark";
import { buildMonthGrid, todayISO } from "../model/grid";
import {
  KIND_DOT_COLORS,
  MAX_VISIBLE_DOTS,
  kindsByDate,
  medColorByDate,
  resolveDotColor,
} from "../model/dots";

interface MonthCardProps {
  year: number;
  month: number;
  items: readonly MarkRangeItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export function MonthCard({
  year,
  month,
  items,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  canGoPrev = true,
  canGoNext = true,
}: MonthCardProps) {
  const { t, i18n } = useTranslation();
  const dayShort = t("habit.days_short", { returnObjects: true }) as string[];
  const today = todayISO();

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const dotsByDate = useMemo(() => kindsByDate(items), [items]);
  const medColors = useMemo(() => medColorByDate(items), [items]);

  const monthLabel = useMemo(() => {
    const locale = i18n.language === "ru" ? "ru-RU" : "en-US";
    return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [year, month, i18n.language]);

  return (
    <div
      className="glass rounded-[26px]"
      style={{ padding: "16px" }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <button
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
          aria-label={t("calendar.prev_month")}
        >
          <ChevronLeft size={16} color="#57534E" strokeWidth={2} />
        </button>
        <p className="text-[15px] font-bold capitalize" style={{ color: "#1C1917" }}>
          {monthLabel}
        </p>
        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
          }}
          aria-label={t("calendar.next_month")}
        >
          <ChevronRight size={16} color="#57534E" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7" style={{ marginBottom: 6 }}>
        {dayShort.map((label) => (
          <p
            key={label}
            className="text-center text-[10px] font-semibold uppercase"
            style={{ color: "#A8A29E" }}
          >
            {label}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-7" style={{ rowGap: 4 }}>
        {grid.map((cell) => {
          const isToday = cell.iso === today;
          const isSelected = cell.iso === selectedDate;
          const kinds = dotsByDate.get(cell.iso) ?? [];
          const visibleKinds = kinds.slice(0, MAX_VISIBLE_DOTS);
          const hasOverflow = kinds.length > MAX_VISIBLE_DOTS;

          return (
            <button
              key={cell.iso}
              onClick={() => onSelectDate(cell.iso)}
              className="flex flex-col items-center justify-center cursor-pointer"
              style={{ height: 44, gap: 2, opacity: cell.inMonth ? 1 : 0.35 }}
              aria-label={cell.iso}
              aria-current={isToday ? "date" : undefined}
              aria-selected={isSelected}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  background: isToday ? "var(--gradient-primary)" : "transparent",
                  boxShadow: isToday
                    ? "0 4px 10px -2px rgba(5,150,105,0.4)"
                    : isSelected
                      ? "inset 0 0 0 1.6px #059669"
                      : "none",
                }}
              >
                <span
                  className="text-[13px]"
                  style={{
                    color: isToday ? "#FFFFFF" : "#1C1917",
                    fontWeight: isToday || isSelected ? 700 : 500,
                  }}
                >
                  {cell.day}
                </span>
              </div>
              <div className="flex items-center" style={{ gap: 2, height: 5 }}>
                {visibleKinds.map((kind) => (
                  <span
                    key={kind}
                    aria-label={`dot-${kind}-${cell.iso}`}
                    className="rounded-full"
                    style={{
                      width: 4,
                      height: 4,
                      backgroundColor: resolveDotColor(kind, cell.iso, medColors),
                    }}
                  />
                ))}
                {hasOverflow && (
                  <span className="text-[8px] font-bold leading-none" style={{ color: "#A8A29E" }}>
                    +
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: 12, marginTop: 12 }}>
        {(["med", "habit", "task", "doc"] as const).map((kind) => (
          <div key={kind} className="flex items-center" style={{ gap: 5 }}>
            <span
              className="rounded-full"
              style={{ width: 6, height: 6, backgroundColor: KIND_DOT_COLORS[kind] }}
            />
            <span className="text-[11px]" style={{ color: "#A8A29E" }}>
              {t(`calendar.legend_${kind}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
