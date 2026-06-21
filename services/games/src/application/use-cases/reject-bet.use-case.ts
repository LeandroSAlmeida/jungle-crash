import { Inject, Injectable } from '@nestjs/common';
import { Bet } from '../../domain/entities/bet';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';
import { BetNotFoundError } from '../../domain/errors/bet-not-found.error';

@Injectable()
export class RejectBetUseCase {
  constructor(@Inject(BET_REPOSITORY) private readonly betRepository: BetRepository) {}

  async execute(betId: string): Promise<Bet> {
    const bet = await this.betRepository.findById(betId);
    if (!bet) {
      throw new BetNotFoundError();
    }

    bet.reject();
    await this.betRepository.save(bet);
    return bet;
  }
}
