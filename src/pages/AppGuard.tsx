import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import type { ModuleKey, SubModuleKey } from "@/lib/api";

function cleanRedirectTo(pathname: string, search: string) {
  const u = new URL(pathname + search, "http://local");
  u.searchParams.delete("redirectTo");
  const qs = u.searchParams.toString();
  return u.pathname + (qs ? `?${qs}` : "");
}

export default function AppGuard() {
  const loc = useLocation();
  const { user, loading, subscriptionActive, subscription, plan, modules, subModules } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const current = cleanRedirectTo(loc.pathname, loc.search);

  const effectivePlan = subscription?.plan ?? plan ?? null;
  const effectiveCycle = subscription?.billingCycle ?? null;
  const planSelected = Boolean(effectivePlan) && Boolean(effectiveCycle);

  const selectedModules: ModuleKey[] = Array.isArray(modules) ? modules : [];
  const selectedSubModules: SubModuleKey[] = Array.isArray(subModules) ? subModules : [];

  const isExpired = Boolean(subscription?.expired);
  const isValid = Boolean(subscription?.valid ?? subscriptionActive);

  const onPlan = loc.pathname.startsWith("/onboarding/plan");
  const onModules = loc.pathname.startsWith("/onboarding/modules");

  if (!planSelected || isExpired || !isValid) {
    if (onPlan) return <Outlet />;
    return <Navigate to={`/onboarding/plan?redirectTo=${encodeURIComponent(current)}`} replace />;
  }

  if (selectedModules.length === 0 || selectedSubModules.length === 0) {
    if (onModules) return <Outlet />;
    return <Navigate to={`/onboarding/modules?redirectTo=${encodeURIComponent(current)}`} replace />;
  }

  return <Outlet />;
}
