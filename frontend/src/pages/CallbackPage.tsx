import { useEffect, useRef } from "react";

interface CallbackPageProps {
  onCallback: (code: string) => Promise<void>;
}

export function CallbackPage({ onCallback }: CallbackPageProps) {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      window.location.replace("/");
      return;
    }

    onCallback(code).finally(() => {
      window.history.replaceState({}, "", "/");
    });
  }, [onCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground tracking-widest uppercase">Autenticando...</p>
    </div>
  );
}
