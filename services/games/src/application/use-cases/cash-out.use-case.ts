import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROUTING_KEYS, type BetCashedOutEvent } from '@crash/contracts';
import { Bet } from '../../domain/entities/bet';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';
import { EVENT_PUBLISHER, type EventPublisher } from '../ports/event-publisher';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';
import { BetNotFoundError } from '../../domain/errors/bet-not-found.error';

@Injectable()
export class CashOutUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
    private readonly eventEmitter: EventEmitter2,
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

    const event: BetCashedOutEvent = { betId: bet.id, playerId, payoutInCents: bet.payout.cents };
    await this.eventPublisher.publish(ROUTING_KEYS.BET_CASHED_OUT, event);
    this.eventEmitter.emit('bet.cashed_out', {
      roundId,
      playerId,
      cashoutMultiplier: multiplier,
      payoutInCents: bet.payout.cents,
    });

    return bet;
  }
}
