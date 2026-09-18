import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ClipboardCheck,
  Calendar,
  Target,
  MoreHorizontal,
  Plus,
  type LucideIcon,
} from "lucide-react";

interface NavItemBase {
  labelKey: string;
  icon: LucideIcon;
}

interface NavItem extends NavItemBase {
  path: string;
}

const LEFT_ITEMS: NavItem[] = [
  { path: "/", labelKey: "nav.today", icon: ClipboardCheck },
  { path: "/calendar", labelKey: "nav.calendar", icon: Calendar },
];

const RIGHT_ITEMS: NavItem[] = [
  { path: "/habits", labelKey: "nav.habits", icon: Target },
];

const MORE_ITEM: NavItemBase = { labelKey: "nav.more", icon: MoreHorizontal };

const MORE_ACTIVE_PATHS = ["/profile", "/medications", "/plans", "/game", "/admin"];

interface BottomNavProps {
  onAdd: () => void;
  onMore: () => void;
}

function NavButton({ item, isActive, onClick, t }: {
  item: NavItemBase;
  isActive: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-[3px] h-[46px] cursor-pointer"
      aria-label={t(item.labelKey)}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className="flex items-center justify-center rounded-full transition-colors duration-200"
        style={{
          width: 44,
          height: 26,
          marginBottom: 1,
          backgroundColor: isActive ? "#DCF5E9" : "transparent",
        }}
      >
        <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? "#047857" : "#A8A29E"} />
      </span>
      <span
        className="text-[9px] uppercase leading-none"
        style={{
          color: isActive ? "#047857" : "#A8A29E",
          fontWeight: isActive ? 700 : 500,
          letterSpacing: "0.5px",
        }}
      >
        {t(item.labelKey)}
      </span>
    </button>
  );
}

export function BottomNav({ onAdd, onMore }: BottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(18px) saturate(1.6)",
        WebkitBackdropFilter: "blur(18px) saturate(1.6)",
        borderTop: "1px solid rgba(30, 41, 59, 0.07)",
        padding: "8px 16px calc(20px + env(safe-area-inset-bottom)) 16px",
      }}
    >
      <div className="flex items-center justify-around">
        {LEFT_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            t={t}
          />
        ))}

        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onAdd}
            aria-label="add-entry"
            className="cursor-pointer flex items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
            style={{
              width: 50,
              height: 50,
              background: "var(--gradient-primary)",
              transform: "translateY(-16px)",
              boxShadow: "var(--shadow-fab)",
            }}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>

        {RIGHT_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            t={t}
          />
        ))}

        <NavButton
          key="more"
          item={MORE_ITEM}
          isActive={MORE_ACTIVE_PATHS.includes(location.pathname)}
          onClick={onMore}
          t={t}
        />
      </div>
    </nav>
  );
}
