import { useTranslation } from "react-i18next";

interface ProfileHeaderProps {
  displayName: string;
  memberSinceDate: string | null;
}

export function ProfileHeader({ displayName, memberSinceDate }: ProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className="rounded-b-[28px] flex flex-col justify-center gap-1"
      style={{
        background: "linear-gradient(160deg, #059669 0%, #0D9488 100%)",
        minHeight: 160,
        padding: "52px 20px 24px 20px",
      }}
    >
      <h1 className="text-[26px] font-bold text-white leading-tight">
        {t("profile.title")}
      </h1>
      <p className="text-[18px] font-semibold text-white leading-tight">
        {displayName}
      </p>
      {memberSinceDate && (
        <p className="text-[#D1FAE5] text-[13px] font-medium">
          {t("profile.member_since", { date: memberSinceDate })}
        </p>
      )}
    </header>
  );
}
