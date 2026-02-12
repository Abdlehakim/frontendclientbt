import React from "react";
import type { BillingCycle, ModuleKey, Plan, UserDTO } from "@/lib/api";

export type AuthUser = UserDTO | null;

export type AuthState = {
  user: AuthUser;
  loading: boolean;

  subscriptionActive: boolean;

  subscription: {
    status: string | null;
    plan: Plan | null;
    billingCycle: BillingCycle | null;
    seats: number | null;
    currentPeriodEnd: string | null;
    expired: boolean;
    valid: boolean;
  } | null;

  plan: Plan | null;
  modules: ModuleKey[];
  onboardingComplete: boolean;

  refresh: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthState | null>(null);
