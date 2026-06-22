import { create } from "zustand";
import * as authService from "../services/auth";

interface AuthState {
  authenticated: boolean;
  username: string | null;
  login: () => Promise<void>;
  completeLogin: (code: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: authService.isAuthenticated(),
  username: authService.getUsername(),

  login: () => authService.login(),

  completeLogin: async (code: string) => {
    await authService.handleCallback(code);
    set({ authenticated: true, username: authService.getUsername() });
  },

  logout: () => {
    authService.logout();
    set({ authenticated: false, username: null });
  },
}));
