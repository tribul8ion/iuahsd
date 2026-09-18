import { useTranslation } from "react-i18next";
import { PRE_REMIND_OPTIONS } from "../model/types";

interface PreRemindChipsProps {
  selected: readonly number[];
  onToggle: (minutes: number) => void;
}

const MAX_SELECTED = 3;

export function PreRemindChips({ selected, onToggle }: PreRemindChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap" style={{ gap: 6 }}>
      {PRE_REMIND_OPTIONS.map((minutes) => {
        const isSelected = selected.includes(minutes);
        const isDisabled = !isSelected && selected.length >= MAX_SELECTED;
        return (
          <button
            key={minutes}
            type="button"
            onClick={() => onToggle(minutes)}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-label={`pre-remind-${minutes}`}
            className="h-9 rounded-full text-[13px] font-medium cursor-pointer transition-all disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              padding: "0 14px",
              background: isSelected ? "var(--gradient-primary)" : "rgba(255,255,255,0.07)",
              boxShadow: isSelected ? "0 4px 10px -3px rgba(249,255,208,0.18)" : "none",
              color: isSelected ? "#2C3400" : "var(--color-text-secondary)",
            }}
          >
            {t(`once.pre_chip_${minutes}`)}
          </button>
        );
      })}
    </div>
  );
}
