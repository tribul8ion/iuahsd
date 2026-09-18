import { useTranslation } from "react-i18next";
import { AlertCircle, CalendarX } from "lucide-react";
import {
  MarkCard,
  resolveEntryName,
  useMarksByDate,
  formatMarkSchedule,
} from "@/entities/mark";
import type { MarkItem } from "@/entities/mark";
import { useEntries } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { MarkTakenButton } from "@/features/mark-taken";
import { Spinner } from "@/shared/ui";
import { todayISO } from "../model/grid";
import { formatPreRemindSummary } from "../model/pre-remind-summary";

interface AgendaListProps {
  date: string;
  onEditOnce: (entry: Entry) => void;
}

function FutureMarkCircle() {
  return (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
      style={{ border: "2px solid #D6D3D1", opacity: 0.4 }}
      aria-label="future-mark"
    />
  );
}

export function AgendaList({ date, onEditOnce }: AgendaListProps) {
  const { t } = useTranslation();
  const { data: marks, isLoading, isError } = useMarksByDate(date);
  const { data: entries } = useEntries();
  const dayShort = t("habit.days_short", { returnObjects: true }) as string[];

  const today = todayISO();
  const isFuture = date > today;
  const isPast = date < today;

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle size={28} color="#E11D48" strokeWidth={1.5} />
        <p className="text-[13px]" style={{ color: "var(--color-text-hint)" }}>
          {t("common.error")}
        </p>
      </div>
    );
  }

  const items = marks?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CalendarX size={28} color="var(--color-text-hint)" strokeWidth={1.5} />
        <p className="text-[13px]" style={{ color: "var(--color-text-hint)" }}>
          {t("calendar.empty_day")}
        </p>
      </div>
    );
  }

  const taken = marks?.taken ?? 0;
  const total = marks?.total ?? items.length;
  const sorted = [...items].sort((a, b) => a.entry_time.localeCompare(b.entry_time));

  function buildSubLabel(mark: MarkItem, entry: Entry | undefined): string {
    const schedule = formatMarkSchedule(mark, entry, { t, dayShort });
    return schedule ? `${mark.entry_time} · ${schedule}` : mark.entry_time;
  }

  function handleRowClick(mark: MarkItem, entry: Entry | undefined) {
    if (!entry || entry.corrupted) return;
    if (mark.entry_kind === "task" || mark.entry_kind === "doc") {
      onEditOnce(entry);
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <div className="flex items-center justify-between" style={{ padding: "0 2px" }}>
        <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-hint)" }}>
          {t("calendar.agenda_progress", { taken, total })}
        </p>
      </div>

      {sorted.map((mark) => {
        const entry = entries?.find((e) => e.id === mark.entry_id);
        const isClickable =
          !!entry && !entry.corrupted && (mark.entry_kind === "task" || mark.entry_kind === "doc");
        const preRemindSummary =
          mark.entry_kind === "doc" ? formatPreRemindSummary(entry?.pre_remind, t) : null;

        return (
          <div key={mark.id} className="flex flex-col" style={{ gap: 4 }}>
            <div
              onClick={() => handleRowClick(mark, entry)}
              style={{ cursor: isClickable ? "pointer" : "default" }}
            >
              <MarkCard
                mark={mark}
                entryName={resolveEntryName(mark.entry_id, entries)}
                subLabel={buildSubLabel(mark, entry)}
                after={
                  isFuture ? (
                    <FutureMarkCircle />
                  ) : (
                    <MarkTakenButton markId={mark.id} isTaken={mark.status} />
                  )
                }
              />
            </div>
            {preRemindSummary && (
              <p
                className="text-[11px]"
                style={{ color: "var(--color-text-hint)", padding: "0 16px 0 57px" }}
              >
                {preRemindSummary}
              </p>
            )}
          </div>
        );
      })}

      {isPast && (
        <p className="text-[11px] text-center" style={{ color: "var(--color-text-hint)", marginTop: 4 }}>
          {t("calendar.retro_hint")}
        </p>
      )}
    </div>
  );
}
