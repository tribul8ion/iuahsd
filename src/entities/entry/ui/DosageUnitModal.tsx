import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, Check } from "lucide-react";
import type { DosageUnit } from "../model/types";
import { BottomSheet } from "@/shared/ui";
import { hapticFeedback } from "@/shared/lib";

interface DosageUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUnit: DosageUnit;
  onSave: (unit: DosageUnit) => void;
}

const UNITS: DosageUnit[] = ["tablet", "ml", "drop", "mg", "iu", "pcs"];

export function DosageUnitModal({
  isOpen,
  onClose,
  currentUnit,
  onSave,
}: DosageUnitModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<DosageUnit>(currentUnit);

  const handleSelect = useCallback((unit: DosageUnit) => {
    setSelected(unit);
    hapticFeedback("selection_change");
  }, []);

  const handleSave = useCallback(() => {
    hapticFeedback("notification", "success");
    onSave(selected);
  }, [selected, onSave]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
            {t("medications.dosage_unit_modal_title")}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            {UNITS.map((unit, idx) => {
              const isSelected = selected === unit;
              return (
                <div key={unit}>
                  {idx > 0 && <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />}
                  <button
                    onClick={() => handleSelect(unit)}
                    className="flex items-center w-full h-12 cursor-pointer"
                    style={{ padding: "0 14px" }}
                  >
                    <span
                      className="text-[15px] flex-1 text-left truncate"
                      style={{
                        color: isSelected ? "var(--color-text)" : "var(--color-text-secondary)",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {t(`medications.dosage_unit.${unit}`)}
                    </span>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ background: "var(--gradient-primary)", boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-[#2C3400] cursor-pointer transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
          >
            <Check size={18} strokeWidth={2.5} />
            {t("medications.dosage_unit_save")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
