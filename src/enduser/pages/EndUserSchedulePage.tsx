import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Badge, Panel } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { toApiError } from "../../services/http";
import { scheduleService } from "../../services/scheduleService";
import type { ApiError, ClassSchedule } from "../../types/api";
import type { EndUserOutletContext } from "./components/EndUserShell";

export default function EndUserSchedulePage() {
  const { selectedSchoolId } = useOutletContext<EndUserOutletContext>();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSchedules() {
      if (!selectedSchoolId) {
        setSchedules([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const loadedSchedules = await scheduleService.listBySchool(selectedSchoolId);
        if (isMounted) {
          setSchedules(loadedSchedules);
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

    void loadSchedules();

    return () => {
      isMounted = false;
    };
  }, [selectedSchoolId]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Schedule</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Class schedule for the selected school.</p>
      </div>

      {loading ? <LoadingState label="Loading schedule" /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && schedules.length === 0 ? <EmptyState title="No schedule" description="No class schedule is available for this school yet." /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {schedules.map((schedule) => (
          <Panel key={schedule.id} className="min-h-40 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {schedule.dayOfWeek}
              </p>
              <Badge tone={schedule.mode === "ONLINE" ? "blue" : "green"}>{schedule.mode}</Badge>
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {schedule.startTime} - {schedule.endTime}
            </p>
            {schedule.teacherName ? <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">Teacher: {schedule.teacherName}</p> : null}
            {schedule.location ? (
              <p className="mt-2 flex items-center gap-2 truncate text-sm text-slate-600 dark:text-slate-400" title={schedule.location}>
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                {schedule.location}
              </p>
            ) : null}
          </Panel>
        ))}
      </div>
    </section>
  );
}
