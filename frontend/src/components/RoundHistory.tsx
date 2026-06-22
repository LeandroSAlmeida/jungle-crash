import type { RoundResponseDto } from "../services/api";

interface RoundHistoryProps {
  history: RoundResponseDto[];
  limit?: number;
  wrap?: boolean;
}

function pillColor(v: number) {
  if (v < 2) return { text: "#FF4D6A", bg: "rgba(255,59,92,0.12)", border: "rgba(255,59,92,0.3)" };
  if (v < 5) return { text: "#FFB340", bg: "rgba(255,180,64,0.12)", border: "rgba(255,180,64,0.3)" };
  if (v < 10) return { text: "#6DC532", bg: "rgba(109,197,50,0.10)", border: "rgba(109,197,50,0.3)" };
  return { text: "#00E5FF", bg: "rgba(0,229,255,0.12)", border: "rgba(0,229,255,0.35)" };
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
