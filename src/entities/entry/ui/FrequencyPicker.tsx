import { Plus, Minus } from "lucide-react";
import type { FrequencyType } from "../model/types";
import { clampInterval, INTERVAL_MIN, INTERVAL_DEFAULT } from "../model/form";
import { hasDayBit } from "../model/frequency";
import { todayISO } from "@/shared/lib";

export interface FrequencyPickerLabels {
  daily: string;
  weekly?: string;
  interval: string;
  every: string;
  daysSuffix: string;
}

export interface FrequencyPickerStartDate {
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
}

interface FrequencyPickerProps {
  value: FrequencyType;
  onChange: (next: FrequencyType) => void;
  labels: FrequencyPickerLabels;
  showWeekly?: boolean;
  daysOfWeek?: number;
  onToggleDay?: (dayIndex: number) => void;
  dayLabels?: readonly string[];
  intervalDays: number;
  onIntervalDaysChange: (next: number) => void;
  intervalMax: number;
  intervalMin?: number;
  intervalValueWidthClass?: string;
  validationMessage?: string | null;
  startDate?: FrequencyPickerStartDate;
}

export function FrequencyPicker({
  value,
  onChange,
  labels,
  showWeekly = false,
  daysOfWeek = 0,
  onToggleDay,
  dayLabels = [],
  intervalDays,
  onIntervalDaysChange,
  intervalMax,
  intervalMin = INTERVAL_MIN,
  intervalValueWidthClass = "w-6",
  validationMessage,
  startDate,
}: FrequencyPickerProps) {
  const tabs: FrequencyType[] = showWeekly ? ["daily", "weekly", "interval"] : ["daily", "interval"];

  const handleTabClick = (next: FrequencyType) => {
    onChange(next);
    if (next === "interval") {
      onIntervalDaysChange(clampInterval(intervalDays || INTERVAL_DEFAULT, intervalMax, intervalMin));
    }
  };

  const handleStep = (delta: number) => {
    onIntervalDaysChange(clampInterval(intervalDays + delta, intervalMax, intervalMin));
  };

  const tabLabel = (freq: FrequencyType): string => {
    if (freq === "daily") return labels.daily;
    if (freq === "weekly") return labels.weekly ?? "";
    return labels.interval;
  };

  return (
    <div>
      <div
        className="flex rounded-xl"
        style={{ backgroundColor: "#F5F5F4", padding: 4, gap: 4 }}
        role="tablist"
        aria-label="frequency-type"
      >
        {tabs.map((freq) => (
          <button
            key={freq}
            onClick={() => handleTabClick(freq)}
            role="tab"
            aria-selected={value === freq}
            className={`flex-1 h-10 rounded-lg font-medium cursor-pointer transition-all ${showWeekly ? "text-[13px]" : "text-[14px]"}`}
            style={{
              backgroundColor: value === freq ? "#FFFFFF" : "transparent",
              color: value === freq ? "#1C1917" : "#57534E",
              fontWeight: value === freq ? 600 : 500,
              boxShadow: value === freq ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {tabLabel(freq)}
          </button>
        ))}
      </div>

      {value === "weekly" && showWeekly && (
        <div className="flex mt-2" style={{ gap: 6 }}>
          {dayLabels.map((label, dayIndex) => {
            const isSelected = hasDayBit(daysOfWeek, dayIndex);
            return (
              <button
                key={dayIndex}
                onClick={() => onToggleDay?.(dayIndex)}
                aria-pressed={isSelected}
                aria-label={`day-${dayIndex}`}
                className="flex-1 h-10 rounded-lg text-[13px] font-medium cursor-pointer transition-all"
                style={{
                  backgroundColor: isSelected ? "#059669" : "#F5F5F4",
                  color: isSelected ? "#FFFFFF" : "#57534E",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {value === "interval" && (
        <div className="rounded-xl overflow-hidden mt-2" style={{ backgroundColor: "#F5F5F4" }}>
          {startDate && (
            <>
              <div
                className="flex items-center justify-between w-full h-12"
                style={{ padding: "0 14px" }}
              >
                <label
                  htmlFor="frequency-start-date"
                  className="text-[15px]"
                  style={{ color: "#57534E" }}
                >
                  {startDate.label}
                </label>
                <input
                  id="frequency-start-date"
                  type="date"
                  value={startDate.value}
                  min={startDate.min}
                  onChange={(e) => startDate.onChange(e.target.value || todayISO())}
                  className="text-[15px] bg-transparent outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:p-0"
                  style={{
                    color: "#1C1917",
                    fontWeight: 600,
                    width: 140,
                    flex: "0 0 auto",
                  }}
                  aria-label="start-date"
                />
              </div>
              <div className="h-px" style={{ backgroundColor: "#E7E5E4" }} />
            </>
          )}
          <div
            className="flex items-center justify-between w-full h-12"
            style={{ padding: "0 14px" }}
          >
            <span className="text-[15px]" style={{ color: "#57534E" }}>
              {labels.every}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStep(-1)}
                disabled={intervalDays <= intervalMin}
                className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#E7E5E4" }}
                aria-label="interval-decrement"
              >
                <Minus size={14} color="#1C1917" strokeWidth={2} />
              </button>
              <span
                className={`text-[15px] font-semibold ${intervalValueWidthClass} text-center`}
                style={{ color: "#1C1917" }}
                aria-label="interval-value"
              >
                {intervalDays}
              </span>
              <button
                onClick={() => handleStep(1)}
                disabled={intervalDays >= intervalMax}
                className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#E7E5E4" }}
                aria-label="interval-increment"
              >
                <Plus size={14} color="#1C1917" strokeWidth={2} />
              </button>
              <span className="text-[15px]" style={{ color: "#57534E", marginLeft: 4 }}>
                {labels.daysSuffix}
              </span>
            </div>
          </div>
        </div>
      )}

      {validationMessage && (
        <p className="text-[12px] mt-2" style={{ color: "#E11D48" }}>
          {validationMessage}
        </p>
      )}
    </div>
  );
}
