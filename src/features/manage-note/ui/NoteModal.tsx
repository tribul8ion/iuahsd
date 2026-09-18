import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, Loader2, Lock, StickyNote, Trash2, X } from "lucide-react";
import type { Entry } from "@/entities/entry";
import { useAddEntry } from "@/features/add-entry";
import { useEditEntry } from "@/features/edit-entry";
import { useDeleteEntry } from "@/features/delete-entry";
import { BottomSheet, FieldLabel } from "@/shared/ui";

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Entry;
}

const TITLE_MAX_LENGTH = 100;
export const NOTE_BYTES_HARD_LIMIT = 2800;
export const NOTE_BYTES_WARN_LIMIT = 2400;

const textEncoder = new TextEncoder();

function byteLength(value: string): number {
  return textEncoder.encode(value).length;
}

function autoGrow(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function NoteModal({ isOpen, onClose, note }: NoteModalProps) {
  const { t } = useTranslation();
  const { mutate: addEntry, isPending: isAdding } = useAddEntry();
  const { mutate: editEntry, isPending: isEditing } = useEditEntry();
  const { mutate: deleteEntry, isPending: isDeleting } = useDeleteEntry();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [name, setName] = useState(note?.name ?? "");
  const [text, setText] = useState(note?.notes ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditMode = note !== undefined;
  const isPending = isAdding || isEditing;
  const trimmedName = name.trim();
  const usedBytes = byteLength(name) + byteLength(text);
  const remainingChars = Math.max(0, Math.floor((NOTE_BYTES_HARD_LIMIT - usedBytes) / 2));
  const isValid =
    trimmedName.length > 0 &&
    trimmedName.length <= TITLE_MAX_LENGTH &&
    usedBytes <= NOTE_BYTES_HARD_LIMIT;
  const isWarnLength = usedBytes >= NOTE_BYTES_WARN_LIMIT;

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setSubmitError(null);
  }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    autoGrow(e.target);
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    setSubmitError(null);
    const values = { name: trimmedName, notes: text.trim() || null };
    const onError = (error: Error) => {
      if (error.message === "payload_too_large") {
        setSubmitError("payload_too_large");
      }
    };
    if (isEditMode) {
      editEntry({ id: note.id, kind: "note", values }, { onSuccess: onClose, onError });
    } else {
      addEntry({ kind: "note", values }, { onSuccess: onClose, onError });
    }
  }, [isValid, trimmedName, text, isEditMode, note, editEntry, addEntry, onClose]);

  const handleDelete = useCallback(() => {
    if (!note) return;
    deleteEntry(note.id, { onSuccess: onClose });
  }, [note, deleteEntry, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
            {isEditMode ? t("note.edit_title") : t("note.add_title")}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="#A8A29E" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: "#FEF9C3" }}
            >
              <StickyNote size={18} color="#CA8A04" strokeWidth={1.8} />
            </div>
            <p className="text-[13px] flex items-center gap-1" style={{ color: "#A8A29E" }}>
              <Lock size={12} strokeWidth={2} />
              {t("note.encrypted_hint")}
            </p>
          </div>

          <div>
            <FieldLabel>{t("note.title_prompt")}</FieldLabel>
            <div
              className="flex items-center rounded-xl"
              style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
            >
              <input
                id="note-title"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder={t("note.title_placeholder")}
                maxLength={TITLE_MAX_LENGTH}
                className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
                style={{ color: "#1C1917" }}
                autoFocus
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <FieldLabel marginBottom={0}>{t("note.text_prompt")}</FieldLabel>
              <span
                className="text-[11px] font-medium"
                style={{ color: isWarnLength ? "#EA580C" : "#A8A29E" }}
              >
                {t("note.chars_remaining", { count: remainingChars })}
              </span>
            </div>
            <textarea
              id="note-text"
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder={t("note.text_placeholder")}
              rows={4}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1] resize-none"
              style={{
                backgroundColor: "#F5F5F4",
                padding: "12px 14px",
                borderRadius: 12,
                color: "#1C1917",
                minHeight: 96,
                maxHeight: 320,
                overflowY: "auto",
              }}
            />
            {isWarnLength && (
              <p className="text-[12px]" style={{ color: "#EA580C", marginTop: 6 }}>
                {t("note.length_warning")}
              </p>
            )}
            {submitError === "payload_too_large" && (
              <p
                className="text-[12px] flex items-center gap-1"
                style={{ color: "#E11D48", marginTop: 6 }}
                role="alert"
              >
                <AlertCircle size={13} strokeWidth={2} />
                {t("note.too_long")}
              </p>
            )}
          </div>

          <button
            disabled={!isValid || isPending}
            onClick={handleSubmit}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "#059669" }}
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} strokeWidth={2.5} />
            )}
            {isEditMode ? t("note.save_changes") : t("note.add_title")}
          </button>

          {isEditMode && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-full h-10 text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
              style={{ color: "#E11D48" }}
            >
              <Trash2 size={15} color="#E11D48" strokeWidth={1.8} />
              {t("note.delete_note")}
            </button>
          )}

          {isEditMode && confirmingDelete && (
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 h-11 rounded-[14px] text-[14px] font-semibold cursor-pointer"
                style={{ backgroundColor: "#F5F5F4", color: "#1C1917" }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-11 rounded-[14px] text-[14px] font-semibold text-white cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                style={{ backgroundColor: "#E11D48" }}
              >
                {isDeleting && <Loader2 size={15} className="animate-spin" />}
                {t("common.confirm")}
              </button>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
