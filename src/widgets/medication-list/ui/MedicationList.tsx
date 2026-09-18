import { useTranslation } from "react-i18next";
import { Pill, AlertCircle } from "lucide-react";
import { MedicationCard, useEntries } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { Spinner } from "@/shared/ui";

interface MedicationListProps {
  onEdit: (medication: Entry) => void;
  onDelete: (medication: Entry) => void;
  onToggleActive: (medication: Entry, active: boolean) => void;
  onToggleNotifications: (medication: Entry, enabled: boolean) => void;
}

export function MedicationList({
  onEdit,
  onDelete,
  onToggleActive,
  onToggleNotifications,
}: MedicationListProps) {
  const { t } = useTranslation();
  const { data: entries, isLoading, isError } = useEntries();
  const medications = entries?.filter((e) => e.kind === "med");

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center">
          <AlertCircle size={24} className="text-danger" strokeWidth={1.8} />
        </div>
        <p className="text-sm text-text-secondary">{t("common.error")}</p>
      </div>
    );
  }

  if (!medications || medications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: "calc(100vh - 160px - 74px - 68px)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5F5F4" }}>
          <Pill size={28} color="#A8A29E" strokeWidth={1.5} />
        </div>
        <p className="text-[14px]" style={{ color: "#A8A29E" }}>{t("medications.no_medications")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {medications.map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          onEdit={medication.corrupted ? undefined : () => onEdit(medication)}
          onDelete={() => onDelete(medication)}
          onToggleActive={(active) => onToggleActive(medication, active)}
          onToggleNotifications={(enabled) => onToggleNotifications(medication, enabled)}
        />
      ))}
    </div>
  );
}
