import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, X, FolderPlus } from "lucide-react";
import { useAddProject } from "@/features/add-project";
import { BottomSheet } from "@/shared/ui";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAME_MAX_LENGTH = 80;

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { t } = useTranslation();
  const { mutate, isPending } = useAddProject();
  const [name, setName] = useState("");

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX_LENGTH;

  const handleClose = useCallback(() => {
    setName("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    mutate(trimmedName, { onSuccess: handleClose });
  }, [isValid, trimmedName, mutate, handleClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
            {t("project.create_title")}
          </h2>
          <button onClick={handleClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="#A8A29E" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-[12px] flex items-center justify-center"
              style={{ backgroundColor: "#ECFDF5" }}
            >
              <FolderPlus size={18} color="#059669" strokeWidth={1.8} />
            </div>
          </div>

          <div>
            <p
              className="text-[11px] font-semibold uppercase"
              style={{ color: "#A8A29E", letterSpacing: "1px", marginBottom: 8 }}
            >
              {t("project.name_prompt")}
            </p>
            <div
              className="flex items-center rounded-xl"
              style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
            >
              <input
                id="new-project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("project.name_placeholder")}
                maxLength={NAME_MAX_LENGTH}
                className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
                style={{ color: "#1C1917" }}
                autoFocus
              />
            </div>
          </div>

          <button
            disabled={!isValid || isPending}
            onClick={handleSubmit}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-white cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)" }}
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} strokeWidth={2.5} />
            )}
            {t("project.create_title")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
