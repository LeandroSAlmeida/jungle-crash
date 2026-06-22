import { Inject, Injectable } from '@nestjs/common';
import { Round } from '../../domain/entities/round';
import { BetStatus } from '../../domain/entities/bet';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';

@Injectable()
export class CrashRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(roundId: string): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId);
    }

    round.crash();
    await this.roundRepository.save(round);

    const bets = await this.betRepository.findByRoundId(roundId);
    for (const bet of bets) {
      if (bet.status === BetStatus.PENDING) {
        bet.markAsLost();
        await this.betRepository.save(bet);
      }
    }

    return round;
  }
}
