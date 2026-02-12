import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { api, type ModuleDTO, type ModuleKey } from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";

function moduleLabelFromKey(m: ModuleKey) {
  if (m === "MODULE_1") return "Calculateur";
  if (m === "MODULE_2") return "Module 2";
  return m;
}

export default function DashboardPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, subscriptionActive, subscription, plan } = useAuth();

  const [enabledTree, setEnabledTree] = useState<ModuleDTO[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.listEnabledModules();
        if (mounted) setEnabledTree(res.modules ?? []);
      } catch {
        if (mounted) setEnabledTree([]);
      } finally {
        if (mounted) setLoadingTree(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const effectivePlan = subscription?.plan ?? plan ?? null;
  const isValid = Boolean(subscription?.valid ?? subscriptionActive);

  const endLabel = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleString()
    : "—";

  const planLabel =
    effectivePlan === "INDIVIDUAL" ? "Individual" : effectivePlan === "ENTERPRISE" ? "Enterprise" : "—";

  const billingLabel =
    subscription?.billingCycle === "MONTHLY"
      ? "Monthly"
      : subscription?.billingCycle === "YEARLY"
      ? "Yearly"
      : "—";

  const hasEnabledSomething = useMemo(() => enabledTree.length > 0, [enabledTree]);

  const current = loc.pathname + loc.search;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
          <div className="text-sm text-neutral-600">{user?.email ?? "—"}</div>
        </div>

        <button
          type="button"
          onClick={() => nav(`/onboarding/plan?redirectTo=${encodeURIComponent(current)}`)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Update subscription & modules
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 space-y-3">
          <h2 className="font-semibold">Account</h2>

          <div className="text-sm">
            Email: <span className="font-medium">{user?.email}</span>
          </div>

          <div className="text-sm">
            Subscription:{" "}
            <span className={`font-semibold ${isValid ? "text-green-600" : "text-red-600"}`}>
              {isValid ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <div className="text-sm">
            Plan: <span className="font-medium">{planLabel}</span>
          </div>

          <div className="text-sm">
            Billing: <span className="font-medium">{billingLabel}</span>
          </div>

          <div className="text-sm">
            Seats: <span className="font-medium">{subscription?.seats ?? "—"}</span>
          </div>

          <div className="text-sm">
            Current period end: <span className="font-medium">{endLabel}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 space-y-3">
          <h2 className="font-semibold">Modules</h2>

          {loadingTree ? (
            <div className="text-sm text-neutral-600">Loading modules…</div>
          ) : !hasEnabledSomething ? (
            <div className="text-sm text-neutral-600">No module enabled</div>
          ) : (
            <div className="space-y-3">
              {enabledTree.map((m) => (
                <div key={m.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="font-semibold text-slate-900">{m.name || moduleLabelFromKey(m.key)}</div>

                  {m.subModules && m.subModules.length > 0 ? (
                    <ul className="mt-2 ml-4 list-disc text-sm text-slate-700">
                      {m.subModules.map((s) => (
                        <li key={s.key}>{s.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-2 text-sm text-slate-500">No submodules</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
