import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ApiError,
  getCurrentRound,
  getRoundHistory,
  type BetResponseDto,
  type RoundPhase,
  type RoundResponseDto,
} from "../services/api";
import {
  connectGameSocket,
  type BetCashedOutPayload,
  type BetPlacedPayload,
  type RoundCrashedPayload,
  type RoundCreatedPayload,
  type RoundStartedPayload,
} from "../services/socket";

export interface LiveBet {
  playerId: string;
  username: string;
  amountInCents: number;
  status: "PENDING" | "CASHED_OUT" | "LOST";
  cashoutMultiplier?: number;
  payoutInCents?: number;
}

export interface GameState {
  loading: boolean;
  roundId: string | null;
  phase: RoundPhase | null;
  hash: string | null;
  crashPoint: number | null;
  serverSeed: string | null;
  multiplier: number;
  countdownMs: number;
  liveBets: LiveBet[];
  history: RoundResponseDto[];
}

const TICK_MS = 50;

export function toLiveBet(bet: BetResponseDto): LiveBet {
  return {
    playerId: bet.playerId,
    username: bet.username ?? "anon",
    amountInCents: bet.amountInCents,
    status: bet.status === "REJECTED" ? "LOST" : (bet.status as LiveBet["status"]),
    cashoutMultiplier: bet.cashoutMultiplier,
    payoutInCents: bet.payoutInCents,
  };
}

export function useGameState(): GameState {
  const [state, setState] = useState<GameState>({
    loading: true,
    roundId: null,
    phase: null,
    hash: null,
    crashPoint: null,
    serverSeed: null,
    multiplier: 1,
    countdownMs: 0,
    liveBets: [],
    history: [],
  });

  const growthRateRef = useRef(0.000062);
  const startedAtRef = useRef<number | null>(null);
  const bettingEndsAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let round, bets, history;
      try {
        const [current, roundHistory] = await Promise.all([getCurrentRound(), getRoundHistory()]);
        round = current.round;
        bets = current.bets;
        history = roundHistory;
      } catch (error) {
        if (!cancelled) {
          if (!(error instanceof ApiError && error.status === 404)) {
            toast.error("Não foi possível carregar o jogo. Verifique sua conexão.");
          }
          setState((prev) => ({ ...prev, loading: false }));
        }
        return;
      }
      if (cancelled) {
        return;
      }
      if (round.phase === "RUNNING" && round.startedAt) {
        startedAtRef.current = new Date(round.startedAt).getTime();
        growthRateRef.current = round.growthRate ?? growthRateRef.current;
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        roundId: round.id,
        phase: round.phase,
        hash: round.hash,
        crashPoint: round.crashPoint ?? null,
        liveBets: bets.map(toLiveBet),
        history,
      }));
    })();

    const socket = connectGameSocket();

    socket.on("round.created", (payload: RoundCreatedPayload) => {
      growthRateRef.current = payload.growthRate;
      startedAtRef.current = null;
      bettingEndsAtRef.current = Date.now() + payload.bettingWindowMs;
      setState((prev) => ({
        ...prev,
        roundId: payload.roundId,
        phase: "BETTING",
        hash: payload.hash,
        crashPoint: null,
        serverSeed: null,
        multiplier: 1,
        countdownMs: payload.bettingWindowMs,
        liveBets: [],
      }));
    });

    socket.on("round.started", (payload: RoundStartedPayload) => {
      startedAtRef.current = new Date(payload.startedAt).getTime();
      setState((prev) => ({ ...prev, phase: "RUNNING", countdownMs: 0 }));
    });

    socket.on("round.crashed", (payload: RoundCrashedPayload) => {
      setState((prev) => ({
        ...prev,
        phase: "CRASHED",
        crashPoint: payload.crashPoint,
        serverSeed: payload.serverSeed,
        multiplier: payload.crashPoint,
        liveBets: prev.liveBets.map((bet) => (bet.status === "PENDING" ? { ...bet, status: "LOST" } : bet)),
        history: [
          { id: payload.roundId, phase: "CRASHED" as const, hash: prev.hash ?? "", crashPoint: payload.crashPoint },
          ...prev.history,
        ].slice(0, 20),
      }));
    });

    socket.on("bet.placed", (payload: BetPlacedPayload) => {
      setState((prev) => ({
        ...prev,
        liveBets: [
          {
            playerId: payload.playerId,
            username: payload.username ?? "anon",
            amountInCents: payload.amountInCents,
            status: "PENDING",
          },
          ...prev.liveBets,
        ],
      }));
    });

    socket.on("bet.cashed_out", (payload: BetCashedOutPayload) => {
      setState((prev) => ({
        ...prev,
        liveBets: prev.liveBets.map((bet) =>
          bet.playerId === payload.playerId
            ? { ...bet, status: "CASHED_OUT", cashoutMultiplier: payload.cashoutMultiplier, payoutInCents: payload.payoutInCents }
            : bet,
        ),
      }));
    });

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.phase === "RUNNING" && startedAtRef.current !== null) {
          const elapsedMs = Date.now() - startedAtRef.current;
          return { ...prev, multiplier: Math.exp(growthRateRef.current * elapsedMs) };
        }
        if (prev.phase === "BETTING" && bettingEndsAtRef.current !== null) {
          return { ...prev, countdownMs: Math.max(0, bettingEndsAtRef.current - Date.now()) };
        }
        return prev;
      });
    }, TICK_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return state;
}
