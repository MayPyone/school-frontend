import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Edit2, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Modal } from "../../components/dashboard/Modal";
import {
  Field,
  PageHeader,
  Panel,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getStoredUser, toApiError } from "../../services/http";
import { schoolService } from "../../services/schoolService";
import { uploadService } from "../../services/uploadService";
import type { School, SchoolRequest } from "../../types/api";

const defaultForm = {
  schoolName: "",
  schoolEmail: "",
  schoolAddress: "",
  logoUrl: "",
  phoneNumbers: "",
  description: "",
  subTitle: "",
};

type SchoolFormState = typeof defaultForm;

function toForm(school: School): SchoolFormState {
  return {
    schoolName: school.schoolName ?? "",
    schoolEmail: school.schoolEmail ?? "",
    schoolAddress: school.schoolAddress?.join("\n") ?? "",
    logoUrl: school.logoUrl ?? "",
    phoneNumbers: school.phoneNumbers?.join(", ") ?? "",
    description: school.description ?? "",
    subTitle: school.subTitle ?? "",
  };
}

function toPayload(form: SchoolFormState): Omit<SchoolRequest, "userId"> {
  return {
    schoolName: form.schoolName.trim(),
    schoolEmail: form.schoolEmail.trim() || undefined,
    schoolAddress: form.schoolAddress.split("\n").map((item) => item.trim()).filter(Boolean),
    logoUrl: form.logoUrl.trim() || undefined,
    phoneNumbers: form.phoneNumbers.split(",").map((item) => item.trim()).filter(Boolean),
    description: form.description.trim() || undefined,
    subTitle: form.subTitle.trim() || undefined,
    openingHours: [],
  };
}

interface SchoolsPageProps {
  loadSchools?: () => Promise<School[]>;
}

