import { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, ChevronDown, ChevronRight, Clock, GraduationCap, Mail, MapPin, School as SchoolIcon, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge, Panel, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { lessonService } from "../../services/lessonService";
import { scheduleService } from "../../services/scheduleService";
import { schoolService } from "../../services/schoolService";
import { staffService } from "../../services/staffService";
import { toApiError } from "../../services/http";
import type { ApiError, ClassSchedule, LessonCategory, LessonResponse, LessonUnitResponse, School, StaffMember, UUID } from "../../types/api";

const lessonTabs = ["All", "Basic", "Intermediate", "Advanced"] as const;
type LessonTab = (typeof lessonTabs)[number];
const categoryTabs = ["All", "GENERAL", "GRAMMAR", "VOCAB", "PRACTICE"] as const;
type CategoryTab = "All" | LessonCategory;
const categoryLabels: Record<CategoryTab, string> = {
  All: "All",
  GENERAL: "General",
  GRAMMAR: "Grammar",
  VOCAB: "Vocab",
  PRACTICE: "Practice",
};
type PublicTab = "about" | "lessons" | "schedule" | "staff";
const publicTabs: Array<{ id: PublicTab; label: string }> = [
  { id: "about", label: "About school" },
  { id: "lessons", label: "Lessons" },
  { id: "schedule", label: "Schedule" },
  { id: "staff", label: "Staff" },
];

function RichContent({ html }: { html?: string }) {
  if (!html) {
    return null;
  }

  return <div className="rich-text-content mt-3 text-sm text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: html }} />;
}

function plainTextFromHtml(html?: string) {
  if (!html) {
    return "";
  }

  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function levelTone(level: string) {
  if (level.toLowerCase().includes("basic")) {
    return "green" as const;
  }
  if (level.toLowerCase().includes("intermediate")) {
    return "yellow" as const;
  }
  return "red" as const;
}

export default function PublicSchoolPage() {
  const { customizeSchoolId = "", publicTab = "about" } = useParams<{ customizeSchoolId: string; publicTab: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [lessonDetails, setLessonDetails] = useState<Record<UUID, LessonUnitResponse>>({});
  const [expandedLessonId, setExpandedLessonId] = useState<UUID | null>(null);
  const [activeTab, setActiveTab] = useState<LessonTab>("All");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("All");
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const activePublicTab = publicTabs.some((tab) => tab.id === publicTab) ? (publicTab as PublicTab) : "about";

  useEffect(() => {
    let isMounted = true;

    async function loadSchool() {
      if (!customizeSchoolId) {
        setError({ message: "School link is missing a customized school id." });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const loadedSchool = await schoolService.get(customizeSchoolId);

        if (!isMounted) {
          return;
        }

        setSchool(loadedSchool);
        setLessons([]);
        setSchedules([]);
        setStaff([]);
        setExpandedLessonId(null);
        setLessonDetails({});
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

    void loadSchool();

    return () => {
      isMounted = false;
    };
  }, [customizeSchoolId]);

  useEffect(() => {
    let isMounted = true;

    async function loadTabContent() {
      if (!customizeSchoolId || activePublicTab === "about") {
        return;
      }

      setContentLoading(true);
      setError(null);

      try {
        if (activePublicTab === "lessons") {
          const loadedLessons = await lessonService.listBySchool(customizeSchoolId);
          if (isMounted) {
            setLessons(loadedLessons);
          }
        }

        if (activePublicTab === "schedule") {
          const loadedSchedules = await scheduleService.listBySchool(customizeSchoolId);
          if (isMounted) {
            setSchedules(school?.id ? loadedSchedules.filter((schedule) => schedule.schoolId === school.id) : loadedSchedules);
          }
        }

        if (activePublicTab === "staff") {
          const loadedStaff = await staffService.listBySchool(customizeSchoolId);
          if (isMounted) {
            setStaff(
              loadedStaff.filter((member) => member.status === "ACTIVE" && (!school?.id || member.schoolId === school.id))
            );
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setError(toApiError(requestError));
        }
      } finally {
        if (isMounted) {
          setContentLoading(false);
        }
      }
    }

    void loadTabContent();

    return () => {
      isMounted = false;
    };
  }, [activePublicTab, customizeSchoolId, school?.id]);

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

  const groupedLessons = useMemo(
    () =>
      filteredLessons.reduce<Record<string, LessonResponse[]>>((groups, lesson) => {
        const key = lesson.level || "General";
        return { ...groups, [key]: [...(groups[key] ?? []), lesson] };
      }, {}),
    [filteredLessons]
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

  const publicSchoolPath = school?.customizeSchoolId ? `/${school.customizeSchoolId}` : "";

  async function toggleLesson(lesson: LessonResponse) {
    if (expandedLessonId === lesson.lessonId) {
      setExpandedLessonId(null);
      return;
    }

    setExpandedLessonId(lesson.lessonId);
    if (lessonDetails[lesson.lessonId]) {
      return;
    }

    try {
      const detail = await lessonService.get(school?.customizeSchoolId ?? customizeSchoolId, lesson.lessonId);
      setLessonDetails((current) => ({ ...current, [lesson.lessonId]: detail }));
    } catch (requestError) {
      setError(toApiError(requestError));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            {school?.logoUrl ? (
              <img className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-800" src={school.logoUrl} alt={`${school.schoolName} logo`} />
            ) : (
              <div className="shrink-0 rounded-md bg-blue-600 p-2 text-white">
                <SchoolIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-slate-500 dark:text-slate-400">SchoolManager</p>
              <h1 className="truncate text-base font-semibold sm:text-lg">{school?.schoolName ?? "School lessons"}</h1>
            </div>
          </div>
          <Link className={`${secondaryButtonClass} shrink-0 px-3 sm:px-4`} to="/login">
            Staff login
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loading ? <LoadingState label="Loading school lessons" /> : null}
        {error ? <div className="mb-5"><ErrorState error={error} /></div> : null}

        {!loading && school ? (
          <>
            <section className="mb-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    Public school
                  </div>
                  <h2 className="break-words text-2xl font-semibold tracking-normal sm:text-3xl">{school.schoolName}</h2>
                  {school.subTitle ? <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">{school.subTitle}</p> : null}
                  {school.description ? <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{school.description}</p> : null}
                </div>
                {school.logoUrl ? (
                  <img className="h-20 w-20 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-800 sm:h-24 sm:w-24" src={school.logoUrl} alt={`${school.schoolName} logo`} />
                ) : null}
              </div>
              {school.schoolAddress?.length ? (
                <p className="mt-4 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {school.schoolAddress.join(", ")}
                </p>
              ) : null}
            </section>

            <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div className="flex min-w-max snap-x snap-mandatory gap-2 sm:min-w-0 sm:flex-wrap">
              {publicTabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={`${publicSchoolPath}/${tab.id}`}
                  className={`min-w-[8.5rem] snap-start whitespace-nowrap rounded-md border px-4 py-2 text-center text-sm font-medium transition-colors sm:min-w-0 ${
                    activePublicTab === tab.id
                      ? "border-slate-950 bg-slate-950 text-white dark:border-slate-50 dark:bg-slate-50 dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
              </div>
            </div>

            {contentLoading ? <div className="mb-5"><LoadingState label={`Loading ${activePublicTab}`} /></div> : null}

            {activePublicTab === "about" ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
                <Panel className="p-5">
                  <h3 className="text-lg font-semibold">About school</h3>
                  {school.description ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{school.description}</p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No school description has been added yet.</p>
                  )}
                </Panel>
                <Panel className="p-5">
                  <h3 className="text-lg font-semibold">Contact</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>{school.schoolEmail || "No email configured"}</p>
                    <p>{school.phoneNumbers?.join(", ") || "No phone numbers configured"}</p>
                    <p>{school.schoolAddress?.join(", ") || "No address configured"}</p>
                  </div>
                </Panel>
              </div>
            ) : null}

            {activePublicTab === "schedule" ? (
              !contentLoading && schedules.length === 0 ? (
                <EmptyState title="No schedule" description="No class schedule is available for this school yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                      {schedule.meetingUrl ? (
                        <a className="mt-3 inline-flex max-w-full items-center gap-2 truncate text-sm font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300" href={schedule.meetingUrl} target="_blank" rel="noreferrer">
                          Online meeting
                        </a>
                      ) : null}
                    </Panel>
                  ))}
                </div>
              )
            ) : null}

            {activePublicTab === "staff" ? (
              !contentLoading && staff.length === 0 ? (
                <EmptyState title="No staff listed" description="No staff profiles are available for this school yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {staff.map((member) => (
                    <Panel key={member.id} className="min-h-36 p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <UserRound className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold" title={`${member.firstName} ${member.lastName}`}>
                            {member.firstName} {member.lastName}
                          </h3>
                          <div className="mt-2">
                            <Badge tone={member.role === "ADMIN" ? "blue" : "green"}>{member.role}</Badge>
                          </div>
                          <p className="mt-3 flex items-center gap-2 truncate text-sm text-slate-600 dark:text-slate-400" title={member.email}>
                            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                            {member.email}
                          </p>
                          {member.phone ? <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">{member.phone}</p> : null}
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
              )
            ) : null}

            {activePublicTab === "lessons" ? (
              !contentLoading && lessons.length === 0 ? (
              <EmptyState title="No lessons published" description="This school has not added public lessons yet." />
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                      <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
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
                    </div>
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                      <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
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
                  </div>

                  {filteredLessons.length === 0 ? (
                    <EmptyState title="No lessons match these filters" description="Try another level or category tab." />
                  ) : null}

                  {Object.entries(groupedLessons).map(([level, levelLessons]) => (
                    <section key={level}>
                      <div className="mb-3 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-slate-500" aria-hidden="true" />
                        <h3 className="text-lg font-semibold">{level}</h3>
                      </div>
                      <div className="grid gap-4">
                        {levelLessons.map((lesson) => {
                          const isExpanded = expandedLessonId === lesson.lessonId;
                          const detail = lessonDetails[lesson.lessonId];
                          return (
                            <Panel key={lesson.lessonId} className="p-5">
                              <button
                                type="button"
                                className="flex w-full items-start justify-between gap-4 text-left"
                                onClick={() => void toggleLesson(lesson)}
                              >
                                <div>
                                  <div className="mb-2 flex flex-wrap gap-2">
                                    <Badge tone={levelTone(lesson.level)}>{lesson.level}</Badge>
                                    <Badge tone="blue">{lesson.category}</Badge>
                                  </div>
                                  <h4 className="text-base font-semibold">{lesson.title}</h4>
                                  <RichContent html={lesson.content} />
                                </div>
                                {isExpanded ? <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" /> : <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />}
                              </button>

                              {isExpanded ? (
                                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                                  {!detail ? <p className="text-sm text-slate-500">Loading lesson units...</p> : null}
                                  {detail?.units.length ? (
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                      {detail.units.map((unit, index) => (
                                        <Link
                                          key={unit.id}
                                          className="flex min-h-44 min-w-0 flex-col rounded-md border border-slate-200 p-4 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700"
                                          to={`${publicSchoolPath}/lessons/${lesson.lessonId}/units/${unit.id}`}
                                        >
                                          <p className="text-xs font-semibold uppercase text-slate-500">Unit {index + 1}</p>
                                          <h5 className="mt-1 truncate font-medium text-slate-950 dark:text-slate-50" title={unit.title}>{unit.title}</h5>
                                          <p className="mt-2 line-clamp-3 break-words text-sm text-slate-600 dark:text-slate-400">
                                            {plainTextFromHtml(unit.content) || "No content preview"}
                                          </p>
                                          {unit.videoUrl ? <p className="mt-auto truncate pt-3 text-xs text-blue-700 dark:text-blue-300" title={unit.videoUrl}>{unit.videoUrl}</p> : null}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : null}
                                  {detail && detail.units.length === 0 ? <p className="text-sm text-slate-500">No units have been added to this lesson yet.</p> : null}
                                </div>
                              ) : null}
                            </Panel>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
