import { ChevronRight, Loader2 } from "lucide-react";
import { useGameState } from "../hooks/useGameState";
import { useAuthStore } from "../stores/authStore";
import { useWalletStore } from "../stores/walletStore";
import { CrashChart } from "../components/CrashChart";
import { BetControls } from "../components/BetControls";
import { LiveBetsList } from "../components/LiveBetsList";
import { RoundHistory } from "../components/RoundHistory";
import { PlayerHeader } from "../components/PlayerHeader";
import { placeBet, cashOut } from "../services/api";

export function GamePage() {
  const { loading, phase, hash, multiplier, crashPoint, countdownMs, liveBets, history } = useGameState();
  const username = useAuthStore((state) => state.username);
  const logout = useAuthStore((state) => state.logout);
  const balanceInCents = useWalletStore((state) => state.balanceInCents);
  const refreshWallet = useWalletStore((state) => state.refresh);

  const myBet = liveBets.find((bet) => bet.username === username);

  const handleBet = async (amountInCents: number) => {
    await placeBet(amountInCents);
    await refreshWallet();
  };

  const handleCashout = async () => {
    await cashOut();
    await refreshWallet();
  };

  if (loading) {
    return (
      <div className="h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <PlayerHeader hash={hash} history={history} balanceInCents={balanceInCents} username={username} onLogout={logout} />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <div className="h-[42vh] shrink-0 md:h-auto md:flex-1 md:shrink flex">
          <CrashChart phase={phase} multiplier={multiplier} crashPoint={crashPoint} countdownMs={countdownMs} />
        </div>

        <div
          className="flex-1 md:flex-none md:w-72 xl:w-80 flex flex-col border-t md:border-t-0 md:border-l border-border overflow-hidden min-h-0"
          style={{ background: "#070E0A" }}
        >
          <BetControls
            phase={phase}
            multiplier={multiplier}
            countdownMs={countdownMs}
            myBet={myBet}
            balanceInCents={balanceInCents}
            onBet={handleBet}
            onCashout={handleCashout}
          />

          <LiveBetsList bets={liveBets} currentUsername={username} />

          <div className="hidden md:block shrink-0 border-t border-border px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <ChevronRight size={8} className="text-muted-foreground/30" />
              <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest">Últimas rodadas</span>
            </div>
            <RoundHistory history={history} limit={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
