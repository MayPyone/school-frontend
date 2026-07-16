import { useEffect, useState } from "react";
import { Calendar, MapPin } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Panel } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { activityService } from "../../services/activityService";
import { toApiError } from "../../services/http";
import type { Activity, ApiError } from "../../types/api";
import type { EndUserOutletContext } from "./components/EndUserShell";

export default function EndUserActivitiesPage() {
  const { selectedSchoolId } = useOutletContext<EndUserOutletContext>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      if (!selectedSchoolId) {
        setActivities([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const loadedActivities = await activityService.listBySchool(selectedSchoolId);
        if (isMounted) {
          setActivities(loadedActivities);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(toApiError(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, [selectedSchoolId]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Activities</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upcoming school activities and events.</p>
      </div>

      {loading ? <LoadingState label="Loading activities" /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && activities.length === 0 ? <EmptyState title="No activities" description="No activities are available for this school yet." /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activities.map((activity) => (
          <Panel key={activity.id} className="min-h-40 p-5">
            <h3 className="truncate text-base font-semibold" title={activity.title}>{activity.title}</h3>
            {activity.activityDate ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {activity.activityDate}
              </p>
            ) : null}
            {activity.location ? (
              <p className="mt-2 flex items-center gap-2 truncate text-sm text-slate-500 dark:text-slate-400" title={activity.location}>
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                {activity.location}
              </p>
            ) : null}
            {activity.description ? <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{activity.description}</p> : null}
          </Panel>
        ))}
      </div>
    </section>
  );
}
