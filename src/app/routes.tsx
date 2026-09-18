import { Routes, Route, Navigate } from "react-router-dom";
import { TodayPage } from "@/pages/today";
import { CalendarPage } from "@/pages/calendar";
import { MedicationsPage } from "@/pages/medications";
import { HabitsPage } from "@/pages/habits";
import { ProfilePage } from "@/pages/profile";
import { GamePage } from "@/pages/game";
import { PlansPage } from "@/pages/plans";
import { AdminPage } from "@/pages/admin";
import { useCurrentUser } from "@/entities/user";
import { Spinner } from "@/shared/ui";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: profile, isPending } = useCurrentUser();
  if (isPending) {
    return <Spinner />;
  }
  if (profile?.is_admin !== true) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/medications" element={<MedicationsPage />} />
      <Route path="/habits" element={<HabitsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<Navigate to="/profile" replace />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="/achievements" element={<Navigate to="/game" replace />} />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminPage />
          </AdminGuard>
        }
      />
    </Routes>
  );
}
