import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { BottomSheet } from "@/shared/ui";

interface CustomIntervalModalProps {
  isOpen: boolean;
  currentValue: number;
  onClose: () => void;
  onSave: (minutes: number) => void;
}

export function CustomIntervalModal({ isOpen, currentValue, onClose, onSave }: CustomIntervalModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(currentValue || 10));

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "Tab") return;
    if (e.key === "Enter") { e.preventDefault(); return; }
    if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
    e.preventDefault();
    setValue((prev) => {
      const next = (prev.slice(-1) + e.key).slice(-2);
      const n = parseInt(next, 10);
      if (n > 60) return e.key;
      if (n < 1) return "1";
      return String(n);
    });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setValue("1"); return; }
    const n = Math.min(parseInt(raw, 10), 60);
    setValue(String(Math.max(n, 1)));
  }, []);

  const handleSave = useCallback(() => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 1 && n <= 60) {
      onSave(n);
      onClose();
    }
  }, [value, onSave, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(32px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between" style={{ height: 48 }}>
          <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
            {t("settings.custom_interval")}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1">
            <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col items-center" style={{ gap: 16, paddingTop: 16 }}>
          <p className="text-[13px]" style={{ color: "var(--color-text-hint)" }}>
            {t("settings.custom_interval_hint")}
          </p>

          <div
            className="rounded-2xl flex items-center justify-center"
            style={{
              width: 120,
              height: 72,
              backgroundColor: "rgba(249,255,208,0.12)",
              boxShadow: "0 0 0 2px #059669",
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onKeyUp={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className="text-[32px] font-bold text-center bg-transparent outline-none"
              style={{ color: "#F9FFD0", width: 60, caretColor: "transparent" }}
              maxLength={2}
            />
          </div>

          <p className="text-[12px]" style={{ color: "var(--color-text-hint)" }}>
            1 — 60 {t("settings.minutes")}
          </p>

          <button
            onClick={handleSave}
            disabled={!value || parseInt(value, 10) < 1}
            className="w-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ height: 48, borderRadius: 22, background: "var(--gradient-primary)", gap: 8, boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
          >
            <Check size={18} color="#2C3400" strokeWidth={2.5} />
            <span className="text-[15px] font-semibold text-[#2C3400]">{t("common.save")}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
