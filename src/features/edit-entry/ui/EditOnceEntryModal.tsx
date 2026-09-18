import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, X, Trash2, Pencil, ListTodo, Stethoscope } from "lucide-react";
import type { Entry } from "@/entities/entry";
import { togglePreRemind, PreRemindChips } from "@/entities/entry";
import { BottomSheet, FieldLabel, EditTimeModal } from "@/shared/ui";
import { todayISO } from "@/shared/lib";
import { useEditEntry } from "../model/use-edit-entry";

interface EditOnceEntryModalProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DEFAULT_TIME = "09:00";

function maxDateISO(): string {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 2);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function EditOnceEntryModal({
  entry,
  isOpen,
  onClose,
  onDelete,
}: EditOnceEntryModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useEditEntry();

  const isDoc = entry.kind === "doc";

  const [name, setName] = useState(entry.name);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [dateOnce, setDateOnce] = useState(entry.date_once ?? todayISO());
  const [time, setTime] = useState(entry.time);
  const [preRemind, setPreRemind] = useState<number[]>(entry.pre_remind ?? []);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const handleTogglePreRemind = useCallback((minutes: number) => {
    setPreRemind((prev) => togglePreRemind(prev, minutes));
  }, []);

  const handleTimeSave = useCallback((newTime: string) => {
    setTime(newTime);
    setIsTimeModalOpen(false);
  }, []);

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0 && trimmedName.length <= 100;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    mutate(
      {
        id: entry.id,
        kind: entry.kind as "task" | "doc",
        values: {
          name: trimmedName,
          notes: notes.trim() || null,
          date_once: dateOnce,
          time,
          pre_remind: preRemind,
        },
      },
      { onSuccess: onClose }
    );
  }, [isValid, entry.id, entry.kind, trimmedName, notes, dateOnce, time, preRemind, mutate, onClose]);

  const titleKey = isDoc ? "once.edit_doc" : "once.edit_task";
  const namePromptKey = isDoc ? "once.doc_name_prompt" : "once.task_name_prompt";
  const notePromptKey = isDoc ? "once.doc_note_prompt" : "once.task_note_prompt";
  const deleteKey = isDoc ? "once.delete_doc" : "once.delete_task";
  const Icon = isDoc ? Stethoscope : ListTodo;
  const iconColor = isDoc ? "#E11D48" : "#7C3AED";
  const iconBg = isDoc ? "#FFF1F2" : "#F1EDFD";

  return (
    <>
      <BottomSheet isOpen={isOpen && !isTimeModalOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
              {t(titleKey)}
            </h2>
            <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
              <X size={20} color="#A8A29E" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
                style={{ backgroundColor: iconBg }}
              >
                <Icon size={18} color={iconColor} strokeWidth={1.8} />
              </div>
            </div>

            <div>
              <FieldLabel>{t(namePromptKey)}</FieldLabel>
              <div
                className="flex items-center rounded-xl"
                style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
              >
                <input
                  id="edit-once-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full text-[15px] bg-transparent outline-none"
                  style={{ color: "#1C1917" }}
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t(notePromptKey)}</FieldLabel>
              <div
                className="flex items-center rounded-xl"
                style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
              >
                <input
                  id="edit-once-note"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  className="w-full text-[15px] bg-transparent outline-none"
                  style={{ color: "#1C1917" }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>{t("once.date_prompt")}</FieldLabel>
                <div
                  className="flex items-center rounded-xl"
                  style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
                >
                  <input
                    id="edit-once-date"
                    type="date"
                    value={dateOnce}
                    min={todayISO()}
                    max={maxDateISO()}
                    onChange={(e) => setDateOnce(e.target.value || todayISO())}
                    className="w-full text-[15px] bg-transparent outline-none cursor-pointer"
                    style={{ color: "#1C1917", fontWeight: 600 }}
                    aria-label="edit-once-date"
                  />
                </div>
              </div>

              <div className="flex-1">
                <FieldLabel>{t("once.time_prompt")}</FieldLabel>
                <button
                  onClick={() => setIsTimeModalOpen(true)}
                  className="flex items-center justify-between rounded-xl w-full cursor-pointer"
                  style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
                  aria-label="edit-once-time"
                >
                  <span className="text-[15px] font-semibold" style={{ color: "#1C1917" }}>
                    {time}
                  </span>
                  <Pencil size={14} color="#A8A29E" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div>
              <FieldLabel marginBottom={4}>{t("once.pre_remind_prompt")}</FieldLabel>
              <p className="text-[12px]" style={{ color: "#A8A29E", marginBottom: 8 }}>
                {t("once.pre_remind_hint")}
              </p>
              <PreRemindChips selected={preRemind} onToggle={handleTogglePreRemind} />
            </div>

            <button
              disabled={!isValid || isPending}
              onClick={handleSubmit}
              className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Check size={18} strokeWidth={2.5} />
              )}
              {t("once.save_changes")}
            </button>

            <button
              onClick={onDelete}
              className="w-full h-10 text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
              style={{ color: "#E11D48" }}
            >
              <Trash2 size={15} color="#E11D48" strokeWidth={1.8} />
              {t(deleteKey)}
            </button>
          </div>
        </div>
      </BottomSheet>

      {isTimeModalOpen && (
        <EditTimeModal
          isOpen={isTimeModalOpen}
          onClose={() => setIsTimeModalOpen(false)}
          scheduleLabel={t("once.time_prompt")}
          defaultTime={DEFAULT_TIME}
          currentTime={time}
          onSave={handleTimeSave}
        />
      )}
    </>
  );
}
