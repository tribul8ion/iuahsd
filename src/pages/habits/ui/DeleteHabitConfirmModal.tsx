import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Entry } from "@/entities/entry";
import { useDeleteEntry } from "@/features/delete-entry";
import { ConfirmDeleteSheet } from "@/shared/ui";

interface DeleteHabitConfirmModalProps {
  habit: Entry;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteHabitConfirmModal({
  habit,
  isOpen,
  onClose,
}: DeleteHabitConfirmModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useDeleteEntry();

  const handleDelete = useCallback(() => {
    mutate(habit.id, { onSuccess: onClose });
  }, [habit.id, mutate, onClose]);

  return (
    <ConfirmDeleteSheet
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      isPending={isPending}
      title={t("habit.confirm_delete", {
        name: habit.corrupted ? t("today.corrupted_entry") : habit.name,
      })}
      description={t("habit.delete_description")}
    />
  );
}
