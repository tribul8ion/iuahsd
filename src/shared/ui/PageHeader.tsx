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
      className="rounded-b-[36px] flex flex-col justify-center gap-1 flex-shrink-0 overflow-hidden"
      style={{
        position: "relative",
        background: "var(--gradient-header)",
        height,
        padding: "52px 20px 24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 18px 40px -18px rgba(7, 94, 84, 0.45)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          top: -80,
          right: -50,
          width: 230,
          height: 230,
          background: "radial-gradient(circle, rgba(167,243,208,0.42) 0%, rgba(167,243,208,0) 66%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          top: -30,
          left: -60,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(125,211,252,0.3) 0%, rgba(125,211,252,0) 68%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          bottom: -110,
          left: "30%",
          width: 240,
          height: 240,
          background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      {children}
      <h1
        className="text-white text-[27px] font-extrabold leading-tight"
        style={{ letterSpacing: "-0.4px", textShadow: "0 1px 2px rgba(7,94,84,0.25)" }}
      >
        {title}
      </h1>
      <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
        {subtitle}
      </p>
    </header>
  );
}
