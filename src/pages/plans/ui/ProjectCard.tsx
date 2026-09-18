import { useTranslation } from "react-i18next";
import type { Project } from "@/entities/project";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { t } = useTranslation();
  const pct =
    project.total > 0 ? Math.round((project.done / project.total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass rounded-[24px] cursor-pointer"
      style={{ padding: "14px 16px" }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <p
          className="text-[15px] font-semibold truncate"
          style={{ color: project.corrupted ? "var(--color-text-hint)" : "var(--color-text)" }}
        >
          {project.corrupted ? t("today.corrupted_entry") : project.name}
        </p>
        <span className="text-[12px] flex-shrink-0" style={{ color: "var(--color-text-hint)", marginLeft: 8 }}>
          {project.done}/{project.total}
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: "rgba(255,255,255,0.1)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
        />
      </div>
    </button>
  );
}
