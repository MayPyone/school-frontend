import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { Modal } from "../../components/dashboard/Modal";
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
import { useAsyncData } from "../../hooks/useAsyncData";
import { staffService } from "../../services/staffService";
import { getStoredUser, toApiError } from "../../services/http";
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
  canManageStaff?: boolean;
}

export default function StaffPage({ schools, selectedSchoolId, canManageStaff = false }: StaffPageProps) {
  const staffState = useAsyncData(() => staffService.list(), []);
  const currentUser = getStoredUser();
  const canManageAdminRoles = currentUser?.role === "SUPER_ADMIN";
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ ...defaultForm, schoolId: selectedSchoolId });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revokingStaffId, setRevokingStaffId] = useState<UUID | null>(null);
  const [restoringStaffId, setRestoringStaffId] = useState<UUID | null>(null);

  const staff = staffState.data ?? [];
  const currentSchool = useMemo(
    () => schools.find((school) => school.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );
  const filteredStaff = useMemo(
    () =>
      staff
        .filter((member) => !selectedSchoolId || member.schoolId === selectedSchoolId)
        .filter((member) => `${member.firstName} ${member.lastName} ${member.email} ${member.role}`.toLowerCase().includes(query.toLowerCase())),
    [query, selectedSchoolId, staff]
  );
  const roleOptions: Array<{ value: StaffRole; label: string }> = [
    ...(canManageAdminRoles ? [
      { value: "SUPER_ADMIN" as StaffRole, label: "Super Admin" },
      { value: "ADMIN" as StaffRole, label: "Admin" },
    ] : []),
    { value: "TEACHER", label: "Teacher" },
    { value: "ASSISTANT", label: "Assistant" },
  ];

  function canChangeAccess(member: StaffMember) {
    if (member.role === "SUPER_ADMIN") {
      return false;
    }

    return member.role !== "ADMIN" || canManageAdminRoles;
  }

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

  async function revokeStaff(member: StaffMember) {
    const confirmed = window.confirm(`Revoke staff access for ${member.firstName} ${member.lastName}?`);
    if (!confirmed) {
      return;
    }

    setRevokingStaffId(member.id);
    try {
      await staffService.revoke(member.id);
      await staffState.reload();
    } catch (requestError) {
      staffState.setError(toApiError(requestError));
    } finally {
      setRevokingStaffId(null);
    }
  }

  async function restoreStaff(member: StaffMember) {
    const confirmed = window.confirm(`Restore staff access for ${member.firstName} ${member.lastName}?`);
    if (!confirmed) {
      return;
    }

    setRestoringStaffId(member.id);
    try {
      await staffService.restore(member.id);
      await staffState.reload();
    } catch (requestError) {
      staffState.setError(toApiError(requestError));
    } finally {
      setRestoringStaffId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description={canManageStaff ? "Search, filter, and manage staff records by role and status." : "Search and filter staff records by role and status."}
        actions={canManageStaff ? (
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
        ) : null}
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
                <Badge tone={member.role === "SUPER_ADMIN" || member.role === "ADMIN" ? "blue" : "green"}>{member.role}</Badge>
                <Badge tone={member.status === "ON_LEAVE" ? "yellow" : member.status === "INACTIVE" ? "red" : "green"}>{member.status ?? "ACTIVE"}</Badge>
              </div>
              <p className="mt-4 text-sm text-slate-600">{member.phone || "No phone"} {member.hireDate ? `- Hired ${member.hireDate}` : ""}</p>
              {canManageStaff && canChangeAccess(member) ? (
                <div className="mt-4 flex justify-end">
                  {member.status === "INACTIVE" ? (
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => void restoreStaff(member)}
                      disabled={restoringStaffId === member.id}
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      {restoringStaffId === member.id ? "Restoring..." : "Unrevoke"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={dangerButtonClass}
                      onClick={() => void revokeStaff(member)}
                      disabled={revokingStaffId === member.id}
                    >
                      <ShieldOff className="h-4 w-4" aria-hidden="true" />
                      {revokingStaffId === member.id ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </div>
              ) : null}
            </Panel>
          ))}
        </div>
      )}

      {formOpen && canManageStaff ? (
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
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
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
