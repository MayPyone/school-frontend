import { useState } from "react";
import type { FormEvent } from "react";
import { CalendarPlus } from "lucide-react";
import { Modal } from "../../components/dashboard/Modal";
import {
  Badge,
  Field,
  PageHeader,
  Panel,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { useAsyncData } from "../../hooks/useAsyncData";
import { scheduleService } from "../../services/scheduleService";
import { schoolService } from "../../services/schoolService";
import { userService } from "../../services/userService";
import { toApiError } from "../../services/http";
import type { DayOfWeek, ScheduleMode, UUID } from "../../types/api";

const days: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const defaultForm = {
  schoolId: "",
  dayOfWeek: "MONDAY" as DayOfWeek,
  startTime: "09:00",
  endTime: "10:00",
  mode: "ONSITE" as ScheduleMode,
  teacherId: "",
  location: "",
  meetingUrl: "",
};

interface SchedulePageProps {
  selectedSchoolId: UUID;
}

export default function SchedulePage({ selectedSchoolId }: SchedulePageProps) {
  const schedulesState = useAsyncData(() => scheduleService.list(selectedSchoolId || undefined), [selectedSchoolId]);
  const schoolsState = useAsyncData(() => schoolService.list(), []);
  const teachersState = useAsyncData(() => userService.list("TEACHER"), []);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...defaultForm, schoolId: selectedSchoolId });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const schedules = schedulesState.data ?? [];

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      await scheduleService.create({
        schoolId: form.schoolId,
        teacherId: form.teacherId || undefined,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        mode: form.mode,
        location: form.mode === "ONSITE" ? form.location : "",
        meetingUrl: form.mode === "ONLINE" ? form.meetingUrl : "",
      });
      setForm({ ...defaultForm, schoolId: form.schoolId || selectedSchoolId });
      setFormOpen(false);
      await schedulesState.reload();
    } catch (requestError) {
      setSubmitError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Class Schedules"
        description="Plan weekly online and onsite class blocks."
        actions={
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setForm({ ...defaultForm, schoolId: selectedSchoolId });
              setFormOpen(true);
            }}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Add Schedule
          </button>
        }
      />

      {schedulesState.loading ? <LoadingState label="Checking schedule endpoints" /> : null}
      {schedulesState.error ? <div className="mb-5"><ErrorState error={schedulesState.error} /></div> : null}

      <div className="flex flex-col gap-4">
        {days.map((day) => {
          const daySchedules = schedules.filter((schedule) => schedule.dayOfWeek === day);
          return (
            <Panel key={day} className="min-w-64 flex-1 basis-72 p-4">
              <h2 className="text-sm font-semibold text-slate-950">{day.slice(0, 3)}</h2>
              <div className="mt-3 space-y-3 flex flex-wrap gap-4">
                {daySchedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-950">{schedule.startTime} - {schedule.endTime}</span>
                      <Badge tone={schedule.mode === "ONLINE" ? "blue" : "green"}>{schedule.mode}</Badge>
                    </div>
                    <p className="mt-2 text-slate-600">{schedule.teacherName || "Teacher TBD"}</p>
                    <p className="text-xs text-slate-500">
                      {(schoolsState.data ?? []).find((school) => school.id === schedule.schoolId)?.schoolName ?? "School"}
                    </p>
                    <p className="text-xs text-slate-500">{schedule.mode === "ONLINE" ? schedule.meetingUrl || "Meeting URL TBD" : schedule.location || "Room TBD"}</p>
                  </div>
                ))}
                {!daySchedules.length ? <p className="text-xs text-slate-400">No classes</p> : null}
              </div>
            </Panel>
          );
        })}
      </div>

      {!schedules.length && !schedulesState.loading ? (
        <div className="mt-5">
          <EmptyState title="No schedules available" description="Add the first class schedule." />
        </div>
      ) : null}

      {formOpen ? (
        <Modal title="Add schedule" onClose={() => setFormOpen(false)}>
          <form onSubmit={handleCreate} className="grid gap-4">
            {submitError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}
            <Field label="School">
              <select className={inputClass} value={form.schoolId} onChange={(event) => setForm({ ...form, schoolId: event.target.value })} required>
                <option value="">Select a school</option>
                {(schoolsState.data ?? []).map((school) => <option key={school.id} value={school.id}>{school.schoolName}</option>)}
              </select>
            </Field>
            <Field label="Teacher">
              <select className={inputClass} value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}>
                <option value="">Teacher TBD</option>
                {(teachersState.data ?? []).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Day">
                <select className={inputClass} value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value as DayOfWeek })}>
                  {days.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </Field>
              <Field label="Start Time">
                <input className={inputClass} type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
              </Field>
              <Field label="End Time">
                <input className={inputClass} type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              <Field label="Mode">
                <select className={inputClass} value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as ScheduleMode })}>
                  <option value="ONSITE">Onsite</option>
                  <option value="ONLINE">Online</option>
                </select>
              </Field>
            </div>
            <Field label={form.mode === "ONLINE" ? "Meeting URL" : "Room / Location"}>
              <input className={inputClass} value={form.mode === "ONLINE" ? form.meetingUrl : form.location} onChange={(event) => setForm(form.mode === "ONLINE" ? { ...form, meetingUrl: event.target.value } : { ...form, location: event.target.value })} />
            </Field>
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
