import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Search } from "lucide-react";
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
import { staffService } from "../../services/staffService";
import { toApiError } from "../../services/http";
import type { School, StaffMember, StaffRole, UUID } from "../../types/api";

const defaultForm = {
  schoolId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "TEACHER" as StaffRole,
  hireDate: "",
  status: "ACTIVE" as StaffMember["status"],
};

interface StaffPageProps {
  schools: School[];
  selectedSchoolId: UUID;
}

export default function StaffPage({ schools, selectedSchoolId }: StaffPageProps) {
  const staffState = useAsyncData(() => staffService.list(), []);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...defaultForm, schoolId: selectedSchoolId });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const staff = staffState.data ?? [];
  const currentSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );
  const filteredStaff = useMemo(
    () => staff.filter((member) => `${member.firstName} ${member.lastName} ${member.email} ${member.role}`.toLowerCase().includes(query.toLowerCase())),
    [query, staff]
  );

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      await staffService.create({ ...form, schoolId: selectedSchoolId });
      setForm({ ...defaultForm, schoolId: selectedSchoolId });
      setFormOpen(false);
      await staffState.reload();
    } catch (requestError) {
      setSubmitError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Search, filter, and manage staff records by role and status."
        actions={
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setForm({ ...defaultForm, schoolId: selectedSchoolId });
              setFormOpen(true);
            }}
            disabled={!selectedSchoolId}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Staff
          </button>
        }
      />

      {staffState.loading ? <LoadingState label="Checking staff endpoints" /> : null}
      {staffState.error ? <div className="mb-5"><ErrorState error={staffState.error} /></div> : null}

      <Panel className="mb-5 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, or role" aria-label="Search staff" />
        </div>
      </Panel>

      {!filteredStaff.length ? (
        <EmptyState title="No staff records" description="Add the first staff member." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredStaff.map((member) => (
            <Panel key={member.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">{member.firstName} {member.lastName}</h2>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={member.role === "ADMIN" ? "blue" : "green"}>{member.role}</Badge>
                <Badge tone={member.status === "ON_LEAVE" ? "yellow" : member.status === "INACTIVE" ? "red" : "green"}>{member.status ?? "ACTIVE"}</Badge>
              </div>
              <p className="mt-4 text-sm text-slate-600">{member.phone || "No phone"} {member.hireDate ? `- Hired ${member.hireDate}` : ""}</p>
            </Panel>
          ))}
        </div>
      )}

      {formOpen ? (
        <Modal title="Add staff" onClose={() => setFormOpen(false)}>
          <form onSubmit={saveStaff} className="grid gap-4">
            {submitError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}
            <Field label="School">
              <div className="min-h-10 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="block truncate" title={currentSchool?.schoolName ?? ""}>
                  {currentSchool?.schoolName ?? "Select a school from the sidebar"}
                </span>
              </div>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First Name">
                <input className={inputClass} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
              </Field>
              <Field label="Last Name">
                <input className={inputClass} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email">
                <input className={inputClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Role">
                <select className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })}>
                  <option value="ADMIN">Admin</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ASSISTANT">Assistant</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StaffMember["status"] })}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </Field>
              <Field label="Hire Date">
                <input className={inputClass} type="date" value={form.hireDate} onChange={(event) => setForm({ ...form, hireDate: event.target.value })} />
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
