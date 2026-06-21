import { Inject, Injectable } from '@nestjs/common';
import { Bet } from '../../domain/entities/bet';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';
import { BetNotFoundError } from '../../domain/errors/bet-not-found.error';

@Injectable()
export class CashOutUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(roundId: string, playerId: string, now: Date = new Date()): Promise<Bet> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId);
    }

    const bet = await this.betRepository.findByRoundAndPlayer(roundId, playerId);
    if (!bet) {
      throw new BetNotFoundError();
    }

    const multiplier = round.currentMultiplierAt(now);
    bet.cashOut(multiplier);
    await this.betRepository.save(bet);
    return bet;
  }
}
