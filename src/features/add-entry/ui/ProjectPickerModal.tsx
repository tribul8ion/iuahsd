import { useTranslation } from "react-i18next";
import { Check, FolderX, X } from "lucide-react";
import { useProjects } from "@/entities/project";
import { BottomSheet } from "@/shared/ui";

interface ProjectPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (projectId: number | null) => void;
}

export function ProjectPickerModal({
  isOpen,
  onClose,
  selectedId,
  onSelect,
}: ProjectPickerModalProps) {
  const { t } = useTranslation();
  const { data: projects } = useProjects();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
            {t("project.picker_title")}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="flex items-center w-full rounded-xl cursor-pointer text-left"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "12px 14px", gap: 12 }}
          >
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-[10px]"
              style={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10 }}
            >
              <FolderX size={16} color="var(--color-text-hint)" strokeWidth={1.8} />
            </div>
            <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--color-text)" }}>
              {t("project.no_project")}
            </span>
            {selectedId === null && <Check size={18} color="#F9FFD0" strokeWidth={2.5} />}
          </button>

          {projects
            ?.filter((p) => !p.corrupted)
            .map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onSelect(project.id);
                  onClose();
                }}
                className="flex items-center w-full rounded-xl cursor-pointer text-left"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "12px 14px", gap: 12 }}
              >
                <span
                  className="flex-1 text-[14px] font-medium truncate"
                  style={{ color: "var(--color-text)" }}
                >
                  {project.name}
                </span>
                {selectedId === project.id && (
                  <Check size={18} color="#F9FFD0" strokeWidth={2.5} />
                )}
              </button>
            ))}
        </div>
      </div>
    </BottomSheet>
  );
}
