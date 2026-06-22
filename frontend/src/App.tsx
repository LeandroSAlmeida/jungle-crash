import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { useWalletStore } from "./stores/walletStore";
import { LoginPage } from "./pages/LoginPage";
import { CallbackPage } from "./pages/CallbackPage";
import { GamePage } from "./pages/GamePage";

export function App() {
  const authenticated = useAuthStore((state) => state.authenticated);
  const login = useAuthStore((state) => state.login);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const refreshWallet = useWalletStore((state) => state.refresh);

  useEffect(() => {
    if (authenticated) {
      refreshWallet();
    }
  }, [authenticated, refreshWallet]);

  if (window.location.pathname === "/callback") {
    return <CallbackPage onCallback={completeLogin} />;
  }

  if (!authenticated) {
    return <LoginPage onLogin={login} />;
  }

  return <GamePage />;
}
