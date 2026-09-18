import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";
import { useMarkTaken } from "../model/use-mark-taken";

interface MarkTakenButtonProps {
  markId: number;
  isTaken: boolean;
}

export function MarkTakenButton({ markId, isTaken }: MarkTakenButtonProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useMarkTaken();

  if (isTaken) {
    return (
      <button
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 disabled:opacity-40"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "0 4px 12px -2px rgba(249,255,208,0.18)",
        }}
        disabled={isPending}
        onClick={() => mutate({ markId, status: false })}
        aria-label={t("checklist.undo_taken")}
      >
        {isPending
          ? <Loader2 size={18} className="animate-spin" color="#2C3400" />
          : <Check size={18} color="#2C3400" strokeWidth={2.5} />
        }
      </button>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90"
      style={{
        border: "2px solid rgba(255,255,255,0.14)",
        backgroundColor: "#2C2C2E",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      onClick={() => !isPending && mutate({ markId, status: true })}
      role="button"
      aria-label={t("checklist.mark_taken")}
    >
      {isPending && <Loader2 size={18} className="animate-spin" color="#F9FFD0" />}
    </div>
  );
}
