import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

function cleanRedirectTo(pathname: string, search: string) {
  const u = new URL(pathname + search, "http://local");
  u.searchParams.delete("redirectTo");
  const qs = u.searchParams.toString();
  return u.pathname + (qs ? `?${qs}` : "");
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading...</div>;

  const redirectTo = cleanRedirectTo(location.pathname, location.search);

  if (!user) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}
