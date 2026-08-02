import { Calendar, Image, LogOut, School, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { resetDocumentBranding, setDocumentBranding } from "../../../lib/documentBranding";
import { authService } from "../../../services/authService";
import { getStoredUser } from "../../../services/http";
import { schoolService } from "../../../services/schoolService";
import type { School as SchoolRecord, UUID } from "../../../types/api";

export interface EndUserOutletContext {
  schools: SchoolRecord[];
  selectedSchoolId: UUID;
  schoolsLoading: boolean;
}

const navItems = [
  { to: "/portal/activities", label: "Activities", icon: Image },
  { to: "/portal/schedule", label: "Schedule", icon: Calendar },
  { to: "/portal/staff", label: "Staff", icon: Users },
];

export default function EndUserShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<UUID>("");
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const loadSchools = useCallback(async () => {
    setSchoolsLoading(true);
    try {
      const loadedSchools = await schoolService.list();
      setSchools(loadedSchools);
      setSelectedSchoolId((currentSchoolId) => {
        const storedSchoolId = window.localStorage.getItem("school-portal-selected-school");
        const nextSchoolId =
          loadedSchools.find((school) => school.id === currentSchoolId)?.id ??
          loadedSchools.find((school) => school.id === storedSchoolId)?.id ??
          loadedSchools[0]?.id ??
          "";

        if (nextSchoolId) {
          window.localStorage.setItem("school-portal-selected-school", nextSchoolId);
        }

        return nextSchoolId;
      });
    } finally {
      setSchoolsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchools();
  }, [loadSchools]);

  const selectedSchool = schools.find((school) => school.id === selectedSchoolId);
  const isPortalLanding = location.pathname === "/portal" || location.pathname === "/portal/";

  useEffect(() => {
    if (!isPortalLanding && selectedSchool) {
      setDocumentBranding(selectedSchool.schoolName, selectedSchool.logoUrl);
    } else {
      setDocumentBranding("SchoolManager Portal");
    }

    return resetDocumentBranding;
  }, [isPortalLanding, selectedSchool]);

  async function handleLogout() {
    await authService.logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link className="flex min-w-0 items-center gap-3" to="/portal">
              {!isPortalLanding && selectedSchool?.logoUrl ? (
                <img className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-800" src={selectedSchool.logoUrl} alt={`${selectedSchool.schoolName} logo`} />
              ) : (
                <div className="shrink-0 rounded-md bg-blue-600 p-2 text-white">
                  <School className="h-5 w-5" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold sm:text-lg">{isPortalLanding ? "SchoolManager" : selectedSchool?.schoolName ?? "SchoolManager"}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.firstName ? `Welcome, ${user.firstName}` : "Student portal"}</p>
              </div>
            </Link>
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
            {!isPortalLanding ? (
              <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                          isActive
                            ? "border-slate-950 bg-slate-950 text-white dark:border-slate-50 dark:bg-slate-50 dark:text-slate-950"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet context={{ schools, selectedSchoolId, schoolsLoading } satisfies EndUserOutletContext} />
      </div>
    </main>
  );
}
