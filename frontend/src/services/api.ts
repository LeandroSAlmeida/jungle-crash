import { getAccessToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type RoundPhase = "BETTING" | "RUNNING" | "CRASHED";

export interface RoundResponseDto {
  id: string;
  phase: RoundPhase;
  hash: string;
  crashPoint?: number;
  startedAt?: string;
  growthRate?: number;
}

export type BetStatus = "PENDING" | "CASHED_OUT" | "LOST" | "REJECTED";

export interface BetResponseDto {
  id: string;
  roundId: string;
  playerId: string;
  username?: string;
  amountInCents: number;
  status: BetStatus;
  cashoutMultiplier?: number;
  payoutInCents?: number;
}

interface WalletResponseDto {
  id: string;
  playerId: string;
  balanceInCents: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(body.message ?? `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export function getCurrentRound(): Promise<{ round: RoundResponseDto; bets: BetResponseDto[] }> {
  return apiFetch("/games/rounds/current");
}

export function getRoundHistory(limit = 20): Promise<RoundResponseDto[]> {
  return apiFetch(`/games/rounds/history?limit=${limit}`);
}

export function placeBet(amountInCents: number): Promise<BetResponseDto> {
  return apiFetch("/games/bet", { method: "POST", body: JSON.stringify({ amountInCents }) });
}

export function cashOut(): Promise<BetResponseDto> {
  return apiFetch("/games/bet/cashout", { method: "POST" });
}

export function getWallet(): Promise<WalletResponseDto> {
  return apiFetch("/wallets/me");
}

export function createWallet(): Promise<WalletResponseDto> {
  return apiFetch("/wallets", { method: "POST" });
}
