import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Eye, ImagePlus, MapPin, Pencil, Trash2, Users, X } from "lucide-react";
import { Modal } from "../../components/dashboard/Modal";
import {
  Field,
  PageHeader,
  Panel,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  dangerButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { RichTextEditor } from "../../components/dashboard/RichTextEditor";
import { useAsyncData } from "../../hooks/useAsyncData";
import { activityService } from "../../services/activityService";
import { schoolService } from "../../services/schoolService";
import { toApiError } from "../../services/http";
import { uploadService } from "../../services/uploadService";
import type { Activity, UUID } from "../../types/api";

const defaultForm = {
  schoolId: "",
  title: "",
  description: "",
  activityDate: "",
  location: "",
  maxParticipants: 20,
  images: [] as string[],
};

export default function ActivityPage() {
  const activitiesState = useAsyncData(() => activityService.list(), []);
  const schoolsState = useAsyncData(() => schoolService.list(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");

  const activities = activitiesState.data ?? [];
  const filteredActivities = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return activities.filter((activity) => {
      if (!activity.activityDate || filter === "ALL") {
        return true;
      }
      if (filter === "UPCOMING") {
        return activity.activityDate >= today;
      }
      return activity.activityDate < today;
    });
  }, [activities, filter]);

  function openCreate() {
    setEditingActivity(null);
    setSelectedActivity(null);
    setForm(defaultForm);
    setSubmitError("");
    setFormOpen(true);
  }

  function openEdit(activity: Activity) {
    setEditingActivity(activity);
    setSelectedActivity(null);
    setForm({
      schoolId: activity.schoolId,
      title: activity.title,
      description: activity.description ?? "",
      activityDate: activity.activityDate ?? "",
      location: activity.location ?? "",
      maxParticipants: activity.maxParticipants ?? 20,
      images: activity.images ?? [],
    });
    setSubmitError("");
    setFormOpen(true);
  }

  function openDetails(activity: Activity) {
    setSelectedActivity(activity);
    setEditingActivity(null);
    setDetailOpen(true);
  }

  async function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const payload = {
        schoolId: form.schoolId,
        title: form.title,
        description: form.description,
        activityDate: form.activityDate,
        location: form.location,
        maxParticipants: form.maxParticipants,
        registeredCount: 0,
        images: form.images,
      };

      if (editingActivity) {
        await activityService.update(editingActivity.id, payload);
      } else {
        await activityService.create(payload);
      }

      setForm(defaultForm);
      setFormOpen(false);
      setEditingActivity(null);
      await activitiesState.reload();
    } catch (requestError) {
      setSubmitError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageChange(file: File | undefined) {
    if (!file) {
      return;
    }

    setSubmitError("");
    setUploadingImage(true);

    try {
      const imageUrl = await uploadService.uploadImage(file, {
        folder: "activities",
        maxWidth: 1600,
        maxHeight: 1000,
      });
      setForm((current) => ({ ...current, images: [imageUrl, ...current.images.filter((item) => item !== imageUrl)] }));
    } catch (requestError) {
      setSubmitError(toApiError(requestError).message);
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function deleteActivity(activity: Activity) {
    const confirmed = window.confirm(`Delete activity "${activity.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await activityService.remove(activity.id);
      if (selectedActivity?.id === activity.id) {
        setDetailOpen(false);
        setSelectedActivity(null);
      }
      await activitiesState.reload();
    } catch (requestError) {
      setSubmitError(toApiError(requestError).message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Activities"
        description="Plan activities, track participant capacity, and manage image gallery data."
        actions={
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Add Activity
          </button>
        }
      />

      {activitiesState.loading ? <LoadingState label="Checking activity endpoints" /> : null}
      {activitiesState.error ? <div className="mb-5"><ErrorState error={activitiesState.error} /></div> : null}

      <Panel className="mb-5 p-4">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "UPCOMING", "PAST"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={filter === option ? primaryButtonClass : secondaryButtonClass}
            >
              {option.toLowerCase()}
            </button>
          ))}
        </div>
      </Panel>

      {!filteredActivities.length ? (
        <EmptyState title="No activities available" description="Add the first activity." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredActivities.map((activity) => {
            const registered = activity.registeredCount ?? 0;
            const capacity = activity.maxParticipants ?? 1;
            const progress = Math.min(100, Math.round((registered / capacity) * 100));
            const image = activity.images?.[0];

            return (
              <Panel key={activity.id} className="overflow-hidden">
                <div className="flex aspect-video items-center justify-center bg-slate-100">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <ImagePlus className="h-10 w-10 text-slate-300" aria-hidden="true" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => openDetails(activity)}
                    >
                      <h2 className="text-lg font-semibold text-slate-950">{activity.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{stripHtml(activity.description) || "No description provided."}</p>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                        onClick={() => openDetails(activity)}
                        aria-label={`View details for ${activity.title}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                        onClick={() => openEdit(activity)}
                        aria-label={`Edit ${activity.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-red-600 hover:bg-red-50"
                        onClick={() => void deleteActivity(activity)}
                        aria-label={`Delete ${activity.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{activity.activityDate || "Date TBD"}</p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {activity.location || "Location TBD"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {registered}/{capacity} participants
                    </p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {formOpen ? (
        <Modal title="Add activity" onClose={() => setFormOpen(false)}>
          <form onSubmit={saveActivity} className="grid gap-4">
            {submitError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}
            <Field label="School">
              <select className={inputClass} value={form.schoolId} onChange={(event) => setForm({ ...form, schoolId: event.target.value })} required>
                <option value="">Select a school</option>
                {(schoolsState.data ?? []).map((school) => <option key={school.id} value={school.id}>{school.schoolName}</option>)}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </Field>
            <Field label="Description">
              <RichTextEditor value={form.description} onChange={(description) => setForm({ ...form, description })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Activity Date">
                <input className={inputClass} type="date" value={form.activityDate} onChange={(event) => setForm({ ...form, activityDate: event.target.value })} />
              </Field>
              <Field label="Max Participants">
                <input className={inputClass} type="number" min={1} value={form.maxParticipants} onChange={(event) => setForm({ ...form, maxParticipants: Number(event.target.value) })} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Location">
                <input className={inputClass} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              </Field>
              <Field label="Activity Image">
                <input
                  className={inputClass}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void handleImageChange(file);
                  }}
                  disabled={uploadingImage}
                />
                {form.images[0] ? (
                  <div className="relative mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <img src={form.images[0]} alt="" className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm hover:bg-white"
                      onClick={() => removeImage(0)}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setFormOpen(false)}>Cancel</button>
              <button type="submit" className={primaryButtonClass} disabled={submitting || uploadingImage}>
                {uploadingImage ? "Uploading..." : submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {detailOpen && selectedActivity ? (
        <Modal
          title={selectedActivity.title}
          onClose={() => {
            setDetailOpen(false);
            setSelectedActivity(null);
          }}
        >
          <div className="grid gap-5">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {selectedActivity.images?.[0] ? (
                <img src={selectedActivity.images[0]} alt="" className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-slate-300">
                  <ImagePlus className="h-12 w-12" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <p><span className="font-medium text-slate-950">School:</span> {schoolNameFor(selectedActivity.schoolId, schoolsState.data ?? [])}</p>
              <p><span className="font-medium text-slate-950">Date:</span> {selectedActivity.activityDate || "TBD"}</p>
              <p><span className="font-medium text-slate-950">Location:</span> {selectedActivity.location || "TBD"}</p>
              <p><span className="font-medium text-slate-950">Capacity:</span> {selectedActivity.registeredCount ?? 0}/{selectedActivity.maxParticipants ?? 1}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-950">Description</h3>
              <div className="rich-text-content mt-2 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: selectedActivity.description || "<p>No description provided.</p>" }} />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  setDetailOpen(false);
                  openEdit(selectedActivity);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                className={dangerButtonClass}
                onClick={() => void deleteActivity(selectedActivity)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function schoolNameFor(schoolId: UUID, schools: { id: UUID; schoolName: string }[]) {
  return schools.find((school) => school.id === schoolId)?.schoolName ?? "Unknown school";
}

function stripHtml(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
