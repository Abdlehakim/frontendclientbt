import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import type { ModuleKey, SubModuleKey } from "@/lib/api";

export default function AppGuard() {
  const loc = useLocation();
  const { user, loading, subscriptionActive, subscription, plan, modules, subModules } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const current = loc.pathname + loc.search;

  const effectivePlan = subscription?.plan ?? plan ?? null;
  const effectiveCycle = subscription?.billingCycle ?? null;
  const planSelected = Boolean(effectivePlan) && Boolean(effectiveCycle);

  const selectedModules: ModuleKey[] = Array.isArray(modules) ? modules : [];
  const selectedSubModules: SubModuleKey[] = Array.isArray(subModules) ? subModules : [];

  const isExpired = Boolean(subscription?.expired);
  const isValid = Boolean(subscription?.valid ?? subscriptionActive);

  if (!planSelected || isExpired || !isValid) {
    return <Navigate to={`/onboarding/plan?redirectTo=${encodeURIComponent(current)}`} replace />;
  }

  if (selectedModules.length === 0 || selectedSubModules.length === 0) {
    return <Navigate to={`/onboarding/modules?redirectTo=${encodeURIComponent(current)}`} replace />;
  }

  return <Outlet />;
}
