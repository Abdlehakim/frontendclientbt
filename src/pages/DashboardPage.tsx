import { useAuth } from "@/auth/useAuth";
import type { ModuleKey } from "@/lib/api";

function moduleLabel(m: ModuleKey) {
  if (m === "MODULE_1") return "Module 1";
  if (m === "MODULE_2") return "Module 2";
  return m;
}

export default function DashboardPage() {
  const { user, logout, subscriptionActive, subscription, plan, modules } = useAuth();

  const effectivePlan = subscription?.plan ?? plan ?? null;
  const selectedModules: ModuleKey[] = Array.isArray(modules) ? modules : [];

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <button type="button" onClick={logout} className="border rounded-lg px-3 py-1.5 bg-white hover:bg-neutral-50">
          Logout
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

          {selectedModules.length ? (
            <div className="flex flex-wrap gap-2">
              {selectedModules.map((m) => (
                <span key={m} className="text-xs px-3 py-1 rounded-full bg-neutral-100 border">
                  {moduleLabel(m)}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-600">No module selected</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-semibold mb-2">Client area</h2>
        <div className="text-sm text-neutral-600">Here you can show client list and module content.</div>
      </div>
    </div>
  );
}
