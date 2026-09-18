import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "@/entities/project";
import { useDeleteProject } from "@/features/delete-project";
import { ConfirmDeleteSheet } from "@/shared/ui";

interface DeleteProjectConfirmModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteProjectConfirmModal({
  project,
  isOpen,
  onClose,
  onDeleted,
}: DeleteProjectConfirmModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useDeleteProject();

  const handleDelete = useCallback(() => {
    mutate(project.id, { onSuccess: onDeleted });
  }, [project.id, mutate, onDeleted]);

  return (
    <ConfirmDeleteSheet
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      isPending={isPending}
      title={t("project.confirm_delete", {
        name: project.corrupted ? t("today.corrupted_entry") : project.name,
      })}
      description={t("project.delete_description")}
    />
  );
}
