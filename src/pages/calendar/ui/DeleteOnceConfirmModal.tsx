import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Entry } from "@/entities/entry";
import { useDeleteEntry } from "@/features/delete-entry";
import { ConfirmDeleteSheet } from "@/shared/ui";

interface DeleteOnceConfirmModalProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteOnceConfirmModal({ entry, isOpen, onClose }: DeleteOnceConfirmModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useDeleteEntry();

  const handleDelete = useCallback(() => {
    mutate(entry.id, { onSuccess: onClose });
  }, [entry.id, mutate, onClose]);

  return (
    <ConfirmDeleteSheet
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      isPending={isPending}
      title={t("once.confirm_delete", {
        name: entry.corrupted ? t("today.corrupted_entry") : entry.name,
      })}
      description={t("once.delete_description")}
    />
  );
}
