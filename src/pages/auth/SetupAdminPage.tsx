import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import {
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../components/dashboard/DashboardPrimitives";
import { getStoredUser, toApiError } from "../../services/http";
import { setupService } from "../../services/setupService";

export default function SetupAdminPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const storedUser = getStoredUser();

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      try {
        const status = await setupService.status();
        if (isMounted) {
          setSetupRequired(status.setupRequired);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(toApiError(requestError).message);
          setSetupRequired(false);
        }
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (storedUser) {
    return <Navigate to={storedUser.role === "END_USER" ? "/portal/lessons" : "/"} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await setupService.createInitialAdmin({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(toApiError(requestError).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-md bg-slate-950 p-2 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Create first admin</h1>
            <p className="text-sm text-slate-500">This setup panel closes after a staff account exists.</p>
          </div>
        </div>

        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        {setupRequired === false ? (
          <div className="space-y-4">
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Admin setup has already been completed.</p>
            <Link className={secondaryButtonClass} to="/login">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First Name">
                <input className={inputClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
              </Field>
              <Field label="Last Name">
                <input className={inputClass} value={lastName} onChange={(event) => setLastName(event.target.value)} required />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Email">
                <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Password">
                <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </Field>
              <Field label="Confirm Password">
                <input className={inputClass} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </Field>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link className={secondaryButtonClass} to="/login">
                Back to sign in
              </Link>
              <button type="submit" className={primaryButtonClass} disabled={submitting || setupRequired === null}>
                {submitting ? "Creating admin..." : "Create admin"}
              </button>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
