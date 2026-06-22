import { io, type Socket } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RoundCreatedPayload {
  roundId: string;
  hash: string;
  bettingWindowMs: number;
  growthRate: number;
}

export interface RoundStartedPayload {
  roundId: string;
  startedAt: string;
}

export interface RoundCrashedPayload {
  roundId: string;
  crashPoint: number;
  serverSeed: string;
}

export interface BetPlacedPayload {
  roundId: string;
  playerId: string;
  username: string | null;
  amountInCents: number;
}

export interface BetCashedOutPayload {
  roundId: string;
  playerId: string;
  username: string | null;
  cashoutMultiplier: number;
  payoutInCents: number;
}

export interface GameSocketEvents {
  "round.created": (payload: RoundCreatedPayload) => void;
  "round.started": (payload: RoundStartedPayload) => void;
  "round.crashed": (payload: RoundCrashedPayload) => void;
  "bet.placed": (payload: BetPlacedPayload) => void;
  "bet.cashed_out": (payload: BetCashedOutPayload) => void;
}

export function connectGameSocket(): Socket {
  return io(API_BASE_URL, { path: "/games/socket.io/" });
}
