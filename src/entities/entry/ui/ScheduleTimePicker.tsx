import { Pencil } from "lucide-react";
import type { EntrySchedule } from "../model/types";
import { SCHEDULES, SCHEDULE_ICONS } from "../model/form";

interface ScheduleTimePickerProps {
  schedule: EntrySchedule;
  onScheduleChange: (next: EntrySchedule) => void;
  times: Record<EntrySchedule, string>;
  onEditTime: (schedule: EntrySchedule) => void;
  scheduleLabel: (schedule: EntrySchedule) => string;
}

export function ScheduleTimePicker({
  schedule,
  onScheduleChange,
  times,
  onEditTime,
  scheduleLabel,
}: ScheduleTimePickerProps) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
      {SCHEDULES.map((s, idx) => {
        const isSelected = schedule === s;
        const Icon = SCHEDULE_ICONS[s];
        return (
          <div key={s}>
            {idx > 0 && <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />}
            <div className="flex items-center w-full h-12" style={{ padding: "0 14px" }}>
              <button
                onClick={() => onScheduleChange(s)}
                className="flex items-center gap-2 flex-1 h-full cursor-pointer min-w-0"
              >
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  color={isSelected ? "#F9FFD0" : "var(--color-text-hint)"}
                />
                <span
                  className="text-[15px] truncate"
                  style={{
                    color: isSelected ? "var(--color-text)" : "var(--color-text-secondary)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {scheduleLabel(s)} &middot; {times[s]}
                </span>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSelected && (
                  <div className="w-5 h-5 rounded-full" style={{ background: "var(--gradient-primary)", boxShadow: "0 2px 6px rgba(249,255,208,0.2)" }} />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTime(s);
                  }}
                  className="cursor-pointer p-1"
                  aria-label={`edit-time-${s}`}
                >
                  <Pencil size={14} color="var(--color-text-hint)" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
