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
          style={{ color: project.corrupted ? "#A8A29E" : "#1C1917" }}
        >
          {project.corrupted ? t("today.corrupted_entry") : project.name}
        </p>
        <span className="text-[12px] flex-shrink-0" style={{ color: "#A8A29E", marginLeft: 8 }}>
          {project.done}/{project.total}
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: "#E7E5E4" }}
      >
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
        />
      </div>
    </button>
  );
}
