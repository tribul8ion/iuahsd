import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import type { Entry } from "@/entities/entry";

interface NoteRowProps {
  note: Entry;
  onClick: () => void;
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

export function NoteRow({ note, onClick }: NoteRowProps) {
  const { t, i18n } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="flex items-center w-full glass rounded-[24px] cursor-pointer"
      style={{ gap: 12, padding: "0 16px", height: 64 }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">
        📝
      </span>
      <span className="flex-1 min-w-0 text-left">
        <p
          className="text-[15px] font-semibold truncate"
          style={{ color: note.corrupted ? "#A8A29E" : "#1C1917" }}
        >
          {note.corrupted
            ? t("today.corrupted_entry")
            : note.name || t("note.untitled")}
        </p>
      </span>
      <span className="text-[12px] flex-shrink-0" style={{ color: "#A8A29E" }}>
        {formatDate(note.created_at, i18n.language)}
      </span>
      <Lock size={14} color="#A8A29E" strokeWidth={1.8} style={{ flexShrink: 0 }} />
    </button>
  );
}
