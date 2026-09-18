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
      className="rounded-b-[32px] flex flex-col justify-center gap-1 flex-shrink-0 overflow-hidden"
      style={{
        position: "relative",
        background: "var(--gradient-header)",
        height,
        padding: "52px 20px 24px 20px",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          top: -70,
          right: -40,
          width: 190,
          height: 190,
          background: "radial-gradient(circle, rgba(167,243,208,0.35) 0%, rgba(167,243,208,0) 68%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          bottom: -90,
          left: -30,
          width: 220,
          height: 220,
          background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      {children}
      <h1
        className="text-white text-[27px] font-extrabold leading-tight"
        style={{ letterSpacing: "-0.4px" }}
      >
        {title}
      </h1>
      <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
        {subtitle}
      </p>
    </header>
  );
}
