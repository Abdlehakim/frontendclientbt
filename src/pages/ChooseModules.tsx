// frontendclientbt/src/pages/ChooseModules.tsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type ModuleKey } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";

type ModuleCard = {
  key: ModuleKey;
  title: string;
  desc: string;
  features: string[];
  badge?: string;
};

export default function ChooseModules() {
  const { refresh, subscription } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const modules = useMemo<ModuleCard[]>(
    () => [
      {
        key: "MODULE_1",
        title: "Module 1",
        desc: "Votre premier module (nom à définir plus tard).",
        features: ["Fonctionnalité A", "Fonctionnalité B", "Accès rapide"],
        badge: "Recommandé",
      },
      {
        key: "MODULE_2",
        title: "Module 2",
        desc: "Votre deuxième module (nom à définir plus tard).",
        features: ["Fonctionnalité C", "Fonctionnalité D", "Support inclus"],
      },
    ],
    []
  );

  const [selected, setSelected] = useState<ModuleKey[]>(["MODULE_1"]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const canContinue = selected.length > 0 && !loading;

  function toggle(m: ModuleKey) {
    setSelected((prev) => {
      if (prev.includes(m)) return prev.filter((x) => x !== m);
      return [...prev, m];
    });
  }

  async function handleContinue() {
    setErr("");
    setLoading(true);
    try {
      await api.selectModules(selected);
      await refresh();

      const redirectTo = params.get("redirectTo") || "/app";
      nav(redirectTo, { replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur lors de l’enregistrement des modules");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Choisissez vos modules</h1>
          <p className="text-slate-600">
            Sélectionnez au moins un module pour accéder au tableau de bord.
          </p>
        </div>

        {/* Plan reminder */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Abonnement</div>
              <div className="text-sm text-slate-600">
                {subscription?.plan ? `Plan: ${subscription.plan}` : "Plan: non défini"}
                {subscription?.billingCycle ? ` • Cycle: ${subscription.billingCycle}` : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() => nav("/onboarding/plan")}
              className="mt-3 sm:mt-0 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Modifier le plan
            </button>
          </div>
        </div>

        {/* Errors */}
        {err ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {err}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Cards */}
          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            {modules.map((m) => {
              const isOn = selected.includes(m.key);

              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggle(m.key)}
                  className={[
                    "text-left rounded-2xl border p-5 transition",
                    isOn ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-bold text-slate-900">{m.title}</div>
                        {m.badge ? (
                          <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                            {m.badge}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{m.desc}</div>
                    </div>

                    <span
                      className={[
                        "px-2 py-1 rounded-lg text-xs font-bold",
                        isOn ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {isOn ? "Activé" : "Choisir"}
                    </span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {m.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-900">Résumé</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Modules sélectionnés</span>
                <span className="font-semibold text-slate-900">{selected.length}</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                {selected.length === 0 ? (
                  <div className="text-slate-600">Aucun module sélectionné</div>
                ) : (
                  <ul className="space-y-1">
                    {selected.map((k) => (
                      <li key={k} className="text-slate-900 font-semibold">
                        • {k === "MODULE_1" ? "Module 1" : "Module 2"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Vous devez choisir au moins un module pour continuer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-bold transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "Enregistrement..." : "Continuer vers le dashboard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
