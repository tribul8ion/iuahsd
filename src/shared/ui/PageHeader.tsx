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
      className="flex flex-col justify-center gap-1 flex-shrink-0"
      style={{
        position: "relative",
        backgroundColor: "#131313",
        height,
        padding: "52px 20px 16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {children}
      <h1
        className="text-[24px] font-bold leading-tight uppercase"
        style={{ letterSpacing: "-0.01em", color: "var(--color-text)" }}
      >
        {title}
      </h1>
      <p className="section-label">{subtitle}</p>
    </header>
  );
}
