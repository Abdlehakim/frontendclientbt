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
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data.user);
      setSubscriptionActive(!!data.subscriptionActive);

      setSubscription(data.subscription ?? null);
      setPlan(data.plan ?? null);
      setModules(data.modules ?? []);
      setOnboardingComplete(!!data.onboardingComplete);
    } catch (err: unknown) {
      // 401 is normal when not logged in yet
      if (isApiError(err) && err.status === 401) {
        setUser(null);
        setSubscriptionActive(false);
        setSubscription(null);
        setPlan(null);
        setModules([]);
        setOnboardingComplete(false);
      } else {
        // treat other errors as logged out (or you can console.error)
        setUser(null);
        setSubscriptionActive(false);
        setSubscription(null);
        setPlan(null);
        setModules([]);
        setOnboardingComplete(false);
      }
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
      onboardingComplete,
      refresh,
      signup,
      login,
      logout,
    }),
    [user, loading, subscriptionActive, subscription, plan, modules, onboardingComplete, refresh, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
