import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/dashboard/Modal";
import { RichTextEditor } from "../../components/dashboard/RichTextEditor";
import {
  Badge,
  Field,
  PageHeader,
  Panel,
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { getStoredUser, toApiError } from "../../services/http";
import { lessonService } from "../../services/lessonService";
import { unitService } from "../../services/unitService";
import type { LessonCategory, LessonResponse, School, UnitResponse, UUID } from "../../types/api";

const categories: LessonCategory[] = ["GRAMMAR", "VOCAB", "PRACTICE", "GENERAL"];
const levels = [
  { id: 1, label: "Basic" },
  { id: 2, label: "Intermediate" },
  { id: 3, label: "Advanced" },
];

const lessonFormDefaults = {
  title: "",
  levelId: 1,
  content: "",
  category: "GENERAL" as LessonCategory,
};

const unitFormDefaults = {
  title: "",
  content: "",
  videoUrl: "",
};

function levelTone(level: string) {
  if (level.toLowerCase().includes("basic")) {
    return "green" as const;
  }
  if (level.toLowerCase().includes("intermediate")) {
    return "yellow" as const;
  }
  return "red" as const;
}

function RichContent({ html }: { html: string }) {
  if (!html) {
    return null;
  }

  return <div className="rich-text-content mt-2 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: html }} />;
}

interface LessonPageProps {
  schools: School[];
  selectedSchoolId: UUID;
}

export default function LessonPage({ schools, selectedSchoolId }: LessonPageProps) {
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [unitsByLesson, setUnitsByLesson] = useState<Record<UUID, UnitResponse[]>>({});
  const [expandedLessonId, setExpandedLessonId] = useState<UUID | null>(null);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [unitLessonId, setUnitLessonId] = useState<UUID | null>(null);
  const [lessonForm, setLessonForm] = useState(lessonFormDefaults);
  const [unitForm, setUnitForm] = useState(unitFormDefaults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setExpandedLessonId(null);
    setUnitsByLesson({});

    if (!selectedSchoolId) {
      setLessons([]);
      return;
    }

    async function loadLessons() {
      setLoading(true);
      setError("");
      try {
        setLessons(await lessonService.listBySchool(selectedSchoolId));
      } catch (requestError) {
        setError(toApiError(requestError).message);
      } finally {
        setLoading(false);
      }
    }

    void loadLessons();
  }, [selectedSchoolId]);

  const currentSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );

  async function toggleUnits(lessonId: UUID) {
    if (expandedLessonId === lessonId) {
      setExpandedLessonId(null);
      return;
    }

    setExpandedLessonId(lessonId);
    if (unitsByLesson[lessonId]) {
      return;
    }

    try {
      const units = await unitService.listByLesson(lessonId);
      setUnitsByLesson((current) => ({ ...current, [lessonId]: units }));
    } catch (requestError) {
      setError(toApiError(requestError).message);
    }
  }

  async function createLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = getStoredUser();
    if (!user?.id || !selectedSchoolId) {
      setError("A logged-in user and selected school are required to create lessons.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const created = await lessonService.create(selectedSchoolId, {
        ...lessonForm,
        schoolId: selectedSchoolId,
        userId: user.id,
      });
      setLessons([created, ...lessons]);
      setLessonForm(lessonFormDefaults);
      setLessonFormOpen(false);
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = getStoredUser();
    if (!user?.id || !unitLessonId) {
      setError("A logged-in user and selected lesson are required to create units.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const created = await unitService.create(unitLessonId, { ...unitForm, lessonId: unitLessonId, createdById: user.id });
      setUnitsByLesson((current) => ({ ...current, [unitLessonId]: [created, ...(current[unitLessonId] ?? [])] }));
      setUnitForm(unitFormDefaults);
      setUnitLessonId(null);
      setExpandedLessonId(unitLessonId);
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteLesson(lesson: LessonResponse) {
    if (!window.confirm(`Delete lesson "${lesson.title}" and its units?`)) {
      return;
    }

    try {
      await lessonService.remove(lesson.schoolId, lesson.lessonId);
      setLessons(lessons.filter((item) => item.lessonId !== lesson.lessonId));
    } catch (requestError) {
      setError(toApiError(requestError).message);
    }
  }

  async function deleteUnit(lessonId: UUID, unit: UnitResponse) {
    if (!window.confirm(`Delete unit "${unit.title}"?`)) {
      return;
    }

    try {
      await unitService.remove(lessonId, unit.id);
      setUnitsByLesson((current) => ({
        ...current,
        [lessonId]: (current[lessonId] ?? []).filter((item) => item.id !== unit.id),
      }));
    } catch (requestError) {
      setError(toApiError(requestError).message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Lessons"
        description={
          currentSchool
            ? `Create lessons and manage units for ${currentSchool.schoolName}. Switch schools from the sidebar.`
            : "Select or create a school before adding lessons."
        }
        actions={
          <button type="button" className={primaryButtonClass} onClick={() => setLessonFormOpen(true)} disabled={!selectedSchoolId}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Lesson
          </button>
        }
      />

      {loading ? <LoadingState label="Loading lessons" /> : null}
      {error ? <div className="mb-5"><ErrorState error={{ message: error }} /></div> : null}
      {!loading && !lessons.length ? (
        <EmptyState title="No lessons found" description={currentSchool ? `Create the first lesson for ${currentSchool.schoolName}.` : "Create a school before adding lessons."} />
      ) : null}

      <div className="space-y-4">
        {lessons.map((lesson) => {
          const expanded = expandedLessonId === lesson.lessonId;
          const units = unitsByLesson[lesson.lessonId] ?? [];

          return (
            <Panel key={lesson.lessonId} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <button type="button" className="mt-1 rounded-md p-1 text-slate-500 hover:bg-slate-100" onClick={() => void toggleUnits(lesson.lessonId)} aria-label={`Toggle units for ${lesson.title}`}>
                    {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950">{lesson.title}</h2>
                      <Badge tone={levelTone(lesson.level)}>{lesson.level}</Badge>
                      <Badge tone="blue">{lesson.category}</Badge>
                    </div>
                    <RichContent html={lesson.content} />
                    <p className="mt-2 text-xs text-slate-500">Created by {lesson.createdBy || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={secondaryButtonClass} onClick={() => setUnitLessonId(lesson.lessonId)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Unit
                  </button>
                  <button type="button" className={dangerButtonClass} onClick={() => void deleteLesson(lesson)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>

              {expanded ? (
                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  {units.length ? (
                    <div className="grid gap-3">
                      {units.map((unit) => (
                        <div key={unit.id} className="rounded-md border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-medium text-slate-950">{unit.title}</h3>
                              <RichContent html={unit.content} />
                              {unit.videoUrl ? <p className="mt-2 text-xs text-blue-700">{unit.videoUrl}</p> : null}
                            </div>
                            <button type="button" className="rounded-md p-2 text-red-600 hover:bg-red-50" onClick={() => void deleteUnit(lesson.lessonId, unit)} aria-label={`Delete ${unit.title}`}>
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No units yet" description="Add units to break this lesson into teachable sections." />
                  )}
                </div>
              ) : null}
            </Panel>
          );
        })}
      </div>

      {lessonFormOpen ? (
        <Modal title="Add lesson" onClose={() => setLessonFormOpen(false)}>
          <form onSubmit={(event) => void createLesson(event)} className="grid gap-4">
            <Field label="School">
              <div className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="block truncate" title={currentSchool?.schoolName ?? ""}>
                  {currentSchool?.schoolName ?? "Select a school from the sidebar"}
                </span>
              </div>
            </Field>
            <Field label="Title">
              <input className={inputClass} value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Level">
                <select className={inputClass} value={lessonForm.levelId} onChange={(event) => setLessonForm({ ...lessonForm, levelId: Number(event.target.value) })}>
                  {levels.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className={inputClass} value={lessonForm.category} onChange={(event) => setLessonForm({ ...lessonForm, category: event.target.value as LessonCategory })}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Content">
              <RichTextEditor value={lessonForm.content} onChange={(content) => setLessonForm({ ...lessonForm, content })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setLessonFormOpen(false)}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting}>{submitting ? "Saving..." : "Save lesson"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {unitLessonId ? (
        <Modal title="Add unit" onClose={() => setUnitLessonId(null)}>
          <form onSubmit={(event) => void createUnit(event)} className="grid gap-4">
            <Field label="Title">
              <input className={inputClass} value={unitForm.title} onChange={(event) => setUnitForm({ ...unitForm, title: event.target.value })} required />
            </Field>
            <Field label="Content">
              <RichTextEditor value={unitForm.content} onChange={(content) => setUnitForm({ ...unitForm, content })} />
            </Field>
            <Field label="Video URL">
              <input className={inputClass} value={unitForm.videoUrl} onChange={(event) => setUnitForm({ ...unitForm, videoUrl: event.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setUnitLessonId(null)}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting}>{submitting ? "Saving..." : "Save unit"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
