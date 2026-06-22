import { Zap, Hash, Wallet } from "lucide-react";
import { RoundHistory } from "./RoundHistory";
import type { RoundResponseDto } from "../services/api";

interface PlayerHeaderProps {
  hash: string | null;
  history: RoundResponseDto[];
  balanceInCents: number | null;
  username: string | null;
  onLogout: () => void;
}

export function PlayerHeader({ hash, history, balanceInCents, username, onLogout }: PlayerHeaderProps) {
  return (
    <header
      className="shrink-0 flex items-center justify-between px-5 h-11 border-b border-border z-20"
      style={{ background: "linear-gradient(180deg, #07100D 0%, #060A0D 100%)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary" style={{ filter: "drop-shadow(0 0 6px #6DC532)" }} />
          <span className="text-sm font-black tracking-[0.18em] text-primary uppercase" style={{ textShadow: "0 0 16px rgba(109,197,50,0.6)" }}>
            CRASH
          </span>
          <span className="text-sm font-black tracking-[0.18em] text-foreground/30 uppercase">GAME</span>
        </div>
        {hash && (
          <div className="hidden md:flex items-center gap-1.5 ml-3 pl-3 border-l border-border">
            <Hash size={9} className="text-muted-foreground/50" />
            <span className="text-[9px] text-muted-foreground/40 font-mono">{hash.slice(0, 20)}…</span>
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-md" style={{ scrollbarWidth: "none" }}>
        <RoundHistory history={history} limit={10} />
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded border"
          style={{ background: "rgba(109,197,50,0.06)", borderColor: "rgba(109,197,50,0.2)" }}
        >
          <Wallet size={11} className="text-primary" />
          <span className="text-xs font-bold text-primary">R$ {((balanceInCents ?? 0) / 100).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-black"
            style={{ background: "rgba(109,197,50,0.1)", border: "1px solid rgba(109,197,50,0.25)", color: "#6DC532" }}
          >
            {(username ?? "??").slice(0, 2).toUpperCase()}
          </div>
          <span className="hidden sm:block text-[10px] text-muted-foreground/60">{username}</span>
          <button
            onClick={onLogout}
            className="ml-1 text-[9px] text-muted-foreground/30 hover:text-red-400/70 transition-colors px-1.5 py-1 rounded"
            title="Sair"
          >
            sair
          </button>
        </div>
      </div>
    </header>
  );
}
