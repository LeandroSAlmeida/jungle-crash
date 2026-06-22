import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { useWalletStore } from "./stores/walletStore";
import { LoginPage } from "./pages/LoginPage";
import { CallbackPage } from "./pages/CallbackPage";

export function App() {
  const authenticated = useAuthStore((state) => state.authenticated);
  const username = useAuthStore((state) => state.username);
  const login = useAuthStore((state) => state.login);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const logout = useAuthStore((state) => state.logout);
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

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-primary text-2xl font-bold">Bem-vindo, {username}</p>
        <button onClick={logout} className="text-sm text-muted-foreground underline">
          Sair
        </button>
      </div>
    </div>
  );
}
