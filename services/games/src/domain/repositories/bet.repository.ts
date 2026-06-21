import { Bet } from '../entities/bet';

export interface BetRepository {
  save(bet: Bet): Promise<void>;
  findById(id: string): Promise<Bet | null>;
  findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null>;
  findByRoundId(roundId: string): Promise<Bet[]>;
  findByPlayerId(playerId: string, limit: number, offset: number): Promise<Bet[]>;
}

export const BET_REPOSITORY = Symbol('BetRepository');
