import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEntries } from "@/entities/entry";
import type { Project } from "@/entities/project";
import { AddTaskForm } from "@/features/add-entry";
import { BottomSheet } from "@/shared/ui";
import { RenameProjectModal } from "./RenameProjectModal";
import { DeleteProjectConfirmModal } from "./DeleteProjectConfirmModal";

interface ProjectSheetProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSheet({ project, isOpen, onClose }: ProjectSheetProps) {
  const { t } = useTranslation();
  const { data: entries } = useEntries();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const tasks = useMemo(
    () =>
      entries?.filter((e) => e.kind === "task" && e.project_id === project.id) ?? [],
    [entries, project.id]
  );

  const isModalStackOpen = isAddTaskOpen || isRenameOpen || isDeleteOpen;

  return (
    <>
      <BottomSheet isOpen={isOpen && !isModalStackOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2
              className="text-[18px] font-bold truncate"
              style={{ color: project.corrupted ? "#A8A29E" : "#1C1917" }}
            >
              {project.corrupted ? t("today.corrupted_entry") : project.name}
            </h2>
            <button onClick={onClose} className="cursor-pointer p-1 flex-shrink-0" aria-label="close">
              <X size={20} color="#A8A29E" strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <button
              onClick={() => setIsRenameOpen(true)}
              className="flex items-center gap-1.5 rounded-full cursor-pointer"
              style={{ padding: "6px 12px", backgroundColor: "#F5F5F4" }}
            >
              <Pencil size={13} color="#57534E" strokeWidth={1.8} />
              <span className="text-[12px] font-medium" style={{ color: "#57534E" }}>
                {t("project.rename_title")}
              </span>
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-1.5 rounded-full cursor-pointer"
              style={{ padding: "6px 12px", backgroundColor: "#FFF1F2" }}
            >
              <Trash2 size={13} color="#E11D48" strokeWidth={1.8} />
              <span className="text-[12px] font-medium" style={{ color: "#E11D48" }}>
                {t("project.delete_project")}
              </span>
            </button>
          </div>

          <div className="flex flex-col" style={{ gap: 8, maxHeight: "48vh", overflowY: "auto" }}>
            {tasks.length === 0 && (
              <p
                className="text-[13px] text-center"
                style={{ color: "#A8A29E", padding: "24px 0" }}
              >
                {t("project.empty_tasks")}
              </p>
            )}
            {tasks.map((task) => {
              const StatusIcon = task.done ? CheckCircle2 : Circle;
              return (
                <div
                  key={task.id}
                  className="flex items-center rounded-xl"
                  style={{ gap: 10, padding: "10px 12px", backgroundColor: "#F5F5F4" }}
                >
                  <StatusIcon
                    size={18}
                    color={task.done ? "#059669" : "#D6D3D1"}
                    strokeWidth={1.8}
                    style={{ flexShrink: 0 }}
                  />
                  <span
                    className="text-[14px] truncate"
                    style={{
                      color: task.corrupted ? "#A8A29E" : "#1C1917",
                      textDecoration: task.done ? "line-through" : "none",
                    }}
                  >
                    {task.corrupted ? t("today.corrupted_entry") : task.name}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-primary)", marginTop: 16, boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
          >
            <Plus size={18} strokeWidth={2.5} />
            {t("project.add_task")}
          </button>
        </div>
      </BottomSheet>

      {isAddTaskOpen && (
        <AddTaskForm
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          initialProjectId={project.id}
        />
      )}

      {isRenameOpen && (
        <RenameProjectModal
          project={project}
          isOpen={isRenameOpen}
          onClose={() => setIsRenameOpen(false)}
        />
      )}

      {isDeleteOpen && (
        <DeleteProjectConfirmModal
          project={project}
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onDeleted={onClose}
        />
      )}
    </>
  );
}
