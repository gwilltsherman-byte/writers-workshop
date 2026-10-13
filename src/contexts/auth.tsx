"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Me = { email: string; name: string } | null;
type Ctx = {
  me: Me;
  hydrated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({ me: null, hydrated: false, refresh: async () => {}, logout: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me>(null);
  const [hydrated, setHydrated] = useState(false);

  async function refresh() {
    try {
      const r = await fetch("/api/me", { credentials: "include" });
      if (!r.ok) throw new Error();
      const j = await r.json();
      setMe(j);
    } catch {
      setMe(null);
    } finally {
      setHydrated(true);
    }
  }
  useEffect(() => { refresh(); }, []);

  async function logout() {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    setMe(null);
  }

  return (
    <AuthCtx.Provider value={{ me, hydrated, refresh, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}