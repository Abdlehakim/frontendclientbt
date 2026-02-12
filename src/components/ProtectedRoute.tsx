import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, plan, modules, subscription } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading...</div>;

  const redirectTo = `${location.pathname}${location.search}`;

  if (!user) {
    return <Navigate to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
  }

  const planSelected = Boolean(plan);
  const modulesSelected = Array.isArray(modules) && modules.length > 0;

  const subscriptionExpired = Boolean(subscription?.expired);
  const subscriptionValid = subscription ? Boolean(subscription.valid) : false;

  if (!planSelected || subscriptionExpired || !subscriptionValid) {
    return (
      <Navigate
        to={`/onboarding/plan?redirectTo=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  if (!modulesSelected) {
    return (
      <Navigate
        to={`/onboarding/modules?redirectTo=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
