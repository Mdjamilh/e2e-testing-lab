import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin, type SessionUser } from "../api/client";
import { readJson, writeJson } from "./storage";

export const SESSION_KEY = "clinic-supplies.session";

interface Session {
  token: string;
  user: SessionUser;
}

interface AuthValue {
  session: Session | null;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readJson<Session | null>(SESSION_KEY, null));

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    writeJson(SESSION_KEY, result);
    setSession(result);
  }, []);

  const signOut = useCallback(() => {
    writeJson(SESSION_KEY, null);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
