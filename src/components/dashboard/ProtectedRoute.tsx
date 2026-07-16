import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredUser } from "../../services/http";
import type { UserRole } from "../../types/api";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ allowedRoles, redirectTo = "/login" }: ProtectedRouteProps) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
