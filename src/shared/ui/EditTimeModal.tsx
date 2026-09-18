import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Check } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { hapticFeedback } from "@/shared/lib";

interface EditTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleLabel: string;
  defaultTime: string;
  currentTime: string;
  onSave: (time: string) => void;
}

type ActiveField = "hours" | "minutes";

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

function clampHours(raw: string): string {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return "00";
  return padTwo(Math.min(Math.max(n, 0), 23));
}

function clampMinutes(raw: string): string {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return "00";
  return padTwo(Math.min(Math.max(n, 0), 59));
}

export function EditTimeModal({
  isOpen,
  onClose,
  scheduleLabel,
  defaultTime,
  currentTime,
  onSave,
}: EditTimeModalProps) {
  const { t } = useTranslation();
  const [hours, setHours] = useState(() => currentTime.split(":")[0] ?? "08");
  const [minutes, setMinutes] = useState(() => currentTime.split(":")[1] ?? "00");
  const [activeField, setActiveField] = useState<ActiveField>("hours");
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);

  const handleHoursKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "Tab") return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setHours((prev) => {
      const next = (prev.slice(-1) + e.key).slice(-2);
      const n = parseInt(next, 10);
      if (n > 23) return padTwo(parseInt(e.key, 10));
      return padTwo(n);
    });
  }, []);

  const handleMinutesKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "Tab") return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setMinutes((prev) => {
      const next = (prev.slice(-1) + e.key).slice(-2);
      const n = parseInt(next, 10);
      if (n > 59) return padTwo(parseInt(e.key, 10));
      return padTwo(n);
    });
  }, []);

  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (raw === "") { setHours("00"); return; }
    const n = Math.min(parseInt(raw, 10), 23);
    setHours(padTwo(n));
  }, []);

  const handleMinutesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (raw === "") { setMinutes("00"); return; }
    const n = Math.min(parseInt(raw, 10), 59);
    setMinutes(padTwo(n));
  }, []);

  const handleSave = useCallback(() => {
    const finalHours = clampHours(hours);
    const finalMinutes = clampMinutes(minutes);
    setHours(finalHours);
    setMinutes(finalMinutes);
    hapticFeedback("notification", "success");
    onSave(`${finalHours}:${finalMinutes}`);
  }, [hours, minutes, onSave]);

  const handleReset = useCallback(() => {
    const [h, m] = defaultTime.split(":");
    setHours(h ?? "08");
    setMinutes(m ?? "00");
    hapticFeedback("impact", "light");
  }, [defaultTime]);

  const handleFieldFocus = useCallback((field: ActiveField) => {
    setActiveField(field);
    hapticFeedback("selection_change");
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(32px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12">
          <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
            {t("time_edit.title", { schedule: scheduleLabel })}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1">
            <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <p className="text-[13px]" style={{ color: "var(--color-text-hint)" }}>
            {t("time_edit.select_time", { schedule: scheduleLabel })}
          </p>

          <div className="flex items-center gap-2">
            <div
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: activeField === "hours" ? "rgba(249,255,208,0.12)" : "rgba(255,255,255,0.06)",
                boxShadow: activeField === "hours" ? "0 0 0 2px #F9FFD0" : "none",
              }}
              onClick={() => {
                handleFieldFocus("hours");
                hoursRef.current?.focus();
              }}
            >
              <input
                ref={hoursRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={hours}
                onChange={handleHoursChange}
                onKeyDown={handleHoursKey}
                onFocus={() => handleFieldFocus("hours")}
                className="w-12 text-[32px] font-bold text-center bg-transparent outline-none caret-transparent"
                style={{ color: activeField === "hours" ? "#F9FFD0" : "var(--color-text)" }}
                maxLength={2}
              />
            </div>

            <span className="text-[32px] font-bold" style={{ color: "var(--color-text-hint)" }}>:</span>

            <div
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: activeField === "minutes" ? "rgba(249,255,208,0.12)" : "rgba(255,255,255,0.06)",
                boxShadow: activeField === "minutes" ? "0 0 0 2px #F9FFD0" : "none",
              }}
              onClick={() => {
                handleFieldFocus("minutes");
                minutesRef.current?.focus();
              }}
            >
              <input
                ref={minutesRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minutes}
                onChange={handleMinutesChange}
                onKeyDown={handleMinutesKey}
                onFocus={() => handleFieldFocus("minutes")}
                className="w-12 text-[32px] font-bold text-center bg-transparent outline-none caret-transparent"
                style={{ color: activeField === "minutes" ? "#F9FFD0" : "var(--color-text)" }}
                maxLength={2}
              />
            </div>
          </div>

          <p className="text-[12px]" style={{ color: "var(--color-text-hint)" }}>
            {t("time_edit.tap_hint")}
          </p>

          <button
            onClick={handleSave}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-[#2C3400] cursor-pointer transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
          >
            <Check size={18} strokeWidth={2.5} />
            {t("time_edit.save")}
          </button>

          <button
            onClick={handleReset}
            className="w-full h-11 rounded-[14px] text-[13px] font-medium text-center cursor-pointer"
            style={{ color: "var(--color-text-hint)" }}
          >
            {t("time_edit.reset", { time: defaultTime })}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
