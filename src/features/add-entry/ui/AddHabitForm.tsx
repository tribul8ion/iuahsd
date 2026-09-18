import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X, Pencil, Plus } from "lucide-react";
import type { FrequencyType } from "@/entities/entry";
import { toggleDayBit, TagPicker, FrequencyPicker, HABIT_INTERVAL_MAX, INTERVAL_DEFAULT, clampInterval } from "@/entities/entry";
import { BottomSheet, FieldLabel, EditTimeModal } from "@/shared/ui";
import { todayISO } from "@/shared/lib";
import { useAddEntry } from "../model/use-add-entry";

interface AddHabitFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_TIME = "09:00";

export function AddHabitForm({ isOpen, onClose }: AddHabitFormProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useAddEntry();

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState(DEFAULT_TIME);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState(0);
  const [intervalDays, setIntervalDays] = useState(INTERVAL_DEFAULT);
  const [tag, setTag] = useState<string | null>(null);

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
    const payloadStartDate = frequencyType === "interval" ? todayISO() : null;

    mutate(
      {
        kind: "habit",
        values: {
          name: trimmedName,
          notes: notes.trim() || null,
          time,
          frequency_type: frequencyType,
          days_of_week: payloadDaysOfWeek,
          interval_days: payloadIntervalDays,
          start_date: payloadStartDate,
          active: true,
          tag,
        },
      },
      { onSuccess: onClose }
    );
  }, [isValid, trimmedName, notes, time, frequencyType, daysOfWeek, intervalDays, tag, mutate, onClose]);

  return (
    <>
      <BottomSheet isOpen={isOpen && !isTimeModalOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
              {t("habit.add_habit")}
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
                  id="habit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("habit.name_placeholder")}
                  maxLength={100}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
                  style={{ color: "var(--color-text)" }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("habit.note_prompt")}</FieldLabel>
              <div className="flex items-center rounded-xl" style={{ backgroundColor: "var(--color-surface-muted)", padding: "0 14px", height: 48 }}>
                <input
                  id="habit-note"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("habit.note_placeholder")}
                  maxLength={200}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
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
              className="w-full h-12 rounded-full text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
              {t("habit.add_habit")}
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
