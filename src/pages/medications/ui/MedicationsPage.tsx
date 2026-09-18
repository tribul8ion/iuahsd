import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useEntries } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { MedicationList } from "@/widgets/medication-list";
import { AddMedicationForm } from "@/features/add-entry";
import {
  EditMedicationModal,
  useToggleEntryActive,
  useToggleEntryNotifications,
} from "@/features/edit-entry";
import { PageHeader } from "@/shared/ui";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function MedicationsPage() {
  const { t } = useTranslation();
  const { data: entries } = useEntries();
  const medications = useMemo(
    () => entries?.filter((e) => e.kind === "med"),
    [entries]
  );

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  const toggleActive = useToggleEntryActive();
  const toggleNotifications = useToggleEntryNotifications();

  const activeCount = medications?.filter((m) => m.active).length ?? 0;

  const handleEdit = useCallback((medication: Entry) => {
    setEditTarget(medication);
  }, []);

  const handleDelete = useCallback((medication: Entry) => {
    setDeleteTarget(medication);
  }, []);

  const handleToggleActive = useCallback(
    (medication: Entry, active: boolean) => {
      toggleActive.mutate({ id: medication.id, active });
    },
    [toggleActive]
  );

  const handleToggleNotifications = useCallback(
    (medication: Entry, enabled: boolean) => {
      toggleNotifications.mutate({
        id: medication.id,
        notifications_enabled: enabled,
      });
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
    <div className="flex flex-col min-h-full" style={{ paddingBottom: "calc(74px + 68px + env(safe-area-inset-bottom))" }}>
      <PageHeader
        title={t("medications.my_medications")}
        subtitle={t("medications.active_count", { count: activeCount })}
        height={160}
      />

      <div className="flex-1" style={{ padding: "16px 16px 0 16px" }}>
        <MedicationList
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onToggleNotifications={handleToggleNotifications}
        />
      </div>

      <div
        className="fixed left-0 right-0 z-40"
        style={{ bottom: "calc(74px + env(safe-area-inset-bottom))", padding: "0 16px 12px 16px" }}
      >
        <button
          onClick={() => setAddOpen(true)}
          className="w-full h-[52px] rounded-2xl text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            backgroundColor: "#059669",
            boxShadow: "0 4px 16px rgba(5,150,105,0.2)",
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          {t("medications.add_medication")}
        </button>
      </div>

      <AddMedicationForm
        key={addOpen ? "open" : "closed"}
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
      />

      {editTarget && (
        <EditMedicationModal
          key={editTarget.id}
          medication={editTarget}
          isOpen={!!editTarget}
          onClose={handleEditClose}
          onDelete={handleDeleteFromEdit}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          medication={deleteTarget}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
