import type { ReactNode } from "react";

interface SettingsRowProps {
  icon: ReactNode;
  iconBackground: string;
  label: string;
  labelColor?: string;
  labelWeight?: "medium" | "semibold";
  onClick: () => void;
}

export function SettingsRow({
  icon,
  iconBackground,
  label,
  labelColor = "#1C1917",
  labelWeight = "medium",
  onClick,
}: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full cursor-pointer"
      style={{ gap: 12, padding: "0 16px", height: 56 }}
    >
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: iconBackground }}
      >
        {icon}
      </div>
      <span
        className={`flex-1 text-left text-[15px] ${labelWeight === "semibold" ? "font-semibold" : "font-medium"}`}
        style={{ color: labelColor }}
      >
        {label}
      </span>
    </button>
  );
}
