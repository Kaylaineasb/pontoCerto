import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getToken, setToken as persistToken, clearToken } from "../services/authStorage";

type AuthContextValue = {
  loading: boolean;
  token: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await getToken();
      setToken(saved);
      setLoading(false);
    })();
  }, []);

  async function signIn(newToken: string) {
    await persistToken(newToken);
    setToken(newToken);
  }

  async function signOut() {
    await clearToken();
    setToken(null);
  }

  const value = useMemo(
    () => ({ loading, token, signIn, signOut }),
    [loading, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
