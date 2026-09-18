import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X, Pencil, Stethoscope } from "lucide-react";
import { togglePreRemind, PreRemindChips } from "@/entities/entry";
import { BottomSheet, FieldLabel, EditTimeModal } from "@/shared/ui";
import { todayISO } from "@/shared/lib";
import { useAddEntry } from "../model/use-add-entry";

interface AddDocFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_TIME = "09:00";
const DEFAULT_PRE_REMIND: number[] = [180, 1440];

function maxDateISO(): string {
  const now = new Date();
  now.setFullYear(now.getFullYear() + 2);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AddDocForm({ isOpen, onClose }: AddDocFormProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useAddEntry();

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [dateOnce, setDateOnce] = useState(todayISO());
  const [time, setTime] = useState(DEFAULT_TIME);
  const [preRemind, setPreRemind] = useState<number[]>(DEFAULT_PRE_REMIND);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const handleTogglePreRemind = useCallback((minutes: number) => {
    setPreRemind((prev) => togglePreRemind(prev, minutes));
  }, []);

  const handleTimeSave = useCallback((newTime: string) => {
    setTime(newTime);
    setIsTimeModalOpen(false);
  }, []);

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0 && trimmedName.length <= 100;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    mutate(
      {
        kind: "doc",
        values: {
          name: trimmedName,
          notes: notes.trim() || null,
          date_once: dateOnce,
          time,
          pre_remind: preRemind,
        },
      },
      { onSuccess: onClose }
    );
  }, [isValid, trimmedName, notes, dateOnce, time, preRemind, mutate, onClose]);

  return (
    <>
      <BottomSheet isOpen={isOpen && !isTimeModalOpen} onClose={onClose}>
        <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
          <div className="flex items-center justify-between h-12 mb-2">
            <h2 className="text-[18px] font-bold" style={{ color: "var(--color-text)" }}>
              {t("once.add_doc")}
            </h2>
            <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
              <X size={20} color="var(--color-text-hint)" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
                style={{ backgroundColor: "rgba(251,94,126,0.14)" }}
              >
                <Stethoscope size={18} color="#FB7185" strokeWidth={1.8} />
              </div>
              <p className="text-[13px]" style={{ color: "var(--color-text-hint)" }}>
                {t("add_sheet.doc_sub")}
              </p>
            </div>

            <div>
              <FieldLabel>{t("once.doc_name_prompt")}</FieldLabel>
              <div
                className="flex items-center rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "0 14px", height: 48 }}
              >
                <input
                  id="doc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("once.doc_name_placeholder")}
                  maxLength={100}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[rgba(255,255,255,0.28)]"
                  style={{ color: "var(--color-text)" }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <FieldLabel>{t("once.doc_note_prompt")}</FieldLabel>
              <div
                className="flex items-center rounded-xl"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "0 14px", height: 48 }}
              >
                <input
                  id="doc-note"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("once.doc_note_placeholder")}
                  maxLength={200}
                  className="w-full text-[15px] bg-transparent outline-none placeholder:text-[rgba(255,255,255,0.28)]"
                  style={{ color: "var(--color-text)" }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>{t("once.date_prompt")}</FieldLabel>
                <div
                  className="flex items-center rounded-xl"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "0 14px", height: 48 }}
                >
                  <input
                    id="doc-date"
                    type="date"
                    value={dateOnce}
                    min={todayISO()}
                    max={maxDateISO()}
                    onChange={(e) => setDateOnce(e.target.value || todayISO())}
                    className="w-full text-[15px] bg-transparent outline-none cursor-pointer"
                    style={{ color: "var(--color-text)", fontWeight: 600 }}
                    aria-label="doc-date"
                  />
                </div>
              </div>

              <div className="flex-1">
                <FieldLabel>{t("once.time_prompt")}</FieldLabel>
                <button
                  onClick={() => setIsTimeModalOpen(true)}
                  className="flex items-center justify-between rounded-xl w-full cursor-pointer"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "0 14px", height: 48 }}
                  aria-label="edit-doc-time"
                >
                  <span className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                    {time}
                  </span>
                  <Pencil size={14} color="var(--color-text-hint)" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div>
              <FieldLabel marginBottom={4}>{t("once.pre_remind_prompt")}</FieldLabel>
              <p className="text-[12px]" style={{ color: "var(--color-text-hint)", marginBottom: 8 }}>
                {t("once.pre_remind_hint")}
              </p>
              <PreRemindChips selected={preRemind} onToggle={handleTogglePreRemind} />
            </div>

            <button
              disabled={!isValid || isPending}
              onClick={handleSubmit}
              className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-[#2C3400] cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)", boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
            >
              {isPending && <Loader2 size={18} className="animate-spin" />}
              {t("once.add_doc")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {isTimeModalOpen && (
        <EditTimeModal
          isOpen={isTimeModalOpen}
          onClose={() => setIsTimeModalOpen(false)}
          scheduleLabel={t("once.time_prompt")}
          defaultTime={DEFAULT_TIME}
          currentTime={time}
          onSave={handleTimeSave}
        />
      )}
    </>
  );
}
