import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { CallbackPage } from "./pages/CallbackPage";

export function App() {
  const { authenticated, username, login, completeLogin, logout } = useAuth();

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
