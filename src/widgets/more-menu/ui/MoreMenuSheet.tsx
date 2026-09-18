import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { X, ChevronRight, CircleUserRound, Pill, NotebookPen, Trophy, ShieldCheck, type LucideIcon } from "lucide-react";
import { BottomSheet } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

interface MoreMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuRowProps {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
}

function MenuRow({ icon: Icon, title, onClick }: MenuRowProps) {
  return (
    <button
      onClick={onClick}
      className="glass-item flex items-center w-full rounded-2xl cursor-pointer text-left"
      style={{ padding: "12px 14px", gap: 12 }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-[12px]"
        style={{
          width: 38,
          height: 38,
          background: "linear-gradient(150deg, rgba(255,255,255,0.95) 0%, rgba(224,248,238,0.85) 100%)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <Icon size={20} strokeWidth={1.8} color="#059669" />
      </div>
      <span className="flex-1 min-w-0 text-[15px] font-semibold" style={{ color: "#1C1917" }}>
        {title}
      </span>
      <ChevronRight size={18} color="#A8A29E" strokeWidth={2} />
    </button>
  );
}

export function MoreMenuSheet({ isOpen, onClose }: MoreMenuSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = useUserStore((s) => s.isAdmin);

  const handleNavigate = useCallback(
    (path: string) => {
      onClose();
      navigate(path);
    },
    [onClose, navigate]
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
            {t("more.title")}
          </h2>
          <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="#A8A29E" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <MenuRow
            icon={CircleUserRound}
            title={t("nav.profile")}
            onClick={() => handleNavigate("/profile")}
          />
          <MenuRow
            icon={Pill}
            title={t("settings.medications_link")}
            onClick={() => handleNavigate("/medications")}
          />
          <MenuRow
            icon={NotebookPen}
            title={t("settings.plans_link")}
            onClick={() => handleNavigate("/plans")}
          />
          <MenuRow
            icon={Trophy}
            title={t("settings.achievements")}
            onClick={() => handleNavigate("/game")}
          />
          {isAdmin && (
            <MenuRow
              icon={ShieldCheck}
              title={t("settings.admin_link")}
              onClick={() => handleNavigate("/admin")}
            />
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
