import { useEffect, useRef, useState } from "react";
import { Shield, Clock, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import type { RoundPhase } from "../services/api";
import type { LiveBet } from "../hooks/useGameState";

const PRESETS = [10, 25, 50, 100];

interface BetControlsProps {
  phase: RoundPhase | null;
  multiplier: number;
  countdownMs: number;
  myBet: LiveBet | undefined;
  balanceInCents: number | null;
  onBet: (amountInCents: number) => Promise<void>;
  onCashout: () => Promise<void>;
}

export function BetControls({ phase, multiplier, countdownMs, myBet, balanceInCents, onBet, onCashout }: BetControlsProps) {
  const [amount, setAmount] = useState("50");
  const [pending, setPending] = useState(false);
  const [autoCashoutTarget, setAutoCashoutTarget] = useState("");
  const autoTriggeredRef = useRef(false);

  const canBet = phase === "BETTING" && !myBet && !pending;
  const canCashout = phase === "RUNNING" && myBet?.status === "PENDING" && !pending;

  const amountInCents = Math.round(parseFloat(amount) * 100);
  const liveMultiplier = Number.isFinite(multiplier) ? multiplier : 1;
  const potentialWinCents = myBet ? myBet.amountInCents * liveMultiplier : null;

  const handleBet = async () => {
    if (!canBet || isNaN(amountInCents) || amountInCents < 100 || amountInCents > 100000) {
      toast.error("Valor de aposta inválido. Use entre R$ 1,00 e R$ 1.000,00.");
      return;
    }
    if (balanceInCents !== null && amountInCents > balanceInCents) {
      toast.error("Saldo insuficiente para essa aposta.");
      return;
    }
    setPending(true);
    try {
      await onBet(amountInCents);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a aposta.");
    } finally {
      setPending(false);
    }
  };

  const handleCashout = async () => {
    if (!canCashout) {
      return;
    }
    setPending(true);
    try {
      await onCashout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sacar agora.");
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    if (myBet?.status !== "PENDING") {
      autoTriggeredRef.current = false;
    }
  }, [myBet?.status, myBet?.playerId]);

  useEffect(() => {
    const target = parseFloat(autoCashoutTarget);
    if (autoTriggeredRef.current || !canCashout || isNaN(target) || target <= 1) {
      return;
    }
    if (liveMultiplier >= target) {
      autoTriggeredRef.current = true;
      handleCashout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMultiplier, canCashout, autoCashoutTarget]);

  const countdownSeconds = Math.ceil(countdownMs / 1000);

  return (
    <div className="shrink-0 p-4 space-y-3.5 border-b border-border">
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-muted-foreground/50 uppercase tracking-widest">Sua Aposta</span>
        <div className="flex items-center gap-1 text-muted-foreground/30">
          <Shield size={8} />
          <span>Provably Fair</span>
        </div>
      </div>

      <div>
        <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1.5">Valor da Aposta</div>
        <div className="relative rounded overflow-hidden" style={{ background: "rgba(109,197,50,0.04)", border: "1px solid rgba(109,197,50,0.12)" }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs">R$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max="1000"
            step="5"
            disabled={!canBet}
            className="w-full bg-transparent text-right text-xl font-black pr-3 py-3 pl-10 focus:outline-none disabled:opacity-30 transition-opacity tabular-nums"
            style={{ color: canBet ? "#6DC532" : "#426050", fontFamily: "'Orbitron', monospace" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {PRESETS.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            disabled={!canBet}
            className="py-1.5 rounded text-xs font-bold transition-all duration-150 disabled:opacity-25"
            style={
              amount === String(v) && canBet
                ? { background: "rgba(109,197,50,0.18)", border: "1px solid rgba(109,197,50,0.4)", color: "#6DC532" }
                : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#426050" }
            }
          >
            {v}
          </button>
        ))}
      </div>

      <div>
        <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <Zap size={9} />
          Auto Cashout (opcional)
        </div>
        <div className="relative rounded overflow-hidden" style={{ background: "rgba(109,197,50,0.04)", border: "1px solid rgba(109,197,50,0.12)" }}>
          <input
            type="number"
            value={autoCashoutTarget}
            onChange={(e) => setAutoCashoutTarget(e.target.value)}
            min="1.01"
            step="0.1"
            placeholder="ex: 2.00"
            disabled={pending}
            className="w-full bg-transparent text-sm font-bold px-3 py-2 focus:outline-none disabled:opacity-30 transition-opacity tabular-nums"
            style={{ color: "#6DC532", fontFamily: "'Orbitron', monospace" }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs">x</span>
        </div>
      </div>

      {canCashout ? (
        <Button variant="cashout" onClick={handleCashout}>
          SACAR · R$ {((potentialWinCents ?? 0) / 100).toFixed(2)}
        </Button>
      ) : (
        <Button variant={canBet ? "primary" : "ghost"} onClick={handleBet} disabled={!canBet}>
          {myBet
            ? myBet.status === "LOST"
              ? "PERDEU"
              : myBet.status === "CASHED_OUT"
                ? "✓ SACADO"
                : "APOSTA ATIVA"
            : phase === "BETTING"
              ? "APOSTAR"
              : "AGUARDANDO…"}
        </Button>
      )}

      <div className="h-3.5 flex items-center justify-center">
        {phase === "BETTING" && !myBet && (
          <span className="text-[9px] text-yellow-500/50 flex items-center gap-1">
            <Clock size={8} />
            {countdownSeconds}s restantes para apostar
          </span>
        )}
        {canCashout && potentialWinCents !== null && (
          <span className="text-[9px] text-emerald-400/60">
            Ganho potencial · <strong className="text-emerald-400">R$ {(potentialWinCents / 100).toFixed(2)}</strong>
            {!isNaN(parseFloat(autoCashoutTarget)) && parseFloat(autoCashoutTarget) > 1 && (
              <> · auto @ {parseFloat(autoCashoutTarget).toFixed(2)}x</>
            )}
          </span>
        )}
        {myBet?.status === "CASHED_OUT" && myBet.payoutInCents !== undefined && (
          <span className="text-[9px] text-emerald-400/80">+R$ {(myBet.payoutInCents / 100).toFixed(2)}</span>
        )}
        {myBet?.status === "LOST" && (
          <span className="text-[9px] text-red-400/70">Aposta perdida · -R$ {(myBet.amountInCents / 100).toFixed(2)}</span>
        )}
      </div>
    </div>
  );
}
