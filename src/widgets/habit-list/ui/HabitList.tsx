import { useTranslation } from "react-i18next";
import { Target, AlertCircle } from "lucide-react";
import { HabitCard, useEntries } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { Spinner, EmptyState } from "@/shared/ui";

interface HabitListProps {
  onEdit: (habit: Entry) => void;
  onToggleActive: (habit: Entry, active: boolean) => void;
  onToggleNotifications: (habit: Entry, enabled: boolean) => void;
}

export function HabitList({ onEdit, onToggleActive, onToggleNotifications }: HabitListProps) {
  const { t } = useTranslation();
  const { data: entries, isLoading, isError } = useEntries();
  const habits = entries?.filter((e) => e.kind === "habit");

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

  if (!habits || habits.length === 0) {
    return (
      <EmptyState
        icon={<Target size={28} color="#A8A29E" strokeWidth={1.5} />}
        title={t("habits.empty_title")}
        subtitle={t("habits.empty_subtitle")}
        minHeight="calc(100vh - 160px - 74px - 32px)"
        size="md"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onClick={habit.corrupted ? undefined : () => onEdit(habit)}
          onToggleActive={(active) => onToggleActive(habit, active)}
          onToggleNotifications={(enabled) => onToggleNotifications(habit, enabled)}
        />
      ))}
    </div>
  );
}
