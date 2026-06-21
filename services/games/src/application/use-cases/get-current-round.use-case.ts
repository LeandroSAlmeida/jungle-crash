import { Inject, Injectable } from '@nestjs/common';
import { Round } from '../../domain/entities/round';
import { Bet } from '../../domain/entities/bet';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';
import { NoCurrentRoundError } from '../../domain/errors/no-current-round.error';

@Injectable()
export class GetCurrentRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(): Promise<{ round: Round; bets: Bet[] }> {
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new NoCurrentRoundError();
    }

    const bets = await this.betRepository.findByRoundId(round.id);
    return { round, bets };
  }
}
