import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { BETTING_EXCHANGE, ROUTING_KEYS, type BetDebitFailedEvent } from '@crash/contracts';
import { RejectBetUseCase } from '../../application/use-cases/reject-bet.use-case';

@Injectable()
export class BetCompensationConsumer {
  constructor(
    private readonly orm: MikroORM,
    private readonly rejectBetUseCase: RejectBetUseCase,
  ) {}

  @RabbitSubscribe({
    exchange: BETTING_EXCHANGE,
    routingKey: ROUTING_KEYS.BET_DEBIT_FAILED,
    queue: 'games.bet_debit_failed',
  })
  async handle(event: BetDebitFailedEvent): Promise<void> {
    await RequestContext.create(this.orm.em, async () => {
      await this.rejectBetUseCase.execute(event.betId);
    });
  }
}
