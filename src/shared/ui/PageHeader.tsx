import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  height: number;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, height, children }: PageHeaderProps) {
  return (
    <header
      className="rounded-b-[28px] flex flex-col justify-center gap-1 flex-shrink-0"
      style={{
        position: "relative",
        background: "var(--gradient-header)",
        height,
        padding: "52px 20px 24px 20px",
      }}
    >
      {children}
      <h1 className="text-white text-[26px] font-bold leading-tight">{title}</h1>
      <p className="text-[#D1FAE5] text-[13px] font-medium">{subtitle}</p>
    </header>
  );
}
