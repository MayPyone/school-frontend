import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { Badge, Panel, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { lessonService } from "../../services/lessonService";
import { toApiError } from "../../services/http";
import type { ApiError, LessonResponse } from "../../types/api";
import type { EndUserOutletContext } from "./components/EndUserShell";

export default function EndUserLessonsPage() {
  const { schools, selectedSchoolId, schoolsLoading } = useOutletContext<EndUserOutletContext>();
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadLessons() {
      if (!selectedSchoolId) {
        setLessons([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const loadedLessons = await lessonService.listBySchool(selectedSchoolId);
        if (isMounted) {
          setLessons(loadedLessons);
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

    void loadLessons();

    return () => {
      isMounted = false;
    };
  }, [selectedSchoolId]);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">Lessons</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {selectedSchool ? `Browse lessons from ${selectedSchool.schoolName}.` : "Select a school to browse lessons."}
          </p>
        </div>
        {selectedSchool?.customizeSchoolId ? (
          <Link className={secondaryButtonClass} to={`/${selectedSchool.customizeSchoolId}/lessons`}>
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Open lesson library
          </Link>
        ) : null}
      </div>

      {schoolsLoading || loading ? <LoadingState label="Loading lessons" /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && !schoolsLoading && selectedSchoolId && lessons.length === 0 ? (
        <EmptyState title="No lessons published" description="This school has not published lessons yet." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lessons.slice(0, 9).map((lesson) => (
          <Panel key={lesson.lessonId} className="flex min-h-40 flex-col p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge>{lesson.level}</Badge>
              <Badge tone="blue">{lesson.category}</Badge>
            </div>
            <h3 className="truncate text-base font-semibold" title={lesson.title}>{lesson.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
              {lesson.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "No content preview"}
            </p>
          </Panel>
        ))}
      </div>
    </section>
  );
}
