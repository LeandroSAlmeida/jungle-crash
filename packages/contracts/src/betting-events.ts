export interface BetPlacedEvent {
  betId: string;
  playerId: string;
  amountInCents: number;
}

export interface BetDebitedEvent {
  betId: string;
  playerId: string;
}

export interface BetDebitFailedEvent {
  betId: string;
  playerId: string;
  reason: string;
}

export interface BetCashedOutEvent {
  betId: string;
  playerId: string;
  payoutInCents: number;
}

export const ROUTING_KEYS = {
  BET_PLACED: 'bet.placed',
  BET_DEBITED: 'bet.debited',
  BET_DEBIT_FAILED: 'bet.debit_failed',
  BET_CASHED_OUT: 'bet.cashed_out',
} as const;

export const BETTING_EXCHANGE = 'crash_game.betting';
