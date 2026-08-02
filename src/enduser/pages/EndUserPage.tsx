import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, LogOut, MapPin, School, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Panel, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { activityService } from "../../services/activityService";
import { authService } from "../../services/authService";
import { getStoredUser, toApiError } from "../../services/http";
import { scheduleService } from "../../services/scheduleService";
import { schoolService } from "../../services/schoolService";
import type { Activity, ClassSchedule, School as SchoolRecord } from "../../types/api";

export default function EndUserPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPortalData() {
      setLoading(true);
      setError("");

      try {
        const [loadedSchools, loadedActivities, loadedSchedules] = await Promise.all([
          schoolService.list(),
          activityService.list(),
          scheduleService.list(),
        ]);

        if (!isMounted) {
          return;
        }

        setSchools(loadedSchools);
        setActivities(loadedActivities);
        setSchedules(loadedSchedules);
      } catch (requestError) {
        if (isMounted) {
          setError(toApiError(requestError).message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPortalData();

    return () => {
      isMounted = false;
    };
  }, []);

  const upcomingActivities = useMemo(
    () =>
      [...activities]
        .sort((left, right) => (left.activityDate ?? "").localeCompare(right.activityDate ?? ""))
        .slice(0, 4),
    [activities]
  );

  async function handleLogout() {
    await authService.logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-600 p-2 text-white">
              <School className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">SchoolManager</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.firstName ? `Welcome, ${user.firstName}` : "Student portal"}</p>
            </div>
          </div>
          <button type="button" className={secondaryButtonClass} onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-normal">Learning portal</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Browse available schools, class schedules, and activities.</p>
        </div>

        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="p-5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Schools</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "..." : schools.length}</p>
          </Panel>
          <Panel className="p-5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Schedules</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "..." : schedules.length}</p>
          </Panel>
          <Panel className="p-5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Activities</p>
            <p className="mt-2 text-3xl font-semibold">{loading ? "..." : activities.length}</p>
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <School className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <h3 className="text-base font-semibold">Available schools</h3>
            </div>
            <div className="space-y-3">
              {schools.map((school) => (
                <div key={school.id} className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{school.schoolName}</h4>
                      {school.subTitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{school.subTitle}</p> : null}
                    </div>
                    {school.schoolEmail ? <Badge tone="blue">{school.schoolEmail}</Badge> : null}
                  </div>
                  {school.schoolAddress?.length ? (
                    <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {school.schoolAddress.join(", ")}
                    </p>
                  ) : null}
                  <Link className={`mt-4 w-full ${secondaryButtonClass}`} to={`/public/schools/${school.id}`}>
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    View lessons
                  </Link>
                </div>
              ))}
              {!loading && schools.length === 0 ? <p className="text-sm text-slate-500">No schools are available yet.</p> : null}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <h3 className="text-base font-semibold">Upcoming activities</h3>
            </div>
            <div className="space-y-3">
              {upcomingActivities.map((activity) => (
                <div key={activity.id} className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="font-medium">{activity.title}</h4>
                  {activity.activityDate ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      {activity.activityDate}
                    </p>
                  ) : null}
                  {activity.description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{activity.description}</p> : null}
                </div>
              ))}
              {!loading && upcomingActivities.length === 0 ? <p className="text-sm text-slate-500">No activities are available yet.</p> : null}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
