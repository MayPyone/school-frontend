import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredUser } from "../../services/http";

export function ProtectedRoute() {
  const location = useLocation();

  if (!getStoredUser()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

