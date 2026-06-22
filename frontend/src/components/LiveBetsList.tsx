import { Users } from "lucide-react";
import type { LiveBet } from "../hooks/useGameState";

interface LiveBetsListProps {
  bets: LiveBet[];
  currentUsername: string | null;
}

export function LiveBetsList({ bets, currentUsername }: LiveBetsListProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col" style={{ scrollbarWidth: "none" }}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-border" style={{ background: "#070E0A" }}>
        <div className="flex items-center gap-2">
          <Users size={10} className="text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">Apostas da Rodada</span>
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(109,197,50,0.1)", color: "#6DC532", border: "1px solid rgba(109,197,50,0.2)" }}
        >
          {bets.length}
        </span>
      </div>

      <div className="flex-1">
        {bets.map((bet, i) => {
          const isMe = bet.username === currentUsername;
          const isCashed = bet.status === "CASHED_OUT";
          const isLost = bet.status === "LOST";
          return (
            <div
              key={`${bet.playerId}-${i}`}
              className="flex items-center justify-between px-4 py-2.5 transition-all duration-300"
              style={{
                background: isCashed ? "rgba(109,197,50,0.04)" : isLost ? "rgba(255,59,92,0.03)" : "transparent",
                borderBottomWidth: "1px",
                borderBottomStyle: "solid",
                borderBottomColor: isCashed ? "rgba(109,197,50,0.08)" : isLost ? "rgba(255,59,92,0.08)" : "rgba(20,38,24,0.8)",
                borderLeftWidth: "2px",
                borderLeftStyle: "solid",
                borderLeftColor: isMe ? "rgba(109,197,50,0.5)" : isCashed ? "rgba(109,197,50,0.25)" : isLost ? "rgba(255,59,92,0.2)" : "transparent",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                  style={
                    isMe
                      ? { background: "rgba(109,197,50,0.15)", border: "1px solid rgba(109,197,50,0.35)", color: "#6DC532" }
                      : isCashed
                        ? { background: "rgba(109,197,50,0.08)", border: "1px solid rgba(109,197,50,0.15)", color: "#00C060" }
                        : isLost
                          ? { background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.15)", color: "#FF4060" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#3A5A42" }
                  }
                >
                  {bet.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div
                    className="text-[11px] font-bold truncate"
                    style={{ color: isMe ? "#6DC532" : isCashed ? "#5FD88A" : isLost ? "#FF6070" : "#547060" }}
                  >
                    {bet.username}
                  </div>
                  {isCashed && bet.cashoutMultiplier !== undefined && (
                    <div className="text-[9px]" style={{ color: "#00C060" }}>
                      sacou @ {bet.cashoutMultiplier.toFixed(2)}x
                    </div>
                  )}
                  {isLost && <div className="text-[9px] text-red-400/50">perdeu</div>}
                  {bet.status === "PENDING" && <div className="text-[9px] text-muted-foreground/30">em jogo</div>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: isMe ? "#6DC532" : isCashed ? "#5FD88A" : isLost ? "#FF5565" : "#3A5A42" }}
                >
                  R$ {(bet.amountInCents / 100).toFixed(2)}
                </div>
                {isCashed && bet.payoutInCents !== undefined && (
                  <div className="text-[9px] tabular-nums" style={{ color: "#00C060" }}>
                    +R$ {((bet.payoutInCents - bet.amountInCents) / 100).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
