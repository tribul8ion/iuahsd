import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Loader2 } from "lucide-react";
import { BottomSheet } from "@/shared/ui";
import { useDeleteAccount } from "../model/use-delete-account";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useDeleteAccount();

  const handleDelete = useCallback(() => {
    mutate(undefined, { onSuccess: onClose });
  }, [mutate, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 24px calc(32px + env(safe-area-inset-bottom)) 24px" }}>
        <div className="flex flex-col items-center pt-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(251,94,126,0.14)" }}
          >
            <Trash2 size={26} color="#FB7185" strokeWidth={1.8} />
          </div>
          <div className="h-4" />
          <h2 className="text-[18px] font-bold text-center leading-snug" style={{ color: "var(--color-text)" }}>
            {t("settings.delete_account_confirm")}
          </h2>
          <div className="h-1.5" />
          <p
            className="text-[14px] text-center leading-[1.5]"
            style={{ color: "var(--color-text-hint)", maxWidth: 280 }}
          >
            {t("settings.delete_account_description")}
          </p>
          <div className="h-6" />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[14px] text-[15px] font-semibold cursor-pointer transition-colors duration-150 active:opacity-80"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--color-text)" }}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
            style={{ backgroundColor: "#E11D48" }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
