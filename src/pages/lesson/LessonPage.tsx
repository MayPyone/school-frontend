import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, ChevronRight, Edit2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
const lessonTabs = ["All", "Basic", "Intermediate", "Advanced"] as const;
type LessonTab = (typeof lessonTabs)[number];
const categoryTabs = ["All", "GENERAL", "GRAMMAR", "VOCAB", "PRACTICE"] as const;
type CategoryTab = (typeof categoryTabs)[number];
const categoryLabels: Record<CategoryTab, string> = {
  All: "All",
  GENERAL: "General",
  GRAMMAR: "Grammar",
  VOCAB: "Vocab",
  PRACTICE: "Practice",
};

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

function plainTextFromHtml(html: string) {
  if (!html) {
    return "";
  }

  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function levelIdFromLabel(level: string) {
  return levels.find((item) => item.label === level)?.id ?? 1;
}

interface LessonPageProps {
  schools: School[];
  selectedSchoolId: UUID;
}

export default function LessonPage({ schools, selectedSchoolId }: LessonPageProps) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [unitsByLesson, setUnitsByLesson] = useState<Record<UUID, UnitResponse[]>>({});
  const [expandedLessonId, setExpandedLessonId] = useState<UUID | null>(null);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonResponse | null>(null);
  const [unitLessonId, setUnitLessonId] = useState<UUID | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitResponse | null>(null);
  const [lessonForm, setLessonForm] = useState(lessonFormDefaults);
  const [unitForm, setUnitForm] = useState(unitFormDefaults);
  const [activeTab, setActiveTab] = useState<LessonTab>("All");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("All");
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
  const levelFilteredLessons = useMemo(
    () => lessons.filter((lesson) => activeTab === "All" || lesson.level === activeTab),
    [activeTab, lessons]
  );
  const filteredLessons = useMemo(
    () => levelFilteredLessons.filter((lesson) => activeCategory === "All" || lesson.category === activeCategory),
    [activeCategory, levelFilteredLessons]
  );
  const categoryCounts = useMemo(
    () =>
      categoryTabs.reduce<Record<CategoryTab, number>>((counts, category) => {
        return {
          ...counts,
          [category]:
            category === "All"
              ? levelFilteredLessons.length
              : levelFilteredLessons.filter((lesson) => lesson.category === category).length,
        };
      }, {} as Record<CategoryTab, number>),
    [levelFilteredLessons]
  );

  function selectTab(tab: LessonTab) {
    setActiveTab(tab);
    setActiveCategory("All");
    setExpandedLessonId(null);
  }

  function selectCategory(category: CategoryTab) {
    setActiveCategory(category);
    setExpandedLessonId(null);
  }

  function openCreateLesson() {
    setEditingLesson(null);
    setLessonForm(lessonFormDefaults);
    setLessonFormOpen(true);
  }

  function openEditLesson(lesson: LessonResponse) {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      levelId: levelIdFromLabel(lesson.level),
      content: lesson.content,
      category: lesson.category,
    });
    setLessonFormOpen(true);
  }

  function closeLessonForm() {
    setLessonFormOpen(false);
    setEditingLesson(null);
    setLessonForm(lessonFormDefaults);
  }

  function openCreateUnit(lessonId: UUID) {
    setUnitLessonId(lessonId);
    setEditingUnit(null);
    setUnitForm(unitFormDefaults);
  }

  function openEditUnit(lessonId: UUID, unit: UnitResponse) {
    setUnitLessonId(lessonId);
    setEditingUnit(unit);
    setUnitForm({
      title: unit.title,
      content: unit.content,
      videoUrl: unit.videoUrl ?? "",
    });
  }

  function closeUnitForm() {
    setUnitLessonId(null);
    setEditingUnit(null);
    setUnitForm(unitFormDefaults);
  }

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

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingLesson) {
      setSubmitting(true);
      setError("");
      try {
        const updated = await lessonService.update(editingLesson.schoolId, editingLesson.lessonId, lessonForm);
        setLessons((current) => current.map((lesson) => (lesson.lessonId === updated.lessonId ? updated : lesson)));
        closeLessonForm();
      } catch (requestError) {
        setError(toApiError(requestError).message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    await createLesson(event);
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
      closeUnitForm();
      setExpandedLessonId(unitLessonId);
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = getStoredUser();
    if (!user?.id || !unitLessonId) {
      setError("A logged-in user and selected lesson are required to save units.");
      return;
    }

    if (editingUnit) {
      setSubmitting(true);
      setError("");
      try {
        const updated = await unitService.update(unitLessonId, editingUnit.id, {
          ...unitForm,
          lessonId: unitLessonId,
          createdById: editingUnit.createdById ?? user.id,
          id: editingUnit.id,
        });
        setUnitsByLesson((current) => ({
          ...current,
          [unitLessonId]: (current[unitLessonId] ?? []).map((unit) => (unit.id === updated.id ? updated : unit)),
        }));
        closeUnitForm();
        setExpandedLessonId(unitLessonId);
      } catch (requestError) {
        setError(toApiError(requestError).message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    await createUnit(event);
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

  function openUnitDetail(lessonId: UUID, unitId: UUID) {
    navigate(`/lessons/${lessonId}/units/${unitId}`);
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
          <button type="button" className={primaryButtonClass} onClick={openCreateLesson} disabled={!selectedSchoolId}>
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

      {lessons.length ? (
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {lessonTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-slate-950 bg-slate-950 text-white dark:border-slate-50 dark:bg-slate-50 dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                }`}
                onClick={() => selectTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((category) => (
              <button
                key={category}
                type="button"
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "border-blue-700 bg-blue-700 text-white dark:border-blue-300 dark:bg-blue-300 dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                }`}
                onClick={() => selectCategory(category)}
              >
                {categoryLabels[category]} {categoryCounts[category] ?? 0}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && lessons.length > 0 && filteredLessons.length === 0 ? (
        <EmptyState title="No lessons match these filters" description="Try another level or category tab, or add a lesson for this combination." />
      ) : null}

      <div className="space-y-4">
        {filteredLessons.map((lesson) => {
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
                  <button type="button" className={secondaryButtonClass} onClick={() => openEditLesson(lesson)}>
                    <Edit2 className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => openCreateUnit(lesson.lessonId)}>
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
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {units.map((unit) => (
                        <div key={unit.id} className="flex min-h-44 flex-col rounded-md border border-slate-200 bg-white p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => openUnitDetail(lesson.lessonId, unit.id)}
                          >
                            <div className="min-w-0">
                              <h3 className="truncate font-medium text-slate-950" title={unit.title}>{unit.title}</h3>
                              <p className="mt-2 line-clamp-3 break-words text-sm text-slate-600">
                                {plainTextFromHtml(unit.content) || "No content preview"}
                              </p>
                              {unit.videoUrl ? <p className="mt-2 truncate text-xs text-blue-700" title={unit.videoUrl}>{unit.videoUrl}</p> : null}
                            </div>
                          </button>
                          <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                              <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => openEditUnit(lesson.lessonId, unit)} aria-label={`Edit ${unit.title}`}>
                                <Edit2 className="h-4 w-4" aria-hidden="true" />
                              </button>
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
        <Modal title={editingLesson ? "Edit lesson" : "Add lesson"} onClose={closeLessonForm}>
          <form onSubmit={(event) => void saveLesson(event)} className="grid gap-4">
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
              <button type="button" className={secondaryButtonClass} onClick={closeLessonForm}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting}>{submitting ? "Saving..." : editingLesson ? "Update lesson" : "Save lesson"}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {unitLessonId ? (
        <Modal title={editingUnit ? "Edit unit" : "Add unit"} onClose={closeUnitForm}>
          <form onSubmit={(event) => void saveUnit(event)} className="grid gap-4">
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
              <button type="button" className={secondaryButtonClass} onClick={closeUnitForm}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting}>{submitting ? "Saving..." : editingUnit ? "Update unit" : "Save unit"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
