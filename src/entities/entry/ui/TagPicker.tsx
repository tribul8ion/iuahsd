import { useTranslation } from "react-i18next";
import { TAGS, VALID_TAGS, NO_TAG_EMOJI } from "../model/tags";
import type { TagKey } from "../model/tags";

interface TagPickerProps {
  value: string | null;
  onChange: (tag: string | null) => void;
}

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    backgroundColor: selected ? "#ECFDF5" : "#F5F5F4",
    border: selected ? "2px solid #059669" : "2px solid transparent",
  };
}

export function TagPicker({ value, onChange }: TagPickerProps) {
  const { t } = useTranslation();

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase"
        style={{ color: "#A8A29E", letterSpacing: "1px", marginBottom: 8 }}
      >
        {t("habit.tag_prompt")}
      </p>
      <div className="flex flex-wrap" style={{ gap: 8 }} role="group" aria-label="tag-picker">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="tag-none"
          aria-pressed={value === null}
          className="cursor-pointer"
          style={chipStyle(value === null)}
        >
          {NO_TAG_EMOJI}
        </button>
        {VALID_TAGS.map((key: TagKey) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-label={`tag-${key}`}
            aria-pressed={value === key}
            className="cursor-pointer"
            style={chipStyle(value === key)}
          >
            {TAGS[key]}
          </button>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: "#A8A29E", marginTop: 6 }}>
        {t("habit.tag_hint")}
      </p>
    </div>
  );
}
