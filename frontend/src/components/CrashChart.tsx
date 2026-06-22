import { useEffect, useRef, useState } from "react";
import type { RoundPhase } from "../services/api";

interface CrashChartProps {
  phase: RoundPhase | null;
  multiplier: number;
  crashPoint: number | null;
  countdownMs: number;
}

interface Point {
  t: number;
  m: number;
}

const SVG_W = 800;
const SVG_H = 340;
const PAD_L = 8;
const PAD_B = 16;
const PAD_T = 20;

function toPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) {
    return "";
  }
  return pts.reduce((d, p, i) => (i === 0 ? `M${p.x.toFixed(1)},${p.y.toFixed(1)}` : `${d}L${p.x.toFixed(1)},${p.y.toFixed(1)}`), "");
}

function toArea(pts: { x: number; y: number }[], baseY: number) {
  const line = toPath(pts);
  if (!line || pts.length < 2) {
    return "";
  }
  return `${line}L${pts[pts.length - 1].x.toFixed(1)},${baseY}L${pts[0].x.toFixed(1)},${baseY}Z`;
}

export function CrashChart({ phase, multiplier, crashPoint, countdownMs }: CrashChartProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const startRef = useRef<number | null>(null);

  const liveMultiplier = Number.isFinite(multiplier) ? multiplier : 1;

  useEffect(() => {
    if (phase === "BETTING") {
      setPoints([]);
      startRef.current = null;
      return;
    }
    if (phase === "RUNNING") {
      if (startRef.current === null) {
        startRef.current = performance.now();
      }
      const elapsed = performance.now() - startRef.current;
      setPoints((prev) => [...prev.slice(-400), { t: elapsed, m: liveMultiplier }]);
    }
  }, [phase, liveMultiplier]);

  const crashed = phase === "CRASHED";
  const lastPt = points[points.length - 1];
  const maxT = Math.max((lastPt?.t ?? 0) * 1.06, 5000);
  const maxM = Math.max(liveMultiplier * 1.28, 2.1);

  const svgPts = points.map(({ t, m }) => ({
    x: PAD_L + (t / maxT) * (SVG_W - PAD_L - 8),
    y: SVG_H - PAD_B - Math.max(0, ((m - 1) / Math.max(maxM - 1, 0.01)) * (SVG_H - PAD_B - PAD_T)),
  }));

  const linePath = toPath(svgPts);
  const areaPath = toArea(svgPts, SVG_H - PAD_B);
  const lastSvgPt = svgPts[svgPts.length - 1];

  const lineColor = crashed ? "#FF3B5C" : "#6DC532";
  const glowHex = crashed ? "255,59,92" : "109,197,50";
  const multDisplay = crashed ? (crashPoint?.toFixed(2) ?? "?") : liveMultiplier.toFixed(2);
  const yGridVals = [1.5, 2, 3, 5, 10, 25].filter((v) => v < maxM * 0.92);
  const countdownSeconds = Math.ceil(countdownMs / 1000);

  return (
    <div
      className="flex-1 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 70% at 20% 80%, #091808 0%, #060A0D 55%, #04080B 100%)" }}
    >
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
            <stop offset="80%" stopColor={lineColor} stopOpacity="0.02" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yGridVals.map((v) => {
          const y = SVG_H - PAD_B - ((v - 1) / Math.max(maxM - 1, 0.01)) * (SVG_H - PAD_B - PAD_T);
          if (y < 10 || y > SVG_H - 10) {
            return null;
          }
          return (
            <g key={v}>
              <line x1={PAD_L} y1={y} x2={SVG_W} y2={y} stroke="#0E2218" strokeWidth="1" strokeDasharray="8,6" />
              <text x={PAD_L + 4} y={y - 4} fill="#1E4030" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {v}x
              </text>
            </g>
          );
        })}

        <line x1={PAD_L} y1={SVG_H - PAD_B} x2={SVG_W} y2={SVG_H - PAD_B} stroke="#0E2218" strokeWidth="1" />

        {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

        {linePath && (
          <>
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" opacity="0.03" />
            <path d={linePath} fill="none" stroke={lineColor} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" opacity="0.07" />
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.9"
              filter="url(#glow)"
            />
          </>
        )}

        {crashed && lastSvgPt && (
          <line
            x1={lastSvgPt.x}
            y1={lastSvgPt.y}
            x2={lastSvgPt.x}
            y2={SVG_H - PAD_B}
            stroke="#FF3B5C"
            strokeWidth="1.5"
            strokeDasharray="5,4"
            opacity="0.45"
          />
        )}

        {phase === "RUNNING" && lastSvgPt && (
          <g>
            <circle cx={lastSvgPt.x} cy={lastSvgPt.y} r="3" fill={lineColor} filter="url(#strongGlow)" />
            <circle cx={lastSvgPt.x} cy={lastSvgPt.y} r="5" fill="none" stroke={lineColor} strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" values="5;18;5" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <circle cx={lastSvgPt.x} cy={lastSvgPt.y} r="5" fill="none" stroke={lineColor} strokeWidth="1" opacity="0.35">
              <animate attributeName="r" values="5;22;5" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{ paddingBottom: "10%" }}>
        {phase === "BETTING" ? (
          <div className="text-center space-y-2">
            <div
              className="text-4xl md:text-5xl font-black tracking-[0.12em] uppercase"
              style={{ fontFamily: "'Orbitron', monospace", color: "rgba(184,212,192,0.12)" }}
            >
              AGUARDANDO
            </div>
            <div
              className="text-5xl md:text-7xl font-black tabular-nums"
              style={{ fontFamily: "'Orbitron', monospace", color: "rgba(109,197,50,0.18)" }}
            >
              {countdownSeconds}s
            </div>
            <div className="text-[10px] text-muted-foreground/20 tracking-[0.3em] uppercase">Fase de apostas</div>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <div
              className="font-black tabular-nums leading-none"
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "clamp(4rem, 12vw, 8rem)",
                color: lineColor,
                textShadow: `0 0 30px rgba(${glowHex},0.8), 0 0 60px rgba(${glowHex},0.4), 0 0 100px rgba(${glowHex},0.2)`,
                animation: crashed ? "crashShake 0.4s ease-out" : phase === "RUNNING" ? "neonPulse 2s ease-in-out infinite" : "none",
              }}
            >
              {multDisplay}x
            </div>
            {crashed && (
              <div
                className="text-sm font-bold tracking-[0.4em] uppercase"
                style={{ color: "#FF4D6A", textShadow: "0 0 12px rgba(255,59,92,0.6)", fontFamily: "'Orbitron', monospace" }}
              >
                CRASHED!
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes neonPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        @keyframes crashShake {
          0%, 100% { transform: translateX(0) scale(1); }
          20% { transform: translateX(-6px) scale(1.02); }
          40% { transform: translateX(6px) scale(1.02); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
