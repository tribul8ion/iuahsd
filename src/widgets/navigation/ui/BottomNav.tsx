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
      className="flex-1 flex flex-col items-center justify-center gap-[2px] cursor-pointer"
      style={{ paddingTop: 10, paddingBottom: 6 }}
      aria-label={t(item.labelKey)}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className="flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: 46,
          height: 28,
          backgroundColor: isActive ? "rgba(255,255,255,0.85)" : "transparent",
          boxShadow: isActive
            ? "0 2px 8px rgba(13,84,73,0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
            : "none",
        }}
      >
        <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} color={isActive ? "#047857" : "#8FA39B"} />
      </span>
      <span
        className="text-[9px] uppercase leading-none"
        style={{
          color: isActive ? "#047857" : "#8FA39B",
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
      style={{ padding: "0 14px calc(10px + env(safe-area-inset-bottom)) 14px" }}
    >
      <div
        className="glass relative flex items-center justify-around rounded-[32px]"
        style={{ maxWidth: 460, margin: "0 auto" }}
      >
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
              width: 54,
              height: 54,
              background: "var(--gradient-primary)",
              transform: "translateY(-18px)",
              boxShadow:
                "0 10px 24px -4px rgba(5,150,105,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
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
