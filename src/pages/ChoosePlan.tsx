import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type BillingCycle, type Plan } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";

export default function ChoosePlan() {
  const { refresh, subscription } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [plan, setPlan] = useState<Plan>("INDIVIDUAL");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const PRICES = useMemo(() => {
    const monthly = 100; // DT
    const yearly = Math.round(monthly * 12 * 0.9); // 10% reduction => 1080
    return { monthly, yearly };
  }, []);

  const price = billingCycle === "MONTHLY" ? PRICES.monthly : PRICES.yearly;

  const planLabel = plan === "INDIVIDUAL" ? "Individuel" : "Entreprise";
  const cycleLabel = billingCycle === "MONTHLY" ? "Mensuel" : "Annuel";
  
async function handleContinue() {
  setErr("");
  setLoading(true);

  try {
    await api.selectPlan(plan, billingCycle);
    await refresh();

    // ✅ Always go to modules step after plan
    const finalTarget = params.get("redirectTo") || "/app";
    nav(`/onboarding/modules?redirectTo=${encodeURIComponent(finalTarget)}`, { replace: true });
  } catch (e: unknown) {
    setErr(e instanceof Error ? e.message : "Erreur lors de l’enregistrement du plan");
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Choisissez votre abonnement
          </h1>
          <p className="text-slate-600">
            Sélectionnez un plan et une période de paiement pour accéder au tableau de bord.
          </p>
        </div>

        {/* Banner if expired */}
        {subscription?.expired ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <div className="font-semibold">Abonnement expiré</div>
            <div className="text-sm">
              Veuillez renouveler votre abonnement pour continuer.
            </div>
          </div>
        ) : null}

        {/* Error */}
        {err ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing cycle */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Période de paiement</h2>
                  <p className="text-sm text-slate-600">
                    Mensuel: 100 DT • Annuel: 1080 DT (10% de réduction)
                  </p>
                </div>

                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle("MONTHLY")}
                    className={[
                      "px-4 py-2 text-sm font-semibold rounded-lg transition",
                      billingCycle === "MONTHLY"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("YEARLY")}
                    className={[
                      "px-4 py-2 text-sm font-semibold rounded-lg transition",
                      billingCycle === "YEARLY"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                  >
                    Annuel
                  </button>
                </div>
              </div>
            </div>

            {/* Plan cards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Plan</h2>
              <p className="text-sm text-slate-600">
                Individuel = 1 accès • Entreprise = plusieurs accès (seats)
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Individual */}
                <button
                  type="button"
                  onClick={() => setPlan("INDIVIDUAL")}
                  className={[
                    "text-left rounded-2xl border p-5 transition",
                    plan === "INDIVIDUAL"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-slate-900">Individuel</div>
                      <div className="text-sm text-slate-600">1 utilisateur / 1 accès</div>
                    </div>
                    <span
                      className={[
                        "px-2 py-1 rounded-lg text-xs font-bold",
                        plan === "INDIVIDUAL"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {plan === "INDIVIDUAL" ? "Sélectionné" : "Choisir"}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li>• Accès à 1 compte</li>
                    <li>• Modules selon sélection</li>
                    <li>• Idéal pour indépendant</li>
                  </ul>
                </button>

                {/* Enterprise */}
                <button
                  type="button"
                  onClick={() => setPlan("ENTERPRISE")}
                  className={[
                    "text-left rounded-2xl border p-5 transition",
                    plan === "ENTERPRISE"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-slate-900">Entreprise</div>
                      <div className="text-sm text-slate-600">
                        Plusieurs utilisateurs (seats)
                      </div>
                    </div>
                    <span
                      className={[
                        "px-2 py-1 rounded-lg text-xs font-bold",
                        plan === "ENTERPRISE"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {plan === "ENTERPRISE" ? "Sélectionné" : "Choisir"}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    <li>• Plusieurs accès au même compte</li>
                    <li>• Seats (gestion plus tard)</li>
                    <li>• Idéal pour équipe</li>
                  </ul>
                </button>
              </div>
            </div>
          </div>

          {/* Right summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-900">Résumé</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Plan</span>
                <span className="font-semibold text-slate-900">{planLabel}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Période</span>
                <span className="font-semibold text-slate-900">{cycleLabel}</span>
              </div>

              <div className="my-3 border-t border-slate-200" />

              <div className="flex items-end justify-between">
                <span className="text-slate-600">Prix</span>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {price} <span className="text-base font-bold">DT</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {billingCycle === "MONTHLY" ? "par mois" : "par an"}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-bold transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Continuer"}
            </button>

            <p className="mt-3 text-xs text-slate-500">
              Après validation, vous choisirez les modules (Module 1 / Module 2).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
