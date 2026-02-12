import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, isApiError, type MeResponse } from "@/lib/api";
import { AuthContext } from "@/auth/auth.context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  type Sub = NonNullable<MeResponse["subscription"]>;
  const [subscription, setSubscription] = useState<Sub | null>(null);

  const [plan, setPlan] = useState<MeResponse["plan"]>(null);
  const [modules, setModules] = useState<MeResponse["modules"]>([]);
  const [subModules, setSubModules] = useState<MeResponse["subModules"]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.me();

      setUser(data.user);
      setSubscriptionActive(Boolean(data.subscriptionActive));

      const sub = data.subscription ?? null;
      setSubscription(sub);

      const effectivePlan = sub?.plan ?? data.plan ?? null;
      setPlan(effectivePlan);

      const effectiveModules = Array.isArray(data.modules) ? data.modules : [];
      const effectiveSubModules = Array.isArray(data.subModules) ? data.subModules : [];
      setModules(effectiveModules);
      setSubModules(effectiveSubModules);

      const planSelected = Boolean(sub?.plan) && Boolean(sub?.billingCycle);
      const modulesSelected = effectiveModules.length > 0 && effectiveSubModules.length > 0;

      const complete =
        data.onboarding?.complete ??
        data.onboardingComplete ??
        (planSelected && modulesSelected);

      setOnboardingComplete(Boolean(complete));
    } catch (err: unknown) {
      const isUnauthorized = isApiError(err) && err.status === 401;

      if (isUnauthorized) {
        setUser(null);
      } else {
        setUser(null);
      }

      setSubscriptionActive(false);
      setSubscription(null);
      setPlan(null);
      setModules([]);
      setSubModules([]);
      setOnboardingComplete(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signup = useCallback(
    async (email: string, password: string) => {
      await api.signup(email, password);
      await refresh();
    },
    [refresh]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      await api.login(email, password);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setSubscriptionActive(false);
    setSubscription(null);
    setPlan(null);
    setModules([]);
    setSubModules([]);
    setOnboardingComplete(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      subscriptionActive,
      subscription,
      plan,
      modules,
      subModules,
      onboardingComplete,
      refresh,
      signup,
      login,
      logout,
    }),
    [
      user,
      loading,
      subscriptionActive,
      subscription,
      plan,
      modules,
      subModules,
      onboardingComplete,
      refresh,
      signup,
      login,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
