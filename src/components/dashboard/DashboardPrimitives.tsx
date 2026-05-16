import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  helper?: string;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, helper }: StatCardProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {helper ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </section>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "yellow" | "red";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
    yellow: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900", className)}>{children}</section>;
}

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-500 dark:focus-visible:ring-slate-800";

export const primaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-slate-200";

export const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900";

export const dangerButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50";

export { Button };
