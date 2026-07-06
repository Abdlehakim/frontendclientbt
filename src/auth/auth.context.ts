import React from "react";
import type { BillingCycle, ModuleKey, Plan, SignupPayload, SubModuleKey, UserDTO } from "@/lib/api";

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
    accountName?: string | null;
    currentPeriodEnd: string | null;
    expired: boolean;
    valid: boolean;
  } | null;

  plan: Plan | null;
  modules: ModuleKey[];
  subModules: SubModuleKey[];
  onboardingComplete: boolean;

  refresh: () => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (countryCode: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = React.createContext<AuthState | null>(null);
