import { Bet } from '../entities/bet';

export interface BetRepository {
  save(bet: Bet): Promise<void>;
  findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null>;
  findByRoundId(roundId: string): Promise<Bet[]>;
}

export const BET_REPOSITORY = Symbol('BetRepository');
