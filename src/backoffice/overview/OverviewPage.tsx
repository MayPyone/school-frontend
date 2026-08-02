import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, ExternalLink, Plus, School, Users } from "lucide-react";
import { Modal } from "../../components/dashboard/Modal";
import { Field, PageHeader, Panel, StatCard, inputClass, primaryButtonClass, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getStoredUser, toApiError } from "../../services/http";
import { lessonService } from "../../services/lessonService";
import { schoolService } from "../../services/schoolService";
import type { School as SchoolRecord, SchoolRequest } from "../../types/api";

const defaultSchoolForm = {
  schoolName: "",
  schoolEmail: "",
  schoolAddress: "",
  phoneNumbers: "",
  description: "",
  subTitle: "",
};

type SchoolFormState = typeof defaultSchoolForm;

function toSchoolPayload(form: SchoolFormState): Omit<SchoolRequest, "userId"> {
  return {
    schoolName: form.schoolName.trim(),
    schoolEmail: form.schoolEmail.trim() || undefined,
    schoolAddress: form.schoolAddress.split("\n").map((item) => item.trim()).filter(Boolean),
    phoneNumbers: form.phoneNumbers.split(",").map((item) => item.trim()).filter(Boolean),
    description: form.description.trim() || undefined,
    subTitle: form.subTitle.trim() || undefined,
    openingHours: [],
  };
}

interface OverviewPageProps {
  onSchoolsChanged?: () => Promise<SchoolRecord[]>;
}

export default function OverviewPage({ onSchoolsChanged }: OverviewPageProps) {
  const { data, loading, error, reload, setError } = useAsyncData(async () => {
    const schools = await schoolService.list();
    const lessonGroups = await Promise.all(
      schools.map((schoolItem) =>
        lessonService.listBySchool(schoolItem.id).catch(() => [])
      )
    );
    const lessons = lessonGroups.flat();
    return { schools, lessons };
  }, []);
  const [formOpen, setFormOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState(defaultSchoolForm);
  const [submitting, setSubmitting] = useState(false);

  async function createSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = getStoredUser();
      if (!user?.id) {
        throw new Error("A logged-in user is required to create a school.");
      }

      await schoolService.create({ ...toSchoolPayload(schoolForm), userId: user.id });
      setSchoolForm(defaultSchoolForm);
      setFormOpen(false);
      await onSchoolsChanged?.();
      await reload();
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading dashboard overview" />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reload} />;
  }

  const schools = data?.schools ?? [];
  const lessons = data?.lessons ?? [];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Operational summary across schools, lessons, staff, schedules, and activities."
        actions={
          <>
            <button type="button" className={primaryButtonClass} onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add School
            </button>
            <Link className={secondaryButtonClass} to="/backoffice/lessons">Manage lessons</Link>
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Schools</h2>
            <button type="button" className={secondaryButtonClass} onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add School
            </button>
          </div>
          {schools.length ? (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {schools.map((schoolItem) => (
                <div key={schoolItem.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-50" title={schoolItem.schoolName}>{schoolItem.schoolName}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {schoolItem.schoolEmail || schoolItem.subTitle || "No contact details"}
                    </p>
                  </div>
                  <Link
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
                    to={`/${schoolItem.customizeSchoolId || schoolItem.id}`}
                    target="_blank"
                    aria-label={`Open public page for ${schoolItem.schoolName}`}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No schools found.</p>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <button type="button" className={primaryButtonClass} onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add School
            </button>
            <Link className={secondaryButtonClass} to="/backoffice/lessons">Create lessons and units</Link>
            <Link className={secondaryButtonClass} to="/backoffice/schedules">Review class schedules</Link>
            <Link className={secondaryButtonClass} to="/backoffice/activities">Plan activities</Link>
          </div>
        </Panel>
      </div>

      {formOpen ? (
        <Modal title="Add school" onClose={() => setFormOpen(false)}>
          <form onSubmit={(event) => void createSchool(event)} className="grid gap-4">
            <Field label="School Name">
              <input className={inputClass} value={schoolForm.schoolName} onChange={(event) => setSchoolForm({ ...schoolForm, schoolName: event.target.value })} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <input className={inputClass} type="email" value={schoolForm.schoolEmail} onChange={(event) => setSchoolForm({ ...schoolForm, schoolEmail: event.target.value })} />
              </Field>
              <Field label="Phone Numbers">
                <input className={inputClass} value={schoolForm.phoneNumbers} onChange={(event) => setSchoolForm({ ...schoolForm, phoneNumbers: event.target.value })} placeholder="+1-555-0100, +1-555-0101" />
              </Field>
            </div>
            <Field label="Address">
              <textarea className={inputClass} rows={3} value={schoolForm.schoolAddress} onChange={(event) => setSchoolForm({ ...schoolForm, schoolAddress: event.target.value })} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Subtitle">
                <input className={inputClass} value={schoolForm.subTitle} onChange={(event) => setSchoolForm({ ...schoolForm, subTitle: event.target.value })} />
              </Field>
              <Field label="Description">
                <textarea className={inputClass} rows={3} value={schoolForm.description} onChange={(event) => setSchoolForm({ ...schoolForm, description: event.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setFormOpen(false)}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
