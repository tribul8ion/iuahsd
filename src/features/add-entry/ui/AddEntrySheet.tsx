import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { BottomSheet } from "@/shared/ui";
import { AddMedicationForm } from "./AddMedicationForm";
import { AddHabitForm } from "./AddHabitForm";
import { AddTaskForm } from "./AddTaskForm";
import { AddDocForm } from "./AddDocForm";
import { NoteModal } from "@/features/manage-note";

interface AddEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type EntryChoice = "med" | "habit" | "task" | "doc" | "note" | null;

interface ChoiceRowProps {
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function ChoiceRow({ emoji, title, subtitle, onClick }: ChoiceRowProps) {
  return (
    <button
      onClick={onClick}
      className="glass-item flex items-center w-full rounded-2xl cursor-pointer text-left transition-transform duration-150 active:scale-[0.98]"
      style={{ padding: "12px 14px", gap: 12 }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-[12px]"
        style={{
          width: 38,
          height: 38,
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(30, 41, 59, 0.06)",
          boxShadow: "0 1px 2px rgba(30,41,59,0.05)",
          fontSize: 20,
        }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold" style={{ color: "#1C1917" }}>
          {title}
        </p>
        <p className="text-[12px]" style={{ color: "#A8A29E" }}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}

export function AddEntrySheet({ isOpen, onClose }: AddEntrySheetProps) {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<EntryChoice>(null);

  const handleClose = useCallback(() => {
    setChoice(null);
    onClose();
  }, [onClose]);

  const handleFormClose = useCallback(() => {
    setChoice(null);
    onClose();
  }, [onClose]);

  if (choice === "med") {
    return <AddMedicationForm isOpen={isOpen} onClose={handleFormClose} />;
  }

  if (choice === "habit") {
    return <AddHabitForm isOpen={isOpen} onClose={handleFormClose} />;
  }

  if (choice === "task") {
    return <AddTaskForm isOpen={isOpen} onClose={handleFormClose} />;
  }

  if (choice === "doc") {
    return <AddDocForm isOpen={isOpen} onClose={handleFormClose} />;
  }

  if (choice === "note") {
    return <NoteModal isOpen={isOpen} onClose={handleFormClose} />;
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
            {t("add_sheet.title")}
          </h2>
          <button onClick={handleClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="#A8A29E" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <ChoiceRow
            emoji="💊"
            title={t("add_sheet.med")}
            subtitle={t("add_sheet.med_sub")}
            onClick={() => setChoice("med")}
          />
          <ChoiceRow
            emoji="🔁"
            title={t("add_sheet.habit")}
            subtitle={t("add_sheet.habit_sub")}
            onClick={() => setChoice("habit")}
          />
          <ChoiceRow
            emoji="✅"
            title={t("add_sheet.task")}
            subtitle={t("add_sheet.task_sub")}
            onClick={() => setChoice("task")}
          />
          <ChoiceRow
            emoji="🩺"
            title={t("add_sheet.doc")}
            subtitle={t("add_sheet.doc_sub")}
            onClick={() => setChoice("doc")}
          />
          <ChoiceRow
            emoji="📝"
            title={t("add_sheet.note")}
            subtitle={t("add_sheet.note_sub")}
            onClick={() => setChoice("note")}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
