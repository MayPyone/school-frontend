import { useEffect, useState } from "react";
import { Mail, UserRound } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Badge, Panel } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, ErrorState, LoadingState } from "../../components/dashboard/StatusViews";
import { toApiError } from "../../services/http";
import { staffService } from "../../services/staffService";
import type { ApiError, StaffMember } from "../../types/api";
import type { EndUserOutletContext } from "./components/EndUserShell";

export default function EndUserStaffPage() {
  const { selectedSchoolId } = useOutletContext<EndUserOutletContext>();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStaff() {
      if (!selectedSchoolId) {
        setStaff([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const loadedStaff = await staffService.listBySchool(selectedSchoolId);
        if (isMounted) {
          setStaff(loadedStaff);
        }
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

    void loadStaff();

    return () => {
      isMounted = false;
    };
  }, [selectedSchoolId]);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Staff</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">School staff for the selected school.</p>
      </div>

      {loading ? <LoadingState label="Loading staff" /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && staff.length === 0 ? <EmptyState title="No staff listed" description="No staff profiles are available for this school yet." /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => (
          <Panel key={member.id} className="min-h-36 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold" title={`${member.firstName} ${member.lastName}`}>{member.firstName} {member.lastName}</h3>
                <div className="mt-2">
                  <Badge tone={member.role === "ADMIN" ? "blue" : "green"}>{member.role}</Badge>
                </div>
                <p className="mt-3 flex items-center gap-2 truncate text-sm text-slate-600 dark:text-slate-400" title={member.email}>
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {member.email}
                </p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
