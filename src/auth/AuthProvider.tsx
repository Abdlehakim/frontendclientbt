import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { AuthContext, type User } from "@/auth.context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data.user);
      setSubscriptionActive(!!data.subscriptionActive);
    } catch {
      setUser(null);
      setSubscriptionActive(false);
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
  }, []);

  const value = useMemo(
    () => ({ user, subscriptionActive, loading, refresh, signup, login, logout }),
    [user, subscriptionActive, loading, refresh, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
