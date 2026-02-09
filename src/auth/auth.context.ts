import { createContext } from "react";

export type User = { id: string; email: string } | null;

export type AuthState = {
  user: User;
  subscriptionActive: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
