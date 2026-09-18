import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Entry } from "@/entities/entry";
import { useDeleteEntry } from "@/features/delete-entry";
import { ConfirmDeleteSheet } from "@/shared/ui";

interface DeleteConfirmModalProps {
  medication: Entry;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteConfirmModal({
  medication,
  isOpen,
  onClose,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useDeleteEntry();

  const handleDelete = useCallback(() => {
    mutate(medication.id, { onSuccess: onClose });
  }, [medication.id, mutate, onClose]);

  return (
    <ConfirmDeleteSheet
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      isPending={isPending}
      title={t("medications.confirm_delete", {
        name: medication.corrupted
          ? t("medications.corrupted_entry")
          : medication.name,
      })}
      description={t("medications.delete_description")}
    />
  );
}
