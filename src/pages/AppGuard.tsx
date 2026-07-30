import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

function cleanRedirectTo(pathname: string, search: string) {
  const u = new URL(pathname + search, "http://local");
  u.searchParams.delete("redirectTo");
  const qs = u.searchParams.toString();
  return u.pathname + (qs ? `?${qs}` : "");
}

export default function AppGuard() {
  const loc = useLocation();
  const { user, loading, modules } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const current = cleanRedirectTo(loc.pathname, loc.search);

  const modulesSelected =
    Array.isArray(modules) && modules.length > 0;

  if (!modulesSelected) {
    return <Navigate to={`/onboarding/modules?redirectTo=${encodeURIComponent(current)}`} replace />;
  }

  return <Outlet />;
}
