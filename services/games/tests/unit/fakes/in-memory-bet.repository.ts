import { Bet } from '../../../src/domain/entities/bet';
import type { BetRepository } from '../../../src/domain/repositories/bet.repository';

export class InMemoryBetRepository implements BetRepository {
  private readonly bets = new Map<string, Bet>();

  async save(bet: Bet): Promise<void> {
    this.bets.set(bet.id, bet);
  }

  async findById(id: string): Promise<Bet | null> {
    return this.bets.get(id) ?? null;
  }

  async findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null> {
    for (const bet of this.bets.values()) {
      if (bet.roundId === roundId && bet.playerId === playerId) {
        return bet;
      }
    }
    return null;
  }

  async findByRoundId(roundId: string): Promise<Bet[]> {
    return [...this.bets.values()].filter((bet) => bet.roundId === roundId);
  }

  async findByPlayerId(playerId: string, limit: number, offset: number): Promise<Bet[]> {
    const bets = [...this.bets.values()].filter((bet) => bet.playerId === playerId).reverse();
    return bets.slice(offset, offset + limit);
  }
}
