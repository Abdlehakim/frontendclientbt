import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import SessionExpiryModal from "@/components/auth/SessionExpiryModal";
import { api, isApiError, type MeResponse, type SignupPayload } from "@/lib/api";
import { AuthContext } from "@/auth/auth.context";

const SESSION_RENEWAL_GRACE_MS = 60_000;
const SESSION_RENEWAL_GRACE_SECONDS = 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const authResetVersionRef = useRef(0);
  const sessionContinueInFlightRef = useRef(false);
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  type Sub = NonNullable<MeResponse["subscription"]>;
  const [subscription, setSubscription] = useState<Sub | null>(null);

  const [plan, setPlan] = useState<MeResponse["plan"]>(null);
  const [modules, setModules] = useState<MeResponse["modules"]>([]);
  const [subModules, setSubModules] = useState<MeResponse["subModules"]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] =
    useState<string | null>(null);
  const [sessionWarningOpen, setSessionWarningOpen] =
    useState(false);
  const [
    sessionRemainingSeconds,
    setSessionRemainingSeconds,
  ] = useState(SESSION_RENEWAL_GRACE_SECONDS);
  const [
    sessionContinueLoading,
    setSessionContinueLoading,
  ] = useState(false);
  const [
    sessionContinueError,
    setSessionContinueError,
  ] = useState("");

  const resetSessionWarningState = useCallback(() => {
    sessionContinueInFlightRef.current = false;
    setSessionWarningOpen(false);
    setSessionRemainingSeconds(0);
    setSessionContinueLoading(false);
    setSessionContinueError("");
  }, []);

  const clearAuthState = useCallback(() => {
    authResetVersionRef.current += 1;
    setUser(null);
    setSubscriptionActive(false);
    setSubscription(null);
    setPlan(null);
    setModules([]);
    setSubModules([]);
    setOnboardingComplete(false);
    setSessionExpiresAt(null);
    resetSessionWarningState();
  }, [resetSessionWarningState]);

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
      setSessionExpiresAt(
        data.session?.expiresAt ?? null,
      );
      setSessionWarningOpen(false);
      setSessionRemainingSeconds(
        SESSION_RENEWAL_GRACE_SECONDS,
      );
      setSessionContinueLoading(false);
      setSessionContinueError("");
    } catch {
      clearAuthState();
    } finally {
      setLoading(false);
    }
  }, [clearAuthState]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user || !sessionExpiresAt) {
      return;
    }

    const expireAndRedirect = () => {
      clearAuthState();
      navigate("/login", { replace: true });
    };
    const expiresAtMs = Date.parse(sessionExpiresAt);

    if (!Number.isFinite(expiresAtMs)) {
      expireAndRedirect();
      return;
    }

    const openWarning = () => {
      const graceDeadlineMs =
        expiresAtMs + SESSION_RENEWAL_GRACE_MS;
      const remainingMs =
        graceDeadlineMs - Date.now();

      if (remainingMs <= 0) {
        expireAndRedirect();
        return;
      }

      setSessionRemainingSeconds(
        Math.max(
          0,
          Math.ceil(remainingMs / 1000),
        ),
      );
      setSessionContinueLoading(false);
      setSessionContinueError("");
      setSessionWarningOpen(true);
    };

    const delayUntilExpiration =
      expiresAtMs - Date.now();

    if (delayUntilExpiration <= 0) {
      openWarning();
      return;
    }

    const timeoutId = window.setTimeout(
      openWarning,
      delayUntilExpiration,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    clearAuthState,
    navigate,
    sessionExpiresAt,
    user,
  ]);

  useEffect(() => {
    if (!sessionWarningOpen || !sessionExpiresAt) {
      return;
    }

    let intervalId: number | null = null;
    let redirected = false;

    const expireAndRedirect = () => {
      if (redirected) return;
      redirected = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      clearAuthState();
      navigate("/login", { replace: true });
    };

    const updateRemainingTime = () => {
      const expiresAtMs =
        Date.parse(sessionExpiresAt);
      if (!Number.isFinite(expiresAtMs)) {
        expireAndRedirect();
        return;
      }

      const graceDeadlineMs =
        expiresAtMs + SESSION_RENEWAL_GRACE_MS;
      const remainingMs =
        graceDeadlineMs - Date.now();
      const remainingSeconds = Math.max(
        0,
        Math.ceil(remainingMs / 1000),
      );

      setSessionRemainingSeconds(remainingSeconds);

      if (remainingSeconds === 0) {
        expireAndRedirect();
      }
    };

    updateRemainingTime();

    if (!redirected) {
      intervalId = window.setInterval(
        updateRemainingTime,
        1000,
      );
    }

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    clearAuthState,
    navigate,
    sessionExpiresAt,
    sessionWarningOpen,
  ]);

  const handleContinueSession = useCallback(async () => {
    if (
      sessionContinueInFlightRef.current ||
      sessionContinueLoading ||
      sessionRemainingSeconds === 0 ||
      !sessionWarningOpen
    ) {
      return;
    }

    const resetVersion =
      authResetVersionRef.current;
    sessionContinueInFlightRef.current = true;
    setSessionContinueLoading(true);
    setSessionContinueError("");

    try {
      const result = await api.continueSession();

      if (
        authResetVersionRef.current !== resetVersion
      ) {
        return;
      }

      const renewedExpiresAtMs =
        Date.parse(result.expiresAt);
      if (
        !Number.isFinite(renewedExpiresAtMs) ||
        renewedExpiresAtMs <= Date.now()
      ) {
        clearAuthState();
        navigate("/login", { replace: true });
        return;
      }

      setSessionExpiresAt(result.expiresAt);
      setSessionWarningOpen(false);
      setSessionRemainingSeconds(
        SESSION_RENEWAL_GRACE_SECONDS,
      );
      setSessionContinueError("");
    } catch (continueError: unknown) {
      if (
        authResetVersionRef.current !== resetVersion
      ) {
        return;
      }

      if (
        isApiError(continueError) &&
        continueError.status === 401
      ) {
        clearAuthState();
        navigate("/login", { replace: true });
        return;
      }

      const currentExpiresAtMs =
        sessionExpiresAt
          ? Date.parse(sessionExpiresAt)
          : Number.NaN;
      const graceDeadlineMs =
        currentExpiresAtMs +
        SESSION_RENEWAL_GRACE_MS;

      if (
        !Number.isFinite(graceDeadlineMs) ||
        Date.now() >= graceDeadlineMs
      ) {
        clearAuthState();
        navigate("/login", { replace: true });
        return;
      }

      setSessionContinueError(
        isApiError(continueError)
          ? continueError.message
          : "Impossible de renouveler la session. Veuillez réessayer.",
      );
    } finally {
      sessionContinueInFlightRef.current = false;
      setSessionContinueLoading(false);
    }
  }, [
    clearAuthState,
    navigate,
    sessionContinueLoading,
    sessionExpiresAt,
    sessionRemainingSeconds,
    sessionWarningOpen,
  ]);

  const signup = useCallback(
    async (payload: SignupPayload) => {
      await api.signup(payload);
      setSessionExpiresAt(null);
      resetSessionWarningState();
      await refresh();
    },
    [refresh, resetSessionWarningState]
  );

  const login = useCallback(
    async (countryCode: string, phone: string, password: string) => {
      await api.login(countryCode, phone, password);
      setSessionExpiresAt(null);
      resetSessionWarningState();
      await refresh();
    },
    [refresh, resetSessionWarningState]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

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

  return (
    <AuthContext.Provider value={value}>
      {children}

      <SessionExpiryModal
        open={sessionWarningOpen}
        remainingSeconds={
          sessionRemainingSeconds
        }
        loading={sessionContinueLoading}
        error={sessionContinueError}
        onContinue={() => {
          void handleContinueSession();
        }}
      />
    </AuthContext.Provider>
  );
}
