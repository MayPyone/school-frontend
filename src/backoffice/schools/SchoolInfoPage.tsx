import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, Copy, Download, ExternalLink, ImagePlus, Plus, RefreshCcw, Save, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Modal } from "../../components/dashboard/Modal";
import {
  Field,
  PageHeader,
  Panel,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState } from "../../components/dashboard/StatusViews";
import { getStoredUser, toApiError } from "../../services/http";
import { schoolService } from "../../services/schoolService";
import { uploadService } from "../../services/uploadService";
import type { ApiError, School, SchoolRequest, SchoolUpdate, UUID } from "../../types/api";

const defaultForm = {
  schoolName: "",
  schoolEmail: "",
  schoolAddress: "",
  logoUrl: "",
  phoneNumbers: "",
  description: "",
  subTitle: "",
  customizeSchoolId: "",
};

type SchoolInfoForm = typeof defaultForm;

function toForm(school: School): SchoolInfoForm {
  return {
    schoolName: school.schoolName ?? "",
    schoolEmail: school.schoolEmail ?? "",
    schoolAddress: school.schoolAddress?.join("\n") ?? "",
    logoUrl: school.logoUrl ?? "",
    phoneNumbers: school.phoneNumbers?.join(", ") ?? "",
    description: school.description ?? "",
    subTitle: school.subTitle ?? "",
    customizeSchoolId: school.customizeSchoolId ?? "",
  };
}

function toPayload(form: SchoolInfoForm): SchoolUpdate {
  return {
    schoolName: form.schoolName.trim(),
    schoolEmail: form.schoolEmail.trim() || undefined,
    schoolAddress: form.schoolAddress.split("\n").map((item) => item.trim()).filter(Boolean),
    logoUrl: form.logoUrl.trim(),
    phoneNumbers: form.phoneNumbers.split(",").map((item) => item.trim()).filter(Boolean),
    description: form.description.trim() || undefined,
    subTitle: form.subTitle.trim() || undefined,
    customizeSchoolId: form.customizeSchoolId.trim() || undefined,
    openingHours: [],
  };
}

function toCreatePayload(form: SchoolInfoForm): Omit<SchoolRequest, "userId"> {
  return {
    schoolName: form.schoolName.trim(),
    schoolEmail: form.schoolEmail.trim() || undefined,
    schoolAddress: form.schoolAddress.split("\n").map((item) => item.trim()).filter(Boolean),
    logoUrl: form.logoUrl.trim() || undefined,
    phoneNumbers: form.phoneNumbers.split(",").map((item) => item.trim()).filter(Boolean),
    description: form.description.trim() || undefined,
    subTitle: form.subTitle.trim() || undefined,
    customizeSchoolId: form.customizeSchoolId.trim() || undefined,
    openingHours: [],
  };
}

