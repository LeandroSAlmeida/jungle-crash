import { Inject, Injectable } from '@nestjs/common';
import { ROUTING_KEYS, type BetPlacedEvent } from '@crash/contracts';
import { Bet } from '../../domain/entities/bet';
import { Money } from '../../domain/value-objects/money';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';
import { EVENT_PUBLISHER, type EventPublisher } from '../ports/event-publisher';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';
import { RoundNotAcceptingBetsError } from '../../domain/errors/round-not-accepting-bets.error';
import { AlreadyBetThisRoundError } from '../../domain/errors/already-bet-this-round.error';

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(roundId: string, playerId: string, amountInCents: number): Promise<Bet> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId);
    }
    if (!round.canAcceptBets()) {
      throw new RoundNotAcceptingBetsError();
    }

    const existing = await this.betRepository.findByRoundAndPlayer(roundId, playerId);
    if (existing) {
      throw new AlreadyBetThisRoundError(playerId);
    }

    const bet = Bet.place(roundId, playerId, Money.fromCents(amountInCents));
    await this.betRepository.save(bet);

    const event: BetPlacedEvent = { betId: bet.id, playerId, amountInCents };
    await this.eventPublisher.publish(ROUTING_KEYS.BET_PLACED, event);

    return bet;
  }
}
