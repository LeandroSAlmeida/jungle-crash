import { Inject, Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import {
  BETTING_EXCHANGE,
  ROUTING_KEYS,
  type BetCashedOutEvent,
  type BetDebitFailedEvent,
  type BetPlacedEvent,
} from '@crash/contracts';
import { CreditWalletUseCase } from '../../application/use-cases/credit-wallet.use-case';
import { DebitWalletUseCase } from '../../application/use-cases/debit-wallet.use-case';
import { EVENT_PUBLISHER, type EventPublisher } from '../../application/ports/event-publisher';

@Injectable()
export class BettingEventsConsumer {
  private readonly logger = new Logger(BettingEventsConsumer.name);

  constructor(
    private readonly orm: MikroORM,
    private readonly debitWalletUseCase: DebitWalletUseCase,
    private readonly creditWalletUseCase: CreditWalletUseCase,
    @Inject(EVENT_PUBLISHER) private readonly eventPublisher: EventPublisher,
  ) {}

  @RabbitSubscribe({
    exchange: BETTING_EXCHANGE,
    routingKey: ROUTING_KEYS.BET_PLACED,
    queue: 'wallets.bet_placed',
  })
  async onBetPlaced(event: BetPlacedEvent): Promise<void> {
    await RequestContext.create(this.orm.em, async () => {
      try {
        await this.debitWalletUseCase.execute(event.playerId, event.amountInCents);
        await this.eventPublisher.publish(ROUTING_KEYS.BET_DEBITED, {
          betId: event.betId,
          playerId: event.playerId,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        const failedEvent: BetDebitFailedEvent = { betId: event.betId, playerId: event.playerId, reason };
        await this.eventPublisher.publish(ROUTING_KEYS.BET_DEBIT_FAILED, failedEvent);
      }
    });
  }

  @RabbitSubscribe({
    exchange: BETTING_EXCHANGE,
    routingKey: ROUTING_KEYS.BET_CASHED_OUT,
    queue: 'wallets.bet_cashed_out',
  })
  async onBetCashedOut(event: BetCashedOutEvent): Promise<void> {
    await RequestContext.create(this.orm.em, async () => {
      try {
        await this.creditWalletUseCase.execute(event.playerId, event.payoutInCents);
      } catch (error) {
        this.logger.error(
          `Failed to credit payout for bet ${event.betId} (player ${event.playerId}): ${error}`,
        );
      }
    });
  }
}
