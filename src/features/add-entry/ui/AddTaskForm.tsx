import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X, Pencil, ListTodo, FolderOpen } from "lucide-react";
import { togglePreRemind, PreRemindChips } from "@/entities/entry";
import { useProjects } from "@/entities/project";
import { BottomSheet, FieldLabel, EditTimeModal } from "@/shared/ui";
import { todayISO } from "@/shared/lib";
import { ProjectPickerModal } from "./ProjectPickerModal";
import { useAddEntry } from "../model/use-add-entry";

interface AddTaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialProjectId?: number | null;
}

const DEFAULT_TIME = "09:00";
const DEFAULT_PRE_REMIND: number[] = [];

function maxDateISO(): string {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 2);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AddTaskForm({ isOpen, onClose, initialProjectId = null }: AddTaskFormProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useAddEntry();
  const { data: projects } = useProjects();

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [dateOnce, setDateOnce] = useState(todayISO());
  const [time, setTime] = useState(DEFAULT_TIME);
  const [preRemind, setPreRemind] = useState<number[]>(DEFAULT_PRE_REMIND);
  const [projectId, setProjectId] = useState<number | null>(initialProjectId);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);

  const selectedProjectName =
    projectId !== null ? projects?.find((p) => p.id === projectId)?.name ?? null : null;

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
        kind: "task",
        values: {
          name: trimmedName,
          notes: notes.trim() || null,
          date_once: dateOnce,
          time,
          pre_remind: preRemind,
          project_id: projectId,
        },
      },
      { onSuccess: onClose }
    );
  }, [isValid, trimmedName, notes, dateOnce, time, preRemind, projectId, mutate, onClose]);

  return (
    <>
      <BottomSheet isOpen={isOpen && !isTimeModalOpen && !isProjectPickerOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
              {t("once.add_task")}
            </h2>
            <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
              <X size={20} color="#A8A29E" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
                style={{ backgroundColor: "#F1EDFD" }}
              >
                <ListTodo size={18} color="#7C3AED" strokeWidth={1.8} />
              </div>
              <p className="text-[13px]" style={{ color: "#A8A29E" }}>
                {t("add_sheet.task_sub")}
              </p>
            </div>

            <div>
              <FieldLabel>{t("once.task_name_prompt")}</FieldLabel>
              <div
                className="flex items-center rounded-xl"
                style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
              >
                <input
                  id="task-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("once.task_name_placeholder")}
                  maxLength={100}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
                  style={{ color: "#1C1917" }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("once.task_note_prompt")}</FieldLabel>
              <div
                className="flex items-center rounded-xl"
                style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
              >
                <input
                  id="task-note"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("once.task_note_placeholder")}
                  maxLength={200}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
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
                    id="task-date"
                    type="date"
                    value={dateOnce}
                    min={todayISO()}
                    max={maxDateISO()}
                    onChange={(e) => setDateOnce(e.target.value || todayISO())}
                    className="w-full text-[15px] bg-transparent outline-none cursor-pointer"
                    style={{ color: "#1C1917", fontWeight: 600 }}
                    aria-label="task-date"
                  />
                </div>
              </div>

              <div className="flex-1">
                <FieldLabel>{t("once.time_prompt")}</FieldLabel>
                <button
                  onClick={() => setIsTimeModalOpen(true)}
                  className="flex items-center justify-between rounded-xl w-full cursor-pointer"
                  style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
                  aria-label="edit-task-time"
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

            <div>
              <FieldLabel>{t("project.field_prompt")}</FieldLabel>
              <button
                onClick={() => setIsProjectPickerOpen(true)}
                className="flex items-center justify-between rounded-xl w-full cursor-pointer"
                style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
                aria-label="pick-project"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={16} color="#A8A29E" strokeWidth={1.8} />
                  <span
                    className="text-[15px] truncate"
                    style={{ color: selectedProjectName ? "#1C1917" : "#A8A29E" }}
                  >
                    {selectedProjectName ?? t("project.no_project")}
                  </span>
                </span>
                <Pencil size={14} color="#A8A29E" strokeWidth={1.8} />
              </button>
            </div>

            <button
              disabled={!isValid || isPending}
              onClick={handleSubmit}
              className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
            >
              {isPending && <Loader2 size={18} className="animate-spin" />}
              {t("once.add_task")}
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

      {isProjectPickerOpen && (
        <ProjectPickerModal
          isOpen={isProjectPickerOpen}
          onClose={() => setIsProjectPickerOpen(false)}
          selectedId={projectId}
          onSelect={setProjectId}
        />
      )}
    </>
  );
}
