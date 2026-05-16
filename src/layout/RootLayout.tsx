import {
  School,
  BookOpen,
  Calendar,
  Users,
  Image,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import { useState, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import type { School as SchoolRecord, UUID } from "../types/api";

interface RootLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  schools: SchoolRecord[];
  selectedSchoolId: UUID;
  onSchoolChange: (schoolId: UUID) => void;
  onLogout: () => void | Promise<void>;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  schoolsLoading?: boolean;
}

export function RootLayout({
  children,
  currentPage,
  onNavigate,
  schools,
  selectedSchoolId,
  onSchoolChange,
  onLogout,
  theme,
  onThemeToggle,
  schoolsLoading = false,
}: RootLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "schools", label: "Schools", icon: School },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "schedules", label: "Class Schedules", icon: Calendar },
    { id: "staff", label: "Staff", icon: Users },
    { id: "activities", label: "Activities", icon: Image },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-28"
          } border-r border-gray-100/15 transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6" >
          <button
            type="button"
            className="mb-8 flex w-full items-center justify-center gap-2 rounded-lg bg-transparent p-0 text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <School className="w-8 h-8 " />
            {sidebarOpen && <h1 className="text-xl font-semibold">SchoolManager</h1>}
          </button>

          {sidebarOpen ? (
            <div className="mb-8 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active School
              </label>
              <Select
                value={selectedSchoolId}
                onValueChange={onSchoolChange}
                disabled={schoolsLoading || schools.length === 0}
              >
                <SelectTrigger className="mt-2" aria-label="Switch active school">
                  <SelectValue placeholder={schoolsLoading ? "Loading schools..." : "No schools found"} />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id} title={school.schoolName}>
                      <span className="block max-w-52 truncate">{school.schoolName}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {!sidebarOpen && selectedSchoolId ? (
            <div className="mb-8 flex justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
            </div>
          ) : null}

          <nav className="space-y-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.id
                    ? "bg-slate-100 text-slate-950 dark:bg-slate-900 dark:text-slate-50"
                    : "text-slate-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-100/15 px-6 py-2 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">

              {/* <h2 className="text-2xl font-semibold capitalize">
                {menuItems.find((item) => item.id === currentPage)?.label || "Dashboard"}
              </h2> */}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                onClick={onThemeToggle}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                onClick={() => void onLogout()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
