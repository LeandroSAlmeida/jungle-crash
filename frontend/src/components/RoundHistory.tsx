import type { RoundResponseDto } from "../services/api";
import { pillColor } from "../lib/pillColor";

interface RoundHistoryProps {
  history: RoundResponseDto[];
  limit?: number;
  wrap?: boolean;
}

export function RoundHistory({ history, limit = 12, wrap = true }: RoundHistoryProps) {
  return (
    <div className={wrap ? "flex flex-wrap gap-1.5" : "flex flex-nowrap gap-1.5"}>
      {history.slice(0, limit).map((round) => {
        if (round.crashPoint === undefined) {
          return null;
        }
        const c = pillColor(round.crashPoint);
        return (
          <span
            key={round.id}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
          >
            {round.crashPoint.toFixed(2)}x
          </span>
        );
      })}
    </div>
  );
}
