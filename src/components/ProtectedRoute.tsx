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
  const { user, loading, plan, modules, subscription } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading...</div>;

  const redirectTo = cleanRedirectTo(location.pathname, location.search);

  const onPlan = location.pathname.startsWith("/onboarding/plan");
  const onModules = location.pathname.startsWith("/onboarding/modules");
  const onLogin = location.pathname.startsWith("/login");

  if (!user) {
    if (onLogin) return <>{children}</>;
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  const planSelected = Boolean(subscription?.plan ?? plan) && Boolean(subscription?.billingCycle);
  const modulesSelected = Array.isArray(modules) && modules.length > 0;

  const subscriptionExpired = Boolean(subscription?.expired);
  const subscriptionValid = Boolean(subscription?.valid);

  if (!planSelected || subscriptionExpired || !subscriptionValid) {
    if (onPlan) return <>{children}</>;
    return <Navigate to={`/onboarding/plan?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  if (!modulesSelected) {
    if (onModules) return <>{children}</>;
    return <Navigate to={`/onboarding/modules?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}
