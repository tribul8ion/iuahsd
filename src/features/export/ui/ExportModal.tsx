import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2, TriangleAlert } from "lucide-react";
import { BottomSheet } from "@/shared/ui";
import { useExportData } from "../model/use-export";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending, isError } = useExportData();

  const handleExport = useCallback(() => {
    mutate(undefined, { onSuccess: onClose });
  }, [mutate, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 24px calc(32px + env(safe-area-inset-bottom)) 24px" }}>
        <div className="flex flex-col items-center pt-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(249,255,208,0.12)" }}
          >
            <Download size={26} color="#F9FFD0" strokeWidth={1.8} />
          </div>
          <div className="h-4" />
          <h2 className="text-[18px] font-bold text-center leading-snug" style={{ color: "var(--color-text)" }}>
            {t("export.title")}
          </h2>
          <div className="h-1.5" />
          <p
            className="text-[14px] text-center leading-[1.5]"
            style={{ color: "var(--color-text-hint)", maxWidth: 280 }}
          >
            {t("export.description")}
          </p>
          <div className="h-3" />
          <div
            className="flex items-start w-full rounded-xl"
            style={{ backgroundColor: "rgba(251,191,36,0.1)", padding: 12, gap: 8 }}
          >
            <TriangleAlert size={16} color="#FBBF24" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <span className="text-[12.5px]" style={{ color: "#92400E", lineHeight: 1.45 }}>
              {t("export.warning")}
            </span>
          </div>
          {isError && (
            <>
              <div className="h-2" />
              <span className="text-[13px] font-medium" style={{ color: "#E11D48" }} role="alert">
                {t("export.error")}
              </span>
            </>
          )}
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
            onClick={handleExport}
            disabled={isPending}
            className="flex-1 h-12 rounded-[14px] text-[15px] font-semibold text-[#2C3400] cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-1.5"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {t("export.download")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
