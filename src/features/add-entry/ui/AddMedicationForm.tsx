import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X, Plus } from "lucide-react";
import {
  DosageUnitModal, ScheduleTimePicker, FrequencyPicker, DosageInput, ColorPicker, PreRemindChips,
  DEFAULT_TIMES, INTERVAL_DEFAULT, MED_INTERVAL_MAX, clampInterval, parseDosageAmount,
} from "@/entities/entry";
import type { EntrySchedule, FrequencyType, DosageUnit, ColorKey } from "@/entities/entry";
import { BottomSheet, FieldLabel, EditTimeModal } from "@/shared/ui";
import { todayISO } from "@/shared/lib";
import { useAddEntry } from "../model/use-add-entry";

interface AddMedicationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddMedicationForm({ isOpen, onClose }: AddMedicationFormProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useAddEntry();

  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState<EntrySchedule>("morning");
  const [times, setTimes] = useState<Record<EntrySchedule, string>>({ ...DEFAULT_TIMES });
  const [editingTimeFor, setEditingTimeFor] = useState<EntrySchedule | null>(null);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const [intervalDays, setIntervalDays] = useState<number>(INTERVAL_DEFAULT);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [dosageAmountRaw, setDosageAmountRaw] = useState<string>("");
  const [dosageUnit, setDosageUnit] = useState<DosageUnit>("tablet");
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [color, setColor] = useState<ColorKey | null>(null);
  const [preRemind, setPreRemind] = useState<number[]>([]);

  const handlePreRemindToggle = useCallback((minutes: number) => {
    setPreRemind((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes]
    );
  }, []);

  const handleTimeSave = useCallback((newTime: string) => {
    if (editingTimeFor) setTimes((prev) => ({ ...prev, [editingTimeFor]: newTime }));
    setEditingTimeFor(null);
  }, [editingTimeFor]);

  const handleUnitSave = useCallback((unit: DosageUnit) => {
    setDosageUnit(unit);
    setIsUnitModalOpen(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) return;
    const dosageAmount = parseDosageAmount(dosageAmountRaw);
    const payloadDosageUnit: DosageUnit | null = dosageAmount === null ? null : dosageUnit;
    const payloadIntervalDays =
      frequencyType === "interval" ? clampInterval(intervalDays, MED_INTERVAL_MAX) : null;
    const payloadStartDate = frequencyType === "interval" ? startDate || todayISO() : null;

    mutate(
      {
        kind: "med",
        values: {
          name: name.trim(),
          doseAmount: dosageAmount,
          doseUnit: payloadDosageUnit,
          notes: null,
          schedule,
          time: times[schedule],
          frequency_type: frequencyType,
          interval_days: payloadIntervalDays,
          start_date: payloadStartDate,
          active: true,
          color,
          pre_remind: preRemind,
        },
      },
      { onSuccess: onClose }
    );
  }, [name, schedule, times, frequencyType, intervalDays, startDate, dosageAmountRaw, dosageUnit, color, preRemind, mutate, onClose]);

  const isValid = name.trim().length > 0 && name.trim().length <= 100;
  const isSubModalOpen = !!editingTimeFor || isUnitModalOpen;

  return (
    <>
      <BottomSheet isOpen={isOpen && !isSubModalOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
              {t("medications.add_medication")}
            </h2>
            <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
              <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>{t("medications.medication_name_prompt")}</FieldLabel>
              <div className="flex items-center rounded-xl" style={{ backgroundColor: "var(--color-surface-muted)", padding: "0 14px", height: 48 }}>
                <input
                  id="med-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("medications.medication_name_placeholder")}
                  maxLength={100}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
                  style={{ color: "var(--color-text)" }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("medications.select_schedule")}</FieldLabel>
              <ScheduleTimePicker
                schedule={schedule}
                onScheduleChange={setSchedule}
                times={times}
                onEditTime={setEditingTimeFor}
                scheduleLabel={(s) => t(`medications.${s}`)}
              />
            </div>

            <div>
              <FieldLabel>{t("medications.frequency")}</FieldLabel>
              <FrequencyPicker
                value={frequencyType}
                onChange={setFrequencyType}
                labels={{
                  daily: t("medications.frequency_daily"),
                  interval: t("medications.frequency_interval"),
                  every: t("medications.frequency_every"),
                  daysSuffix: t("medications.frequency_days_suffix"),
                }}
                intervalDays={intervalDays}
                onIntervalDaysChange={setIntervalDays}
                intervalMax={MED_INTERVAL_MAX}
                startDate={{ label: t("medications.frequency_start_date"), value: startDate, onChange: setStartDate, min: todayISO() }}
              />
            </div>

            <div>
              <FieldLabel>{t("medications.dosage")}</FieldLabel>
              <DosageInput
                amountRaw={dosageAmountRaw}
                onAmountChange={setDosageAmountRaw}
                unit={dosageUnit}
                onOpenUnitModal={() => setIsUnitModalOpen(true)}
                amountPlaceholder={t("medications.dosage_amount_placeholder")}
                unitLabel={(unit) => t(`medications.dosage_unit.${unit}`)}
              />
            </div>

            <div>
              <FieldLabel>{t("med_color.label")}</FieldLabel>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div>
              <FieldLabel marginBottom={4}>{t("once.pre_remind_prompt")}</FieldLabel>
              <p className="text-[13px] mb-2" style={{ color: "var(--color-text-hint)" }}>
                {t("once.pre_remind_hint")}
              </p>
              <PreRemindChips selected={preRemind} onToggle={handlePreRemindToggle} />
            </div>

            <button
              disabled={!isValid || isPending}
              onClick={handleSubmit}
              className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
              {t("medications.add_medication")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {editingTimeFor && (
        <EditTimeModal
          key={editingTimeFor}
          isOpen={!!editingTimeFor}
          onClose={() => setEditingTimeFor(null)}
          scheduleLabel={t(`medications.${editingTimeFor}`)}
          defaultTime={DEFAULT_TIMES[editingTimeFor]}
          currentTime={times[editingTimeFor]}
          onSave={handleTimeSave}
        />
      )}

      {isUnitModalOpen && (
        <DosageUnitModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          currentUnit={dosageUnit}
          onSave={handleUnitSave}
        />
      )}
    </>
  );
}
