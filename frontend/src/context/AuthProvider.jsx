import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearToken,
  login as loginRequest,
  me,
  readToken,
  register as registerRequest,
  setUnauthorizedHandler,
  writeToken,
} from "../lib/api";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
  // A stored token is only proof of a session if the server still agrees, so it
  // is exchanged for the real user on load rather than trusted on its own.
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(readToken()));

  useEffect(() => setUnauthorizedHandler(() => setUser(null)), []);

  useEffect(() => {
    if (!readToken()) return;

    let active = true;

    me()
      .then((res) => active && setUser(res.data.user))
      .catch(() => {
        if (active) clearToken();
      })
      .finally(() => active && setChecking(false));

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const res = await loginRequest(payload);
    writeToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await registerRequest(payload);
    writeToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, checking, login, register, logout }),
    [user, checking, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
