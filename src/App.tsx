import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "./components/dashboard/ProtectedRoute";
import { RootLayout } from "./layout/RootLayout";
import ActivityPage from "./pages/activity/ActivityPage";
import LoginPage from "./pages/auth/LoginPage";
import SetupAdminPage from "./pages/auth/SetupAdminPage";
import SignupPage from "./pages/auth/SignupPage";
import LessonPage from "./pages/lesson/LessonPage";
import UnitDetailPage from "./pages/lesson/UnitDetailPage";
import EndUserActivitiesPage from "./pages/end-user/EndUserActivitiesPage";
import EndUserSchedulePage from "./pages/end-user/EndUserSchedulePage";
import EndUserStaffPage from "./pages/end-user/EndUserStaffPage";
import EndUserSchoolsPage from "./pages/end-user/EndUserSchoolsPage";
import EndUserShell from "./pages/end-user/components/EndUserShell";
import OverviewPage from "./pages/overview/OverviewPage";
import PublicSchoolPage from "./pages/public/PublicSchoolPage";
import PublicUnitDetailPage from "./pages/public/PublicUnitDetailPage";
import SchedulePage from "./pages/schedule/SchedulePage";
import SchoolInfoPage from "./pages/schools/SchoolInfoPage";
import SchoolsPage from "./pages/schools/SchoolsPage";
import StaffPage from "./pages/staff/StaffPage";
import { authService } from "./services/authService";
import { schoolService } from "./services/schoolService";
import type { School, UUID } from "./types/api";

type ThemeMode = "light" | "dark";

const pagePaths: Record<string, string> = {
  overview: "/",
  schoolInfo: "/school-info",
  schools: "/schools",
  lessons: "/lessons",
  schedules: "/schedules",
  staff: "/staff",
  activities: "/activities",
};

function PortalScheduleRedirect() {
  return <Navigate to="/portal/schedule" replace />;
}

function LessonsRedirect() {
  return <Navigate to="/lessons" replace />;
}

function SchedulesRedirect() {
  return <Navigate to="/schedules" replace />;
}

interface DashboardShellProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
}

function DashboardShell({ theme, onThemeToggle }: DashboardShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<UUID>("");
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const currentPage =
    Object.entries(pagePaths)
      .filter(([, path]) => path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(`${path}/`))
      .sort((left, right) => right[1].length - left[1].length)[0]?.[0] ?? "overview";

  const refreshSchools = useCallback(async () => {
    setSchoolsLoading(true);
    try {
      const loadedSchools = await schoolService.list();
      setSchools(loadedSchools);
      setSelectedSchoolId((currentSchoolId) => {
        const storedSchoolId = window.localStorage.getItem("school-dashboard-selected-school");
        const nextSchoolId =
          loadedSchools.find((school) => school.id === currentSchoolId)?.id ??
          loadedSchools.find((school) => school.id === storedSchoolId)?.id ??
          loadedSchools[0]?.id ??
          "";

        if (nextSchoolId) {
          window.localStorage.setItem("school-dashboard-selected-school", nextSchoolId);
        } else {
          window.localStorage.removeItem("school-dashboard-selected-school");
        }

        return nextSchoolId;
      });
      return loadedSchools;
    } finally {
      setSchoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSchools();
  }, [refreshSchools]);

  function handleSchoolChange(schoolId: UUID) {
    setSelectedSchoolId(schoolId);
    window.localStorage.setItem("school-dashboard-selected-school", schoolId);
  }

  async function handleLogout() {
    await authService.logout();
    navigate("/login", { replace: true });
  }

  function renderCurrentPage() {
    const path = location.pathname;

    if (path === "/") {
      return <OverviewPage />;
    }
    if (path === "/school-info") {
      return <SchoolInfoPage schools={schools} selectedSchoolId={selectedSchoolId} loadSchools={refreshSchools} />;
    }
    if (path === "/schools") {
      return <SchoolsPage loadSchools={refreshSchools} />;
    }
    if (path.startsWith("/lessons/") && path.includes("/units/")) {
      return <UnitDetailPage schools={schools} />;
    }
    if (path === "/lessons" || path.startsWith("/lessons/")) {
      return <LessonPage schools={schools} selectedSchoolId={selectedSchoolId} />;
    }
    if (path === "/schedules") {
      return <SchedulePage selectedSchoolId={selectedSchoolId} />;
    }
    if (path === "/staff") {
      return <StaffPage schools={schools} selectedSchoolId={selectedSchoolId} />;
    }
    if (path === "/activities") {
      return <ActivityPage selectedSchoolId={selectedSchoolId} />;
    }

    return <Navigate to="/" replace />;
  }

  return (
    <RootLayout
      currentPage={currentPage}
      onNavigate={(page) => navigate(pagePaths[page] ?? "/")}
      schools={schools}
      selectedSchoolId={selectedSchoolId}
      onSchoolChange={handleSchoolChange}
      schoolsLoading={schoolsLoading}
      onLogout={handleLogout}
      theme={theme}
      onThemeToggle={onThemeToggle}
    >
      {renderCurrentPage()}
    </RootLayout>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const storedTheme = window.localStorage.getItem("school-dashboard-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("school-dashboard-theme", theme);
  }, [theme]);

  const dashboardShell = (
    <DashboardShell
      theme={theme}
      onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
    />
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/setup-admin" element={<SetupAdminPage />} />
      <Route element={<ProtectedRoute allowedRoles={["END_USER"]} redirectTo="/" />}>
        <Route path="/portal" element={<EndUserShell />}>
          <Route index element={<EndUserSchoolsPage />} />
          <Route path="lesson" element={<Navigate to="/portal" replace />} />
          <Route path="lessons" element={<Navigate to="/portal" replace />} />
          <Route path="activities" element={<EndUserActivitiesPage />} />
          <Route path="schedules" element={<PortalScheduleRedirect />} />
          <Route path="schedule" element={<EndUserSchedulePage />} />
          <Route path="staff" element={<EndUserStaffPage />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "ASSISTANT"]} redirectTo="/portal/lessons" />}>
        <Route index element={dashboardShell} />
        <Route path="/school-info" element={dashboardShell} />
        <Route path="/schools" element={dashboardShell} />
        <Route path="/lesson" element={<LessonsRedirect />} />
        <Route path="/lessons" element={dashboardShell} />
        <Route path="/lessons/:lessonId/units" element={dashboardShell} />
        <Route path="/lessons/:lessonId/units/:unitId" element={dashboardShell} />
        <Route path="/schedule" element={<SchedulesRedirect />} />
        <Route path="/schedules" element={dashboardShell} />
        <Route path="/staff" element={dashboardShell} />
        <Route path="/activities" element={dashboardShell} />
      </Route>
      <Route path="/public/schools/:customizeSchoolId" element={<PublicSchoolPage />} />
      <Route path="/public/schools/:customizeSchoolId/lessons/:lessonId/units/:unitId" element={<PublicUnitDetailPage />} />
      <Route path="/:customizeSchoolId/lessons/:lessonId/units/:unitId" element={<PublicUnitDetailPage />} />
      <Route path="/:customizeSchoolId/:publicTab" element={<PublicSchoolPage />} />
      <Route path="/:customizeSchoolId" element={<PublicSchoolPage />} />
    </Routes>
  );
}

export default App;