function exportFilename(school: School) {
  const slug = (school.customizeSchoolId || school.schoolName || "school")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "school"}-data.zip`;
}

interface SchoolInfoPageProps {
  schools: School[];
  selectedSchoolId: UUID;
  loadSchools: () => Promise<School[]>;
}

export default function SchoolInfoPage({ schools, selectedSchoolId, loadSchools }: SchoolInfoPageProps) {
  const selectedSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId) ?? null,
    [schools, selectedSchoolId]
  );
  const [form, setForm] = useState(defaultForm);
  const [createForm, setCreateForm] = useState(defaultForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(selectedSchool ? toForm(selectedSchool) : defaultForm);
    setError(null);
    setCopied(false);
  }, [selectedSchool]);

  const sharePath = selectedSchool?.customizeSchoolId ? `/${selectedSchool.customizeSchoolId}` : "";
  const shareUrl = selectedSchool ? `${window.location.origin}${sharePath}` : "";
  const canImportExport = getStoredUser()?.role === "SUPER_ADMIN";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSchool) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await schoolService.update(selectedSchool.id, toPayload(form));
      await loadSchools();
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const user = getStoredUser();
      if (!user?.id) {
        throw new Error("A logged-in user is required to create a school.");
      }

      await schoolService.create({ ...toCreatePayload(createForm), userId: user.id });
      setCreateForm(defaultForm);
      setCreateOpen(false);
      await loadSchools();
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setCreating(false);
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    setImporting(true);
    setError(null);

    try {
      if (!selectedSchool) {
        throw new Error("Select a school before importing. Import overwrites the current school.");
      }

      await schoolService.importData(selectedSchool.id, file);
      await loadSchools();
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setImporting(false);
    }
  }

  function handleExport() {
    if (!selectedSchool) {
      return;
    }

    schoolService.exportData(selectedSchool.id)
      .then((archive) => {
        const url = URL.createObjectURL(archive);
        const link = document.createElement("a");
        link.href = url;
        link.download = exportFilename(selectedSchool);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      })
      .catch((requestError) => setError(toApiError(requestError)));
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file || !selectedSchool) {
      return;
    }

    setError(null);
    setUploadingLogo(true);

    try {
      const logoUrl = await uploadService.uploadImage(file, {
        folder: "school-logos",
        schoolId: selectedSchool.id,
        maxWidth: 800,
        maxHeight: 800,
        maxSizeBytes: 300 * 1024,
      });
      setForm((current) => ({ ...current, logoUrl }));
    } catch (requestError) {
      setError(toApiError(requestError));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function copyShareLink() {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      <PageHeader
        title="School Info"
        description="Update the selected school's public profile and share its landing page."
        actions={
          <>
            <button type="button" className={primaryButtonClass} onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create
            </button>
            {canImportExport ? (
              <>
                <label className={`${secondaryButtonClass} cursor-pointer`}>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  {importing ? "Importing..." : "Import"}
                  <input
                    className="sr-only"
                    type="file"
                    accept=".zip,.json,application/zip,application/json"
                    onChange={(event) => void handleImport(event.target.files?.[0])}
                    disabled={importing || !selectedSchool}
                  />
                </label>
                <button type="button" className={secondaryButtonClass} onClick={handleExport} disabled={!selectedSchool}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export
                </button>
              </>
            ) : null}
            <button type="button" className={secondaryButtonClass} onClick={() => void loadSchools()}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </>
        }
      />

      {!selectedSchool ? (
        <EmptyState title="No active school" description="Create or select a school before editing school info." />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel className="p-4 sm:p-5">
            {error ? <div className="mb-5"><ErrorState error={error} /></div> : null}
            <form onSubmit={(event) => void handleSubmit(event)} className="grid max-w-3xl gap-4">
              <Field label="School Name">
                <input className={inputClass} value={form.schoolName} onChange={(event) => setForm({ ...form, schoolName: event.target.value })} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input className={inputClass} type="email" value={form.schoolEmail} onChange={(event) => setForm({ ...form, schoolEmail: event.target.value })} />
                </Field>
                <Field label="Phone Numbers">
                  <input className={inputClass} value={form.phoneNumbers} onChange={(event) => setForm({ ...form, phoneNumbers: event.target.value })} placeholder="+1-555-0100, +1-555-0101" />
                </Field>
              </div>
              <Field label="Address">
                <textarea className={inputClass} rows={6} value={form.schoolAddress} onChange={(event) => setForm({ ...form, schoolAddress: event.target.value })} required />
              </Field>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field label="Logo">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label className={`${secondaryButtonClass} w-full cursor-pointer sm:w-auto`}>
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      {form.logoUrl ? "Replace logo" : "Upload logo"}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleLogoChange(event.target.files?.[0])}
                        disabled={uploadingLogo}
                      />
                    </label>
                    {form.logoUrl ? (
                      <button
                        type="button"
                        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50 sm:w-10"
                        onClick={() => setForm((current) => ({ ...current, logoUrl: "" }))}
                        aria-label="Remove logo"
                        title="Remove logo"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {form.logoUrl ? (
                    <div className="mt-3 flex min-w-0 items-center gap-3">
                      <img className="h-14 w-14 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-800" src={form.logoUrl} alt="Selected school logo" />
                      {/* <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">{form.logoUrl}</p> */}
                    </div>
                  ) : null}
                </Field>
                <Field label="Subtitle">
                  <input className={inputClass} value={form.subTitle} onChange={(event) => setForm({ ...form, subTitle: event.target.value })} />
                </Field>
              </div>
              <Field label="Customize School ID">
                <input
                  className={inputClass}
                  value={form.customizeSchoolId}
                  onChange={(event) => setForm({ ...form, customizeSchoolId: event.target.value })}
                  placeholder="my-school"
                  required
                />
              </Field>
              <Field label="Description">
                <textarea className={inputClass} rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </Field>
              <div className="flex justify-start sm:justify-end">
                <button type="submit" className={`${primaryButtonClass} w-full max-w-xs sm:w-auto`} disabled={submitting || uploadingLogo}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {uploadingLogo ? "Uploading..." : submitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel className="p-5 xl:sticky xl:top-6 xl:self-start">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Share link</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Public landing page for this school.</p>
            <div className="mt-4 flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
              <p className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200" title={shareUrl}>
                {shareUrl}
              </p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-50"
                onClick={() => void copyShareLink()}
                aria-label="Copy share link"
                title="Copy share link"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <Link className={`mt-4 w-full ${secondaryButtonClass}`} to={sharePath || "#"} target="_blank" aria-disabled={!sharePath}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Open public page
            </Link>
          </Panel>
        </div>
      )}

      {createOpen ? (
        <Modal title="Create school" onClose={() => setCreateOpen(false)}>
          <form onSubmit={(event) => void handleCreate(event)} className="grid gap-4">
            <Field label="School Name">
              <input className={inputClass} value={createForm.schoolName} onChange={(event) => setCreateForm({ ...createForm, schoolName: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input className={inputClass} type="email" value={createForm.schoolEmail} onChange={(event) => setCreateForm({ ...createForm, schoolEmail: event.target.value })} />
              </Field>
              <Field label="Phone Numbers">
                <input className={inputClass} value={createForm.phoneNumbers} onChange={(event) => setCreateForm({ ...createForm, phoneNumbers: event.target.value })} placeholder="+1-555-0100, +1-555-0101" />
              </Field>
            </div>
            <Field label="Address">
              <textarea className={inputClass} rows={3} value={createForm.schoolAddress} onChange={(event) => setCreateForm({ ...createForm, schoolAddress: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subtitle">
                <input className={inputClass} value={createForm.subTitle} onChange={(event) => setCreateForm({ ...createForm, subTitle: event.target.value })} />
              </Field>
              <Field label="Customize School ID">
                <input className={inputClass} value={createForm.customizeSchoolId} onChange={(event) => setCreateForm({ ...createForm, customizeSchoolId: event.target.value })} placeholder="my-school" required />
              </Field>
            </div>
            <Field label="Description">
              <textarea className={inputClass} rows={4} value={createForm.description} onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
