import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ActivityPage from "./backoffice/activity/ActivityPage";
import LessonPage from "./backoffice/lesson/LessonPage";
import UnitDetailPage from "./backoffice/lesson/UnitDetailPage";
import OverviewPage from "./backoffice/overview/OverviewPage";
import SchedulePage from "./backoffice/schedule/SchedulePage";
import SchoolInfoPage from "./backoffice/schools/SchoolInfoPage";
import StaffPage from "./backoffice/staff/StaffPage";
import { ProtectedRoute } from "./components/dashboard/ProtectedRoute";
import EndUserActivitiesPage from "./enduser/pages/EndUserActivitiesPage";
import EndUserSchedulePage from "./enduser/pages/EndUserSchedulePage";
import EndUserStaffPage from "./enduser/pages/EndUserStaffPage";
import EndUserSchoolsPage from "./enduser/pages/EndUserSchoolsPage";
import EndUserShell from "./enduser/pages/components/EndUserShell";
import { RootLayout } from "./layout/RootLayout";
import { resetDocumentBranding, setDocumentBranding } from "./lib/documentBranding";
import LoginPage from "./pages/auth/LoginPage";
import SetupAdminPage from "./pages/auth/SetupAdminPage";
import SignupPage from "./pages/auth/SignupPage";
import PublicSchoolPage from "./pages/public/PublicSchoolPage";
import PublicUnitDetailPage from "./pages/public/PublicUnitDetailPage";
import { authService } from "./services/authService";
import { getStoredUser } from "./services/http";
import { schoolService } from "./services/schoolService";
import type { School, UUID } from "./types/api";

type ThemeMode = "light" | "dark";

const backofficeRoot = "/backoffice";

function backofficePath(path = "") {
  return path ? `${backofficeRoot}${path}` : backofficeRoot;
}

function getPagePaths(isAdmin: boolean): Record<string, string> {
  return {
    overview: backofficePath(),
    schoolInfo: backofficePath("/school-info"),
    lessons: backofficePath("/lessons"),
    schedules: backofficePath("/schedules"),
    staff: isAdmin ? backofficePath("/admin/staff") : backofficePath("/staff"),
    activities: backofficePath("/activities"),
  };
}

function PortalScheduleRedirect() {
  return <Navigate to="/portal/schedule" replace />;
}

function BackofficeRedirect() {
  const location = useLocation();
  return <Navigate to={`${backofficeRoot}${location.pathname}${location.search}${location.hash}`} replace />;
}

function LessonsRedirect() {
  return <Navigate to={backofficePath("/lessons")} replace />;
}

function SchedulesRedirect() {
  return <Navigate to={backofficePath("/schedules")} replace />;
}

interface DashboardShellProps {
  theme: ThemeMode;
  onThemeToggle: () => void;
}

function DashboardShell({ theme, onThemeToggle }: DashboardShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const pagePaths = getPagePaths(isAdmin);
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

  useEffect(() => {
    const selectedSchool = schools.find((school) => school.id === selectedSchoolId);
    if (selectedSchool) {
      setDocumentBranding(selectedSchool.schoolName, selectedSchool.logoUrl);
    } else {
      setDocumentBranding("SchoolManager Backoffice");
    }

    return resetDocumentBranding;
  }, [schools, selectedSchoolId]);

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
    const dashboardPath = path === backofficeRoot ? "/" : path.startsWith(`${backofficeRoot}/`) ? path.slice(backofficeRoot.length) : path;

    if (dashboardPath === "/") {
      return <OverviewPage onSchoolsChanged={refreshSchools} />;
    }
    if (dashboardPath === "/school-info") {
      return <SchoolInfoPage schools={schools} selectedSchoolId={selectedSchoolId} loadSchools={refreshSchools} />;
    }
    if (dashboardPath.startsWith("/lessons/") && dashboardPath.includes("/units/")) {
      return <UnitDetailPage schools={schools} />;
    }
    if (dashboardPath === "/lessons" || dashboardPath.startsWith("/lessons/")) {
      return <LessonPage schools={schools} selectedSchoolId={selectedSchoolId} />;
    }
    if (dashboardPath === "/schedules") {
      return <SchedulePage selectedSchoolId={selectedSchoolId} />;
    }
    if (dashboardPath === "/admin/staff") {
      return <StaffPage schools={schools} selectedSchoolId={selectedSchoolId} canManageStaff />;
    }
    if (dashboardPath === "/staff") {
      if (isAdmin) {
        return <Navigate to={backofficePath("/admin/staff")} replace />;
      }

      return <StaffPage schools={schools} selectedSchoolId={selectedSchoolId} />;
    }
    if (dashboardPath === "/activities") {
      return <ActivityPage selectedSchoolId={selectedSchoolId} />;
    }

    return <Navigate to={backofficePath()} replace />;
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
      <Route element={<ProtectedRoute allowedRoles={["END_USER"]} redirectTo={backofficePath()} />}>
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
      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "TEACHER", "ASSISTANT"]} redirectTo="/portal/lessons" />}>
        <Route index element={<Navigate to={backofficePath()} replace />} />
        <Route path={backofficePath()} element={dashboardShell} />
        <Route path={backofficePath("/school-info")} element={dashboardShell} />
        <Route path={backofficePath("/schools")} element={<Navigate to={backofficePath()} replace />} />
        <Route path={backofficePath("/lesson")} element={<LessonsRedirect />} />
        <Route path={backofficePath("/lessons")} element={dashboardShell} />
        <Route path={backofficePath("/lessons/:lessonId/units")} element={dashboardShell} />
        <Route path={backofficePath("/lessons/:lessonId/units/:unitId")} element={dashboardShell} />
        <Route path={backofficePath("/schedule")} element={<SchedulesRedirect />} />
        <Route path={backofficePath("/schedules")} element={dashboardShell} />
        <Route path={backofficePath("/staff")} element={dashboardShell} />
        <Route path={backofficePath("/activities")} element={dashboardShell} />
        <Route path="/school-info" element={<BackofficeRedirect />} />
        <Route path="/schools" element={<Navigate to={backofficePath()} replace />} />
        <Route path="/lesson" element={<LessonsRedirect />} />
        <Route path="/lessons" element={<BackofficeRedirect />} />
        <Route path="/lessons/:lessonId/units" element={<BackofficeRedirect />} />
        <Route path="/lessons/:lessonId/units/:unitId" element={<BackofficeRedirect />} />
        <Route path="/schedule" element={<SchedulesRedirect />} />
        <Route path="/schedules" element={<BackofficeRedirect />} />
        <Route path="/staff" element={<BackofficeRedirect />} />
        <Route path="/activities" element={<BackofficeRedirect />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]} redirectTo={backofficePath("/staff")} />}>
        <Route path={backofficePath("/admin/staff")} element={dashboardShell} />
        <Route path="/admin/staff" element={<Navigate to={backofficePath("/admin/staff")} replace />} />
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
