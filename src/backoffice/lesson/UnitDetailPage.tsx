import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, Panel, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { toApiError } from "../../services/http";
import { lessonService } from "../../services/lessonService";
import { unitService } from "../../services/unitService";
import type { ApiError, LessonResponse, School, UnitResponse, UUID } from "../../types/api";

function RichContent({ html }: { html?: string }) {
  if (!html) {
    return <p className="text-sm text-slate-500">No content has been added.</p>;
  }

  return <div className="rich-text-content text-sm text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />;
}

interface UnitDetailPageProps {
  schools: School[];
}

export default function UnitDetailPage({ schools }: UnitDetailPageProps) {
  const { lessonId = "", unitId = "" } = useParams<{ lessonId: UUID; unitId: UUID }>();
  const [unit, setUnit] = useState<UnitResponse | null>(null);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUnit() {
      if (!lessonId || !unitId) {
        setError({ message: "Unit link is missing lesson or unit id." });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedUnit = await unitService.get(lessonId, unitId);
        if (!isMounted) {
          return;
        }

        setUnit(loadedUnit);

        try {
          const selectedSchoolId = window.localStorage.getItem("school-dashboard-selected-school");
          const fallbackSchoolId = schools[0]?.id;
          const schoolId = selectedSchoolId || fallbackSchoolId;
          if (!schoolId) {
            return;
          }
          const detail = await lessonService.get(schoolId, lessonId);
          if (isMounted) {
            setLesson(detail.lesson);
          }
        } catch {
          if (isMounted) {
            setLesson(null);
          }
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

    void loadUnit();

    return () => {
      isMounted = false;
    };
  }, [lessonId, unitId]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className={secondaryButtonClass} to="/backoffice/lessons">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to lessons
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{unit?.title ?? "Unit detail"}</h1>
          {lesson ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="blue">{lesson.title}</Badge>
              <Badge>{lesson.level}</Badge>
              <Badge>{lesson.category}</Badge>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? <LoadingState label="Loading unit" /> : null}
      {error ? <ErrorState error={error} /> : null}

      {!loading && unit ? (
        <Panel className="p-5">
          <div className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{unit.title}</h2>
            {unit.videoUrl ? (
              <a className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300" href={unit.videoUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open video
              </a>
            ) : null}
          </div>
          <RichContent html={unit.content} />
        </Panel>
      ) : null}
    </div>
  );
}
