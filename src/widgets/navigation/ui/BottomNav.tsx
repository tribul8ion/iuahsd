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
      style={{
        paddingTop: 10,
        paddingBottom: 8,
        color: isActive ? "#F9FFD0" : "#C8C6C8",
        opacity: isActive ? 1 : 0.5,
        transition: "opacity 150ms ease, transform 150ms ease",
      }}
      aria-label={t(item.labelKey)}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon size={22} strokeWidth={isActive ? 2.2 : 1.9} />
      <span
        className="uppercase leading-none"
        style={{ fontSize: 10, lineHeight: "14px", letterSpacing: "0.05em", fontWeight: isActive ? 700 : 600 }}
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
      style={{ padding: "0 24px calc(16px + env(safe-area-inset-bottom)) 24px" }}
    >
      <div
        className="relative flex items-center justify-around rounded-full"
        style={{
          maxWidth: 460,
          margin: "0 auto",
          backgroundColor: "#201F1F",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
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
              width: 48,
              height: 48,
              background: "var(--gradient-primary)",
              transform: "translateY(-14px)",
              boxShadow: "var(--shadow-fab)",
              
            }}
          >
            <Plus size={24} color="#2C3400" strokeWidth={2.6} />
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
