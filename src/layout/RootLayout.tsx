import {
  School,
  BookOpen,
  Calendar,
  Users,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "schoolInfo", label: "School Info", icon: School },
    { id: "lessons", label: "Lessons", icon: BookOpen },
    { id: "schedules", label: "Class Schedules", icon: Calendar },
    { id: "staff", label: "Staff", icon: Users },
    { id: "activities", label: "Activities", icon: Image },
  ];

  function handleNavigate(page: string) {
    onNavigate(page);
    setMobileSidebarOpen(false);
  }

  function renderSidebarContent({ compact = false }: { compact?: boolean } = {}) {
    return (
      <div className="p-4 lg:p-6">
        <button
          type="button"
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-md bg-transparent p-0 text-slate-900 transition-[background-color,transform] duration-150 hover:bg-slate-50 active:scale-[0.98] active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900 dark:active:bg-slate-800 lg:mb-8"
          onClick={() => {
            if (compact) {
              setSidebarOpen(!sidebarOpen);
            }
          }}
        >
          <School className="h-8 w-8 shrink-0" />
          {!compact || sidebarOpen ? <h1 className="truncate text-xl font-semibold">SchoolManager</h1> : null}
        </button>

        {!compact || sidebarOpen ? (
          <div className="mb-6 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:mb-8">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active School
            </label>
            <Select
              value={selectedSchoolId}
              onValueChange={(schoolId) => {
                onSchoolChange(schoolId);
                setMobileSidebarOpen(false);
              }}
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

        {compact && !sidebarOpen && selectedSchoolId ? (
          <div className="mb-8 flex justify-center">
            <div className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
          </div>
        ) : null}

        <nav className="space-y-2 lg:space-y-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                aria-current={currentPage === item.id ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-md border border-transparent px-4 py-3 transition-[background-color,border-color,box-shadow,transform,color] duration-150 active:scale-[0.98] ${currentPage === item.id
                  ? "border-slate-200 bg-slate-100 text-slate-950 shadow-sm hover:bg-slate-200 active:bg-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800 dark:active:bg-slate-800"
                  : "text-slate-700 hover:border-slate-200 hover:bg-gray-50 hover:text-slate-950 hover:shadow-sm active:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-50 dark:active:bg-slate-800"
                  }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!compact || sidebarOpen ? <span className="truncate">{item.label}</span> : null}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-28"
          } hidden overflow-hidden border-r border-gray-100/15 transition-all duration-300 lg:block`}
      >
        {renderSidebarContent({ compact: true })}
      </aside>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] overflow-y-auto border-r border-slate-200 bg-white shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-2">
                <School className="h-6 w-6 shrink-0" />
                <span className="truncate font-semibold">SchoolManager</span>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-gray-100/15 px-4 py-2 dark:border-slate-800 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] active:bg-slate-100 active:shadow-sm dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:active:bg-slate-800 lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
                title="Menu"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] active:bg-slate-100 active:shadow-sm dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:active:bg-slate-800"
                onClick={onThemeToggle}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] active:bg-slate-100 active:shadow-sm dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:active:bg-slate-800"
                onClick={() => void onLogout()}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
