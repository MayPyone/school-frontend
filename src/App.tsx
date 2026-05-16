import "./App.css";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "./components/dashboard/ProtectedRoute";
import { RootLayout } from "./layout/RootLayout";
import ActivityPage from "./pages/activity/ActivityPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import LessonPage from "./pages/lesson/LessonPage";
import OverviewPage from "./pages/overview/OverviewPage";
import SchedulePage from "./pages/schedule/SchedulePage";
import SchoolsPage from "./pages/schools/SchoolsPage";
import StaffPage from "./pages/staff/StaffPage";
import { authService } from "./services/authService";
import { schoolService } from "./services/schoolService";
import type { School, UUID } from "./types/api";

type ThemeMode = "light" | "dark";

const pagePaths: Record<string, string> = {
  overview: "/",
  schools: "/schools",
  lessons: "/lessons",
  schedules: "/schedules",
  staff: "/staff",
  activities: "/activities",
};

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
    Object.entries(pagePaths).find(([, path]) => path === location.pathname)?.[0] ?? "overview";

  useEffect(() => {
    async function loadSchools() {
      setSchoolsLoading(true);
      try {
        const loadedSchools = await schoolService.list();
        setSchools(loadedSchools);
        const storedSchoolId = window.localStorage.getItem("school-dashboard-selected-school");
        const nextSchoolId =
          loadedSchools.find((school) => school.id === storedSchoolId)?.id ??
          loadedSchools[0]?.id ??
          "";
        setSelectedSchoolId(nextSchoolId);
      } finally {
        setSchoolsLoading(false);
      }
    }

    void loadSchools();
  }, []);

  function handleSchoolChange(schoolId: UUID) {
    setSelectedSchoolId(schoolId);
    window.localStorage.setItem("school-dashboard-selected-school", schoolId);
  }

  async function handleLogout() {
    await authService.logout();
    navigate("/login", { replace: true });
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
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="lessons" element={<LessonPage schools={schools} selectedSchoolId={selectedSchoolId} />} />
        <Route path="lessons/:lessonId/units" element={<LessonPage schools={schools} selectedSchoolId={selectedSchoolId} />} />
        <Route path="schedules" element={<SchedulePage selectedSchoolId={selectedSchoolId} />} />
        <Route path="staff" element={<StaffPage schools={schools} selectedSchoolId={selectedSchoolId} />} />
        <Route path="activities" element={<ActivityPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <DashboardShell
              theme={theme}
              onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
