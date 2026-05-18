import { Link } from "react-router-dom";
import { Activity, BookOpen, Calendar, Plus, School, Users } from "lucide-react";
import { PageHeader, Panel, StatCard, primaryButtonClass, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { useAsyncData } from "../../hooks/useAsyncData";
import { lessonService } from "../../services/lessonService";
import { schoolService } from "../../services/schoolService";

export default function OverviewPage() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const schools = await schoolService.list();
    const lessonGroups = await Promise.all(
      schools.map((schoolItem) =>
        lessonService.listBySchool(schoolItem.id).catch(() => [])
      )
    );
    const lessons = lessonGroups.flat();
    return { schools, lessons };
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard overview" />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const schools = data?.schools ?? [];
  const lessons = data?.lessons ?? [];
  const recentItems = [
    ...schools.slice(0, 3).map((schoolItem) => ({
      label: schoolItem.schoolName,
      detail: schoolItem.schoolEmail ?? "School profile",
    })),
    ...lessons.slice(0, 3).map((lesson) => ({
      label: lesson.title,
      detail: `${lesson.level} - ${lesson.category}`,
    })),
  ].slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Operational summary across schools, lessons, staff, schedules, and activities."
        actions={
          <>
            <Link className={primaryButtonClass} to="/schools">

              <button type="button" className={primaryButtonClass}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add School
              </button>
            </Link>
            <Link className={secondaryButtonClass} to="/lessons">Manage lessons</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Schools" value={schools.length} icon={School} helper="Loaded from /schools" />
        <StatCard title="Total Lessons" value={lessons.length} icon={BookOpen} helper="Aggregated by school" />
        <StatCard title="Active Staff" value="Pending" icon={Users} helper="Backend endpoint planned" />
        <StatCard title="Scheduled Activities" value="Pending" icon={Calendar} helper="Backend endpoint planned" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {recentItems.length ? (
              recentItems.map((item) => (
                <div key={`${item.label}-${item.detail}`} className="flex items-center gap-3 rounded-md border border-slate-100 p-3">
                  <div className="rounded-md bg-blue-50 p-2 text-blue-700">
                    <Activity className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No activity yet" description="Create a school or lesson to populate this feed." />
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link className={secondaryButtonClass} to="/schools">Create or update schools</Link>
            <Link className={secondaryButtonClass} to="/lessons">Create lessons and units</Link>
            <Link className={secondaryButtonClass} to="/schedules">Review class schedules</Link>
            <Link className={secondaryButtonClass} to="/activities">Plan activities</Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

