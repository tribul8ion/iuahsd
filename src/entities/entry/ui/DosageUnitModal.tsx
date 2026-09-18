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
          <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
            {t("medications.dosage_unit_modal_title")}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="#A8A29E" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#F5F5F4" }}>
            {UNITS.map((unit, idx) => {
              const isSelected = selected === unit;
              return (
                <div key={unit}>
                  {idx > 0 && <div className="h-px" style={{ backgroundColor: "#E7E5E4" }} />}
                  <button
                    onClick={() => handleSelect(unit)}
                    className="flex items-center w-full h-12 cursor-pointer"
                    style={{ padding: "0 14px" }}
                  >
                    <span
                      className="text-[15px] flex-1 text-left truncate"
                      style={{
                        color: isSelected ? "#1C1917" : "#57534E",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {t(`medications.dosage_unit.${unit}`)}
                    </span>
                    {isSelected && (
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSave}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
          >
            <Check size={18} strokeWidth={2.5} />
            {t("medications.dosage_unit_save")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
