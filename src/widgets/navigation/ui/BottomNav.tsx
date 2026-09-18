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
      <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? "#059669" : "#A8A29E"} />
      <span
        className="text-[9px] uppercase leading-none"
        style={{
          color: isActive ? "#059669" : "#A8A29E",
          fontWeight: isActive ? 600 : 500,
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white"
      style={{
        boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
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
              width: 46,
              height: 46,
              backgroundColor: "#059669",
              transform: "translateY(-14px)",
              boxShadow: "0 6px 16px rgba(5,150,105,0.35)",
            }}
          >
            <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
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
