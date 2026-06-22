import { useCallback, useState } from "react";
import * as authService from "../services/auth";

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(authService.isAuthenticated());
  const [username, setUsername] = useState(authService.getUsername());

  const login = useCallback(() => authService.login(), []);

  const completeLogin = useCallback(async (code: string) => {
    await authService.handleCallback(code);
    setAuthenticated(true);
    setUsername(authService.getUsername());
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAuthenticated(false);
    setUsername(null);
  }, []);

  return { authenticated, username, login, completeLogin, logout };
}
