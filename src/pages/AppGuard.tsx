import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import type { ModuleKey } from "@/lib/api";
import DashboardPage from "@/pages/DashboardPage";

export default function AppGuard() {
  const { user, loading, subscriptionActive, subscription, plan, modules } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const effectivePlan = subscription?.plan ?? plan ?? null;
  const planSelected = Boolean(effectivePlan);

  const selectedModules: ModuleKey[] = Array.isArray(modules) ? modules : [];
  const modulesSelected = selectedModules.length > 0;

  const isExpired = Boolean(subscription?.expired);
  const isValid = Boolean(subscription?.valid ?? subscriptionActive);

  if (!planSelected || isExpired || !isValid) {
    return <Navigate to="/onboarding/plan" replace />;
  }

  if (!modulesSelected) {
    return <Navigate to="/onboarding/modules" replace />;
  }

  return <DashboardPage />;
}
