import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useEntries } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { HabitList } from "@/widgets/habit-list";
import {
  EditHabitModal,
  useToggleEntryActive,
  useToggleEntryNotifications,
} from "@/features/edit-entry";
import { PageHeader } from "@/shared/ui";
import { DeleteHabitConfirmModal } from "./DeleteHabitConfirmModal";

export function HabitsPage() {
  const { t } = useTranslation();
  const { data: entries } = useEntries();
  const habits = useMemo(() => entries?.filter((e) => e.kind === "habit"), [entries]);

  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  const toggleActive = useToggleEntryActive();
  const toggleNotifications = useToggleEntryNotifications();

  const activeCount = habits?.filter((h) => h.active).length ?? 0;

  const handleEdit = useCallback((habit: Entry) => {
    setEditTarget(habit);
  }, []);

  const handleToggleActive = useCallback(
    (habit: Entry, active: boolean) => {
      toggleActive.mutate({ id: habit.id, active });
    },
    [toggleActive]
  );

  const handleToggleNotifications = useCallback(
    (habit: Entry, enabled: boolean) => {
      toggleNotifications.mutate({ id: habit.id, notifications_enabled: enabled });
    },
    [toggleNotifications]
  );

  const handleEditClose = useCallback(() => {
    setEditTarget(null);
  }, []);

  const handleDeleteFromEdit = useCallback(() => {
    if (editTarget) {
      setDeleteTarget(editTarget);
      setEditTarget(null);
    }
  }, [editTarget]);

  return (
    <div className="flex flex-col min-h-full" style={{ paddingBottom: "calc(96px + 16px + env(safe-area-inset-bottom))" }}>
      <PageHeader
        title={t("habits.title")}
        subtitle={t("habits.active_count", { count: activeCount })}
        height={160}
      />

      <div className="flex-1" style={{ padding: "16px 16px 0 16px" }}>
        <HabitList
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onToggleNotifications={handleToggleNotifications}
        />
      </div>

      {editTarget && (
        <EditHabitModal
          key={editTarget.id}
          habit={editTarget}
          isOpen={!!editTarget}
          onClose={handleEditClose}
          onDelete={handleDeleteFromEdit}
        />
      )}

      {deleteTarget && (
        <DeleteHabitConfirmModal
          habit={deleteTarget}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
