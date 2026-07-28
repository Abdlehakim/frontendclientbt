import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, type ModuleDTO, type ModuleKey, type SubModuleKey } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";

type ModuleMeta = {
  title: string;
  desc: string;
  features: string[];
  badge?: string;
};

const MODULE_META: Partial<Record<ModuleKey, ModuleMeta>> = {
  MODULE_1: {
    title: "Calculateur",
    desc: "Outils de calcul et configuration.",
    features: ["Accès au module", "Fonctions principales", "Configuration"],
    badge: "Recommandé",
  },
};

export default function ChooseModules() {
  const { refresh, subscription, modules: enabledModules, subModules: enabledSubModules, onboardingComplete } =
    useAuth();

  const nav = useNavigate();
  const [params] = useSearchParams();

  const [catalog, setCatalog] = useState<ModuleDTO[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  // ✅ No default module selected for new users
  const [selected, setSelected] = useState<ModuleKey[]>(enabledModules?.length ? enabledModules : []);
  const [selectedSub, setSelectedSub] = useState<SubModuleKey[]>(
    enabledSubModules?.length ? enabledSubModules : []
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    void (async () => {
      if (mounted) {
        setLoadingCatalog(true);
        setCatalogError("");
      }

      try {
        const response = await api.listModules();

        if (mounted) {
          setCatalog(response.modules ?? []);
        }
      } catch (error: unknown) {
        if (mounted) {
          setCatalog([]);
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Unable to load the module catalog.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingCatalog(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // when auth state loads / refresh, sync enabled selections
    if (enabledModules && enabledModules.length) setSelected(enabledModules);
    else setSelected([]);
    if (enabledSubModules && enabledSubModules.length) setSelectedSub(enabledSubModules);
    else setSelectedSub([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledModules?.join(","), enabledSubModules?.join(",")]);

  const catalogByKey = useMemo(() => {
    const m = new Map<ModuleKey, ModuleDTO>();
    for (const mod of catalog) m.set(mod.key, mod);
    return m;
  }, [catalog]);

  const invalidSelectedModuleKeys = useMemo(
    () => selected.filter((moduleKey) => !catalogByKey.has(moduleKey)),
    [selected, catalogByKey],
  );

  const subModulesByModule = useMemo(() => {
    const map = new Map<ModuleKey, { key: SubModuleKey; name: string }[]>();
    for (const mod of catalog) {
      map.set(mod.key, (mod.subModules ?? []) as { key: SubModuleKey; name: string }[]);
    }
    return map;
  }, [catalog]);

  const subModuleParent = useMemo(() => {
    const map = new Map<SubModuleKey, ModuleKey>();
    for (const mod of catalog) {
      const subs = (mod.subModules ?? []) as { key: SubModuleKey; name: string }[];
      for (const s of subs) map.set(s.key, mod.key);
    }
    return map;
  }, [catalog]);

  const selectedSubByModule = useMemo(() => {
    const out = new Map<ModuleKey, SubModuleKey[]>();
    for (const modKey of selected) out.set(modKey, []);
    for (const k of selectedSub) {
      const parent = subModuleParent.get(k);
      if (!parent) continue;
      if (!out.has(parent)) out.set(parent, []);
      out.get(parent)!.push(k);
    }
    return out;
  }, [selected, selectedSub, subModuleParent]);

  // ✅ If module has submodules => selecting at least one submodule is mandatory
  const missingSubModulesFor = useMemo(() => {
    const missing: ModuleKey[] = [];
    for (const modKey of selected) {
      const availableSubs = subModulesByModule.get(modKey) ?? [];
      if (availableSubs.length === 0) continue;

      const picked = selectedSubByModule.get(modKey) ?? [];
      if (picked.length === 0) missing.push(modKey);
    }
    return missing;
  }, [selected, subModulesByModule, selectedSubByModule]);

  const canContinue =
    !loadingCatalog &&
    !catalogError &&
    catalog.length > 0 &&
    selected.length > 0 &&
    invalidSelectedModuleKeys.length === 0 &&
    missingSubModulesFor.length === 0 &&
    !saving;

  function toggleModule(m: ModuleKey) {
    setSelected((prev) => {
      const next = prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m];

      // If module turned OFF -> remove its selected submodules
      if (!next.includes(m)) {
        const subsToRemove = (catalogByKey.get(m)?.subModules ?? []).map(
          (s) => (s as { key: SubModuleKey }).key
        );
        setSelectedSub((p) => p.filter((k) => !subsToRemove.includes(k)));
      }

      return next;
    });
  }

  function toggleSubModule(k: SubModuleKey) {
    setSelectedSub((prev) => {
      const isOn = prev.includes(k);
      const next = isOn ? prev.filter((x) => x !== k) : [...prev, k];
      return next;
    });
  }

  async function handleSave() {
    setErr("");

    if (loadingCatalog) {
      setErr("The module catalog is still loading.");
      return;
    }

    if (catalogError) {
      setErr("The module catalog could not be loaded.");
      return;
    }

    if (catalog.length === 0) {
      setErr("No modules are currently available.");
      return;
    }

    if (selected.length === 0) {
      setErr("Please select at least one module.");
      return;
    }

    if (invalidSelectedModuleKeys.length > 0) {
      setErr(
        `The following modules are no longer available: ${invalidSelectedModuleKeys.join(", ")}`,
      );
      return;
    }

    if (missingSubModulesFor.length > 0) {
      const names = missingSubModulesFor.map((k) => catalogByKey.get(k)?.name ?? k).join(", ");
      setErr(`You must select at least one submodule for: ${names}`);
      return;
    }

    setSaving(true);
    try {
      await api.selectModules({ moduleKeys: selected, subModuleKeys: selectedSub });
      await refresh();

      const redirectTo = params.get("redirectTo") || "/app";
      nav(redirectTo, { replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error while saving modules");
    } finally {
      setSaving(false);
    }
  }

  // ✅ Preserve redirect chain: plan -> modules -> redirectTo (ex: /app)
  const goUpdateSubscription = () => {
    const backTo = params.get("redirectTo") || "/app";
    const next = `/onboarding/modules?redirectTo=${encodeURIComponent(backTo)}`;
    nav(`/onboarding/plan?redirectTo=${encodeURIComponent(next)}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Choose your modules</h1>
          <p className="text-slate-600">
            Select at least one module. If a module contains submodules, selecting a submodule is mandatory.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">Subscription</div>
              <div className="text-sm text-slate-600">
                {subscription?.plan ? `Plan: ${subscription.plan}` : "Plan: not set"}
                {subscription?.billingCycle ? ` • Cycle: ${subscription.billingCycle}` : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={goUpdateSubscription}
              className="mt-3 sm:mt-0 inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Update subscription
            </button>
          </div>
        </div>

        {err ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>
        ) : null}

        {loadingCatalog ? (
          <div className="mt-8 text-slate-600">Loading modules...</div>
        ) : catalogError ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {catalogError}
          </div>
        ) : catalog.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-6 text-slate-600">
            No modules are currently available.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
              {catalog.map((m) => {
                const meta = MODULE_META[m.key];
                const title = meta?.title ?? m.name ?? m.key;
                const desc = meta?.desc ?? "";
                const features = meta?.features ?? [];
                const badge = meta?.badge;

                const isOn = selected.includes(m.key);
                const subs = (m.subModules ?? []) as { key: SubModuleKey; name: string }[];
                const needsSub = isOn && subs.length > 0;

                const chosenSubs = selectedSubByModule.get(m.key) ?? [];
                const missingSub = needsSub && chosenSubs.length === 0;

                return (
                  <div
                    key={m.key}
                    className={[
                      "text-left rounded-2xl border p-5 transition",
                      isOn ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-base font-bold text-slate-900">{title}</div>
                          {badge ? (
                            <span className="rounded-lg bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
                              {badge}
                            </span>
                          ) : null}
                        </div>
                        {desc ? <div className="mt-1 text-sm text-slate-600">{desc}</div> : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleModule(m.key)}
                        className={[
                          "px-2 py-1 rounded-lg text-xs font-bold border transition",
                          isOn
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300",
                        ].join(" ")}
                      >
                        {isOn ? "Enabled" : "Choose"}
                      </button>
                    </div>

                    {features.length ? (
                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                    ) : null}

                    {/* ✅ Show submodules under their related module (only when module is enabled) */}
                    {isOn && subs.length ? (
                      <div className="mt-4 border-t border-slate-200 pt-4">
                        <div className="text-xs font-semibold text-slate-700">SubModules</div>

                        <div className="mt-3 space-y-2">
                          {subs.map((s) => {
                            const subOn = selectedSub.includes(s.key);

                            return (
                              <button
                                key={s.key}
                                type="button"
                                onClick={() => toggleSubModule(s.key)}
                                className={[
                                  "w-full text-left rounded-xl border px-4 py-3 transition",
                                  subOn
                                    ? "border-indigo-500 bg-indigo-50"
                                    : "border-slate-200 bg-white hover:border-slate-300",
                                ].join(" ")}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-slate-900">{s.name}</div>
                                  <div className="text-xs font-bold">{subOn ? "Selected" : "Select"}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {missingSub ? (
                          <div className="mt-2 text-xs font-semibold text-red-600">
                            Select at least one submodule for this module.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
              <h3 className="text-lg font-bold text-slate-900">Summary</h3>

              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Selected modules</span>
                  <span className="font-semibold text-slate-900">{selected.length}</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {selected.length === 0 ? (
                    <div className="text-slate-600">No module selected</div>
                  ) : (
                    <div className="space-y-3">
                      {selected.map((mk) => {
                        const mod = catalogByKey.get(mk);
                        const modName = mod?.name ?? mk;
                        const subs = (mod?.subModules ?? []) as { key: SubModuleKey; name: string }[];
                        const picked = selectedSubByModule.get(mk) ?? [];
                        const pickedNames = subs.filter((s) => picked.includes(s.key)).map((s) => s.name);

                        return (
                          <div key={mk}>
                            <div className="font-semibold text-slate-900">• {modName}</div>

                            {subs.length > 0 ? (
                              pickedNames.length > 0 ? (
                                <ul className="mt-1 ml-4 list-disc text-slate-700">
                                  {pickedNames.map((n) => (
                                    <li key={n}>{n}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="mt-1 ml-4 text-red-600 font-semibold">Select at least one submodule</div>
                              )
                            ) : (
                              <div className="mt-1 ml-4 text-slate-500">No submodules</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  If a module has submodules, you must select at least one submodule to continue.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={!canContinue}
                className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-white font-bold transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : onboardingComplete ? "Update modules" : "Continue to dashboard"}
              </button>

              <button
                type="button"
                onClick={() => nav(params.get("redirectTo") || "/app")}
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-700 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
