import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, School as SchoolIcon } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, Panel, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { toApiError } from "../../services/http";
import { lessonService } from "../../services/lessonService";
import { schoolService } from "../../services/schoolService";
import { unitService } from "../../services/unitService";
import type { ApiError, LessonResponse, School, UnitResponse, UUID } from "../../types/api";

function RichContent({ html }: { html?: string }) {
  if (!html) {
    return <p className="text-sm text-slate-500">No content has been added.</p>;
  }

  return <div className="rich-text-content text-sm text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function PublicUnitDetailPage() {
  const { customizeSchoolId = "", lessonId = "", unitId = "" } = useParams<{ customizeSchoolId: UUID; lessonId: UUID; unitId: UUID }>();
  const [school, setSchool] = useState<School | null>(null);
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [unit, setUnit] = useState<UnitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUnit() {
      if (!customizeSchoolId || !lessonId || !unitId) {
        setError({ message: "Unit link is missing school, lesson, or unit id." });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [loadedSchool, lessonDetail, loadedUnit] = await Promise.all([
          schoolService.get(customizeSchoolId),
          lessonService.get(customizeSchoolId, lessonId),
          unitService.get(lessonId, unitId),
        ]);

        if (!isMounted) {
          return;
        }

        setSchool(loadedSchool);
        setLesson(lessonDetail.lesson);
        setUnit(loadedUnit);
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
  }, [customizeSchoolId, lessonId, unitId]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-600 p-2 text-white">
              <SchoolIcon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">SchoolManager</p>
              <h1 className="text-lg font-semibold">{school?.schoolName ?? "Unit detail"}</h1>
            </div>
          </div>
          <Link className={secondaryButtonClass} to={`/${school?.customizeSchoolId ?? customizeSchoolId}/lessons`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to lessons
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {loading ? <LoadingState label="Loading unit" /> : null}
        {error ? <ErrorState error={error} /> : null}

        {!loading && unit ? (
          <Panel className="p-5">
            <div className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{unit.title}</h2>
              {lesson ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="blue">{lesson.title}</Badge>
                  <Badge>{lesson.level}</Badge>
                  <Badge>{lesson.category}</Badge>
                </div>
              ) : null}
              {unit.videoUrl ? (
                <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300" href={unit.videoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open video
                </a>
              ) : null}
            </div>
            <RichContent html={unit.content} />
          </Panel>
        ) : null}
      </div>
    </main>
  );
}
