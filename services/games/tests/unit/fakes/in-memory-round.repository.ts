import { Round, RoundPhase } from '../../../src/domain/entities/round';
import type { RoundRepository } from '../../../src/domain/repositories/round.repository';

export class InMemoryRoundRepository implements RoundRepository {
  private readonly rounds = new Map<string, Round>();

  async save(round: Round): Promise<void> {
    this.rounds.set(round.id, round);
  }

  async findById(id: string): Promise<Round | null> {
    return this.rounds.get(id) ?? null;
  }

  async findCurrent(): Promise<Round | null> {
    for (const round of this.rounds.values()) {
      if (round.phase !== RoundPhase.CRASHED) {
        return round;
      }
    }
    return null;
  }
}