export default function SchoolsPage({ loadSchools = schoolService.list }: SchoolsPageProps) {
  const { data, loading, error, reload, setData, setError } = useAsyncData(() => loadSchools(), [loadSchools]);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pendingUploadedLogos, setPendingUploadedLogos] = useState<string[]>([]);

  const schools = data ?? [];
  const filteredSchools = useMemo(
    () =>
      schools.filter((school) => {
        const searchable = `${school.schoolName} ${school.schoolEmail ?? ""} ${school.schoolAddress?.join(" ") ?? ""}`.toLowerCase();
        return searchable.includes(query.toLowerCase());
      }),
    [query, schools]
  );

  function openCreate() {
    setEditingSchool(null);
    setForm(defaultForm);
    setPendingUploadedLogos([]);
    setFormOpen(true);
  }

  function openEdit(school: School) {
    setEditingSchool(school);
    setForm(toForm(school));
    setPendingUploadedLogos([]);
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = toPayload(form);
      if (editingSchool) {
        await schoolService.update(editingSchool.id, payload);
      } else {
        const user = getStoredUser();
        if (!user?.id) {
          throw new Error("A logged-in user is required to create a school.");
        }
        await schoolService.create({ ...payload, userId: user.id });
      }
      setData(await loadSchools());
      setEditingSchool(null);
      setForm(defaultForm);
      setPendingUploadedLogos([]);
      setFormOpen(false);
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(school: School) {
    const confirmed = window.confirm(`Delete ${school.schoolName}? This can cascade to lessons and related records.`);
    if (!confirmed) {
      return;
    }

    try {
      await schoolService.remove(school.id);
      setData(await loadSchools());
    } catch (requestError) {
      setError(toApiError(requestError));
    }
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) {
      return;
    }

    setError(null);
    setUploadingLogo(true);

    try {
      const logoUrl = await uploadService.uploadImage(file, {
        folder: "school-logos",
        schoolId: editingSchool?.id,
        maxWidth: 800,
        maxHeight: 800,
        maxSizeBytes: 300 * 1024,
      });
      setPendingUploadedLogos((current) => [logoUrl, ...current]);
      setForm((current) => ({ ...current, logoUrl }));
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function closeForm() {
    const logosToDelete = pendingUploadedLogos;
    setEditingSchool(null);
    setForm(defaultForm);
    setPendingUploadedLogos([]);
    setFormOpen(false);

    const cleanupResults = await Promise.allSettled(logosToDelete.map((logoUrl) => uploadService.deleteImage(logoUrl)));
    const failedCleanup = cleanupResults.find((result) => result.status === "rejected");
    if (failedCleanup) {
      setError({ message: "The form was closed, but one uploaded logo could not be deleted from storage." });
    }
  }

  return (
    <div>
      <PageHeader
        title="Schools"
        description="Create and maintain school profiles, contact details, addresses, and opening-hours-ready data."
        actions={
          <>
            <button type="button" className={secondaryButtonClass} onClick={reload}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
            <button type="button" className={primaryButtonClass} onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add School
            </button>
          </>
        }
      />

      <Panel className="mb-5 p-4">
        <input
          className={inputClass}
          placeholder="Search by name, email, or address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search schools"
        />
      </Panel>

      {loading ? <LoadingState label="Loading schools" /> : null}
      {error ? <div className="mb-5"><ErrorState error={error} onRetry={reload} /></div> : null}
      {!loading && !filteredSchools.length ? (
        <EmptyState title="No schools found" description="Add a school to start connecting lessons, staff, schedules, and activities." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredSchools.map((school) => (
          <Panel key={school.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{school.schoolName}</h2>
                <p className="mt-1 text-sm text-slate-500">{school.subTitle || "No subtitle"}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => openEdit(school)} aria-label={`Edit ${school.schoolName}`}>
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" className="rounded-md p-2 text-red-600 hover:bg-red-50" onClick={() => void handleDelete(school)} aria-label={`Delete ${school.schoolName}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>{school.schoolEmail || "No email configured"}</p>
              <p>{school.phoneNumbers?.join(", ") || "No phone numbers"}</p>
              <p>{school.schoolAddress?.join(", ") || "No address"}</p>
            </div>
            {school.description ? <p className="mt-4 text-sm text-slate-700">{school.description}</p> : null}
          </Panel>
        ))}
      </div>

      {formOpen ? (
        <Modal title={editingSchool ? "Edit school" : "Add school"} onClose={() => void closeForm()}>
          <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
            <Field label="School Name">
              <input className={inputClass} value={form.schoolName} onChange={(event) => setForm({ ...form, schoolName: event.target.value })} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <input className={inputClass} type="email" value={form.schoolEmail} onChange={(event) => setForm({ ...form, schoolEmail: event.target.value })} />
              </Field>
              <Field label="Phone Numbers">
                <input className={inputClass} value={form.phoneNumbers} onChange={(event) => setForm({ ...form, phoneNumbers: event.target.value })} placeholder="+1-555-0100, +1-555-0101" />
              </Field>
            </div>
            <Field label="Address">
              <textarea className={inputClass} rows={3} value={form.schoolAddress} onChange={(event) => setForm({ ...form, schoolAddress: event.target.value })} required />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Logo URL">
                <input
                  className={inputClass}
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoChange(event.target.files?.[0])}
                  disabled={uploadingLogo}
                />
                {form.logoUrl ? <p className="mt-2 truncate text-xs text-slate-500">{form.logoUrl}</p> : null}
              </Field>
              <Field label="Subtitle">
                <input className={inputClass} value={form.subTitle} onChange={(event) => setForm({ ...form, subTitle: event.target.value })} />
              </Field>
            </div>
            <Field label="Description">
              <textarea className={inputClass} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Opening hours are represented in the DTO but are not persisted by the current backend service yet.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => void closeForm()}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting || uploadingLogo}>
                {uploadingLogo ? "Uploading..." : submitting ? "Saving..." : "Save school"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
