interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div
      className="flex items-center"
      style={{ height: 40, padding: "0 16px", backgroundColor: "#F5F5F4" }}
    >
      <span
        className="text-[11px] font-semibold uppercase"
        style={{ color: "#A8A29E", letterSpacing: "1px" }}
      >
        {title}
      </span>
    </div>
  );
}
