import { ExternalLink, MapPin, School } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { Panel, secondaryButtonClass } from "../../components/dashboard/DashboardPrimitives";
import { EmptyState, LoadingState } from "../../components/dashboard/StatusViews";
import type { EndUserOutletContext } from "./components/EndUserShell";

export default function EndUserSchoolsPage() {
  const { schools, schoolsLoading } = useOutletContext<EndUserOutletContext>();

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Schools</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose a school to view its public lessons, schedule, staff, and activities.</p>
      </div>

      {schoolsLoading ? <LoadingState label="Loading schools" /> : null}
      {!schoolsLoading && schools.length === 0 ? <EmptyState title="No schools available" description="No school websites are available yet." /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {schools.map((school) => {
          const publicPath = school.customizeSchoolId ? `/${school.customizeSchoolId}` : "";
          return (
            <Panel key={school.id} className="flex min-h-56 flex-col p-5">
              <div className="flex items-start gap-3">
                {school.logoUrl ? (
                  <img className="h-12 w-12 shrink-0 rounded-md border border-slate-200 object-cover dark:border-slate-800" src={school.logoUrl} alt={`${school.schoolName} logo`} />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    <School className="h-5 w-5" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold" title={school.schoolName}>{school.schoolName}</h3>
                  {school.subTitle ? <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{school.subTitle}</p> : null}
                </div>
              </div>

              {school.schoolAddress?.length ? (
                <p className="mt-4 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-2">{school.schoolAddress.join(", ")}</span>
                </p>
              ) : null}

              <div className="mt-auto pt-5">
                {publicPath ? (
                  <Link className={`w-full ${secondaryButtonClass}`} to={publicPath}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open school
                  </Link>
                ) : (
                  <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Public link is not configured.</p>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
