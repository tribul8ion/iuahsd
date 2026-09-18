interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center"
      style={{ height: 40, padding: "0 16px", backgroundColor: "transparent" }}
    >
      <span
        className="text-[11px] font-bold uppercase"
        style={{ color: "#78716C", letterSpacing: "1.2px" }}
      >
        {title}
      </span>
    </div>
  );
}
