"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as api from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Lets the cart reload itself when the signed-in identity changes. */
export const AUTH_CHANGED_EVENT = "flexx:auth-changed";

function emitAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (isStale: () => boolean = () => false) => {
    if (!api.getAuthToken()) {
      if (isStale()) return;
      setUserState(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await api.fetchMe();
      if (isStale()) return;
      setUserState(me);
    } catch {
      if (isStale()) return;
      // Expired or tampered token - drop it.
      api.writeStorage(api.AUTH_STORAGE_KEY, null);
      setUserState(null);
    } finally {
      if (!isStale()) setIsLoading(false);
    }
  }, []);

  // Restore the session from the stored token on mount.
  useEffect(() => {
    let cancelled = false;
    // The state updates happen after the await, inside the promise, not
    // synchronously in this effect body - the lint rule cannot see through
    // the async boundary, and a stale-guard already covers unmounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login({ email, password });
    api.writeStorage(api.AUTH_STORAGE_KEY, result.accessToken);
    setUserState(result.user);
    emitAuthChanged();
    return result.user;
  }, []);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const result = await api.register(payload);
      api.writeStorage(api.AUTH_STORAGE_KEY, result.accessToken);
      setUserState(result.user);
      emitAuthChanged();
      return result.user;
    },
    [],
  );

  const logout = useCallback(() => {
    api.writeStorage(api.AUTH_STORAGE_KEY, null);
    // Drop the cart token too, so the next visitor on this browser starts
    // with an empty guest cart rather than the previous user's cart.
    api.writeStorage(api.CART_STORAGE_KEY, null);
    setUserState(null);
    emitAuthChanged();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refresh: () => refresh(),
      setUser: setUserState,
    }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
