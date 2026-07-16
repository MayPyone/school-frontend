import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, Copy, ExternalLink, ImagePlus, RefreshCcw, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Field,
  PageHeader,
  Panel,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState } from "../../components/dashboard/StatusViews";
import { toApiError } from "../../services/http";
import { schoolService } from "../../services/schoolService";
import { uploadService } from "../../services/uploadService";
import type { ApiError, School, SchoolUpdate, UUID } from "../../types/api";

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
  const [submitting, setSubmitting] = useState(false);
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
          <button type="button" className={secondaryButtonClass} onClick={() => void loadSchools()}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {!selectedSchool ? (
        <EmptyState title="No active school" description="Create or select a school before editing school info." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Panel className="p-5">
            {error ? <div className="mb-5"><ErrorState error={error} /></div> : null}
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
                <Field label="Logo">
                  <div className="flex items-center gap-3">
                    <label className={`${secondaryButtonClass} cursor-pointer`}>
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
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
                        onClick={() => setForm((current) => ({ ...current, logoUrl: "" }))}
                        aria-label="Remove logo"
                        title="Remove logo"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {form.logoUrl ? (
                    <div className="mt-3 flex items-center gap-3">
                      <img className="h-14 w-14 rounded-md border border-slate-200 object-cover dark:border-slate-800" src={form.logoUrl} alt="Selected school logo" />
                      <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">{form.logoUrl}</p>
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
              <div className="flex justify-end">
                <button type="submit" className={primaryButtonClass} disabled={submitting || uploadingLogo}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {uploadingLogo ? "Uploading..." : submitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">Share link</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Public landing page for this school.</p>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
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
    </div>
  );
}
