import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMarksRange } from "@/entities/mark";
import type { Entry } from "@/entities/entry";
import { EditOnceEntryModal } from "@/features/edit-entry";
import { PageHeader, Spinner } from "@/shared/ui";
import { MonthCard } from "./MonthCard";
import { AgendaList } from "./AgendaList";
import { DeleteOnceConfirmModal } from "./DeleteOnceConfirmModal";
import {
  buildMonthGrid,
  CALENDAR_MONTH_RANGE,
  clampMonthShift,
  monthPrefix,
  monthsBetween,
  todayISO,
} from "../model/grid";

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function CalendarPage() {
  const { t, i18n } = useTranslation();

  const referenceYearMonth = useMemo(() => currentYearMonth(), []);
  const [{ year, month }, setYearMonth] = useState(currentYearMonth);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [editTarget, setEditTarget] = useState<Entry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const dateFrom = grid[0].iso;
  const dateTo = grid[grid.length - 1].iso;

  const { data: rangeData, isLoading } = useMarksRange(dateFrom, dateTo);
  const items = useMemo(() => rangeData?.items ?? [], [rangeData]);

  const monthCount = useMemo(() => {
    const prefix = monthPrefix(year, month);
    return items.filter((item) => item.date.startsWith(prefix)).length;
  }, [items, year, month]);

  const monthLabel = useMemo(() => {
    const locale = i18n.language === "ru" ? "ru-RU" : "en-US";
    return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long" });
  }, [year, month, i18n.language]);

  const monthOffset = useMemo(
    () => monthsBetween(referenceYearMonth, { year, month }),
    [referenceYearMonth, year, month]
  );
  const canGoPrev = monthOffset > -CALENDAR_MONTH_RANGE;
  const canGoNext = monthOffset < CALENDAR_MONTH_RANGE;

  const handlePrevMonth = useCallback(() => {
    setYearMonth((prev) => clampMonthShift(prev, -1, referenceYearMonth));
  }, [referenceYearMonth]);

  const handleNextMonth = useCallback(() => {
    setYearMonth((prev) => clampMonthShift(prev, 1, referenceYearMonth));
  }, [referenceYearMonth]);

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
    <div className="min-h-full" style={{ paddingBottom: "calc(74px + 16px + env(safe-area-inset-bottom))" }}>
      <PageHeader
        title={t("calendar.title")}
        subtitle={t("calendar.marks_in_month", { count: monthCount, month: monthLabel })}
        height={140}
      />

      <div className="flex flex-col" style={{ padding: "16px 16px 0 16px", gap: 12 }}>
        {isLoading ? (
          <Spinner />
        ) : (
          <MonthCard
            year={year}
            month={month}
            items={items}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
          />
        )}

        <AgendaList date={selectedDate} onEditOnce={setEditTarget} />
      </div>

      {editTarget && (
        <EditOnceEntryModal
          key={editTarget.id}
          entry={editTarget}
          isOpen={!!editTarget}
          onClose={handleEditClose}
          onDelete={handleDeleteFromEdit}
        />
      )}

      {deleteTarget && (
        <DeleteOnceConfirmModal
          entry={deleteTarget}
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
