import type { CSSProperties, ReactNode } from "react";

type EmptyStateSize = "lg" | "md";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  minHeight: string;
  size?: EmptyStateSize;
}

interface SizeConfig {
  containerClassName: string;
  boxClassName: string;
  boxStyle: CSSProperties;
}

const SIZE_CONFIG: Record<EmptyStateSize, SizeConfig> = {
  lg: {
    containerClassName: "flex flex-col items-center justify-center gap-4 text-center",
    boxClassName: "w-20 h-20 rounded-3xl bg-white flex items-center justify-center",
    boxStyle: { boxShadow: "0 1px 8px rgba(0,0,0,0.03)" },
  },
  md: {
    containerClassName: "flex flex-col items-center justify-center gap-3 text-center",
    boxClassName: "w-14 h-14 rounded-2xl flex items-center justify-center",
    boxStyle: { backgroundColor: "#F5F5F4" },
  },
};

export function EmptyState({ icon, title, subtitle, minHeight, size = "lg" }: EmptyStateProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div className={config.containerClassName} style={{ minHeight }}>
      <div className={config.boxClassName} style={config.boxStyle}>
        {icon}
      </div>
      <div>
        <p className="text-[15px] font-semibold mb-1" style={{ color: "#1C1917" }}>
          {title}
        </p>
        <p className="text-[13px]" style={{ color: "#A8A29E" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
