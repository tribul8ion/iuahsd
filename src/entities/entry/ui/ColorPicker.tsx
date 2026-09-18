import { useTranslation } from "react-i18next";
import { ENTRY_COLORS, VALID_COLORS } from "../model/colors";
import type { ColorKey } from "../model/colors";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: ColorKey | null) => void;
}

const SWATCH_SIZE = 40;

function swatchStyle(selected: boolean, backgroundColor: string): React.CSSProperties {
  return {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: "50%",
    backgroundColor,
    border: selected ? "2px solid #059669" : "2px solid transparent",
    position: "relative",
    flexShrink: 0,
  };
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex flex-wrap" style={{ gap: 8 }} role="group" aria-label="color-picker">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="color-none"
          aria-pressed={value === null}
          className="cursor-pointer"
          style={swatchStyle(value === null, "rgba(255,255,255,0.06)")}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 26,
              height: 2,
              backgroundColor: "rgba(255,255,255,0.25)",
              transform: "translate(-50%, -50%) rotate(-45deg)",
            }}
          />
        </button>
        {VALID_COLORS.map((key: ColorKey) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={`color-${key}`}
            aria-pressed={value === key}
            className="cursor-pointer"
            style={swatchStyle(value === key, ENTRY_COLORS[key])}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: "var(--color-text-hint)", marginTop: 6 }}>
        {t("med_color.hint")}
      </p>
    </div>
  );
}
