import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, X, Trash2, Pencil } from "lucide-react";
import type { Entry, FrequencyType } from "@/entities/entry";
import { toggleDayBit, TagPicker, FrequencyPicker, HABIT_INTERVAL_MAX, INTERVAL_DEFAULT, clampInterval } from "@/entities/entry";
import { BottomSheet, FieldLabel, EditTimeModal } from "@/shared/ui";
import { todayISO } from "@/shared/lib";
import { useEditEntry } from "../model/use-edit-entry";

interface EditHabitModalProps {
  habit: Entry;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DEFAULT_TIME = "09:00";

export function EditHabitModal({ habit, isOpen, onClose, onDelete }: EditHabitModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useEditEntry();

  const [name, setName] = useState(habit.name);
  const [notes, setNotes] = useState(habit.notes ?? "");
  const [time, setTime] = useState(habit.time);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(habit.frequency_type ?? "daily");
  const [daysOfWeek, setDaysOfWeek] = useState(habit.days_of_week ?? 0);
  const [intervalDays, setIntervalDays] = useState(habit.interval_days ?? INTERVAL_DEFAULT);
  const [tag, setTag] = useState<string | null>(habit.tag ?? null);

  const dayShort = t("habit.days_short", { returnObjects: true }) as string[];

  const handleToggleDay = useCallback((dayIndex: number) => {
    setDaysOfWeek((prev) => toggleDayBit(prev, dayIndex));
  }, []);

  const handleTimeSave = useCallback((newTime: string) => {
    setTime(newTime);
    setIsTimeModalOpen(false);
  }, []);

  const trimmedName = name.trim();
  const isWeeklyInvalid = frequencyType === "weekly" && daysOfWeek === 0;
  const isValid = trimmedName.length > 0 && trimmedName.length <= 100 && !isWeeklyInvalid;

  const validationMessage = useMemo(() => {
    if (trimmedName.length === 0) return null;
    return isWeeklyInvalid ? t("habit.validation_days") : null;
  }, [trimmedName, isWeeklyInvalid, t]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    const payloadIntervalDays =
      frequencyType === "interval" ? clampInterval(intervalDays, HABIT_INTERVAL_MAX) : null;
    const payloadDaysOfWeek = frequencyType === "weekly" ? daysOfWeek : null;
    const payloadStartDate = frequencyType === "interval" ? habit.start_date ?? todayISO() : null;

    mutate(
      {
        id: habit.id,
        kind: "habit",
        values: {
          name: trimmedName,
          notes: notes.trim() || null,
          time,
          frequency_type: frequencyType,
          days_of_week: payloadDaysOfWeek,
          interval_days: payloadIntervalDays,
          start_date: payloadStartDate,
          active: habit.active,
          tag,
        },
      },
      { onSuccess: onClose }
    );
  }, [
    isValid, habit.id, habit.active, habit.start_date, trimmedName, notes, time,
    frequencyType, daysOfWeek, intervalDays, tag, mutate, onClose,
  ]);

  return (
    <>
      <BottomSheet isOpen={isOpen && !isTimeModalOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
              {t("habit.edit_habit")}
            </h2>
            <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
              <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>{t("habit.name_prompt")}</FieldLabel>
              <div className="flex items-center rounded-xl" style={{ backgroundColor: "var(--color-surface-muted)", padding: "0 14px", height: 48 }}>
                <input
                  id="edit-habit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full text-[15px] bg-transparent outline-none"
                  style={{ color: "var(--color-text)" }}
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("habit.note_prompt")}</FieldLabel>
              <div className="flex items-center rounded-xl" style={{ backgroundColor: "var(--color-surface-muted)", padding: "0 14px", height: 48 }}>
                <input
                  id="edit-habit-note"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  className="w-full text-[15px] bg-transparent outline-none"
                  style={{ color: "var(--color-text)" }}
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("habit.time_prompt")}</FieldLabel>
              <button
                onClick={() => setIsTimeModalOpen(true)}
                className="flex items-center justify-between rounded-xl w-full cursor-pointer"
                style={{ backgroundColor: "var(--color-surface-muted)", padding: "0 14px", height: 48 }}
                aria-label="edit-habit-time"
              >
                <span className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>{time}</span>
                <Pencil size={14} color="var(--color-text-hint)" strokeWidth={1.8} />
              </button>
            </div>

            <div>
              <FieldLabel>{t("habit.frequency_prompt")}</FieldLabel>
              <FrequencyPicker
                value={frequencyType}
                onChange={setFrequencyType}
                labels={{
                  daily: t("habit.frequency_daily"),
                  weekly: t("habit.frequency_weekly"),
                  interval: t("habit.frequency_interval"),
                  every: t("habit.every_label"),
                  daysSuffix: t("habit.days_suffix"),
                }}
                showWeekly
                daysOfWeek={daysOfWeek}
                onToggleDay={handleToggleDay}
                dayLabels={dayShort}
                intervalDays={intervalDays}
                onIntervalDaysChange={setIntervalDays}
                intervalMax={HABIT_INTERVAL_MAX}
                intervalValueWidthClass="w-8"
                validationMessage={validationMessage}
              />
            </div>

            <TagPicker value={tag} onChange={setTag} />

            <button
              disabled={!isValid || isPending}
              onClick={handleSubmit}
              className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-[#2C3400] cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={2.5} />}
              {t("habit.save_changes")}
            </button>

            <button
              onClick={onDelete}
              className="w-full h-10 text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
              style={{ color: "var(--color-danger)" }}
            >
              <Trash2 size={15} color="var(--color-danger)" strokeWidth={1.8} />
              {t("habit.delete_habit")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {isTimeModalOpen && (
        <EditTimeModal
          isOpen={isTimeModalOpen}
          onClose={() => setIsTimeModalOpen(false)}
          scheduleLabel={t("habit.time_prompt")}
          defaultTime={DEFAULT_TIME}
          currentTime={time}
          onSave={handleTimeSave}
        />
      )}
    </>
  );
}
