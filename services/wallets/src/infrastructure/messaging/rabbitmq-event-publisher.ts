import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BETTING_EXCHANGE } from '@crash/contracts';
import type { EventPublisher } from '../../application/ports/event-publisher';

@Injectable()
export class RabbitMqEventPublisher implements EventPublisher {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(routingKey: string, payload: object): Promise<void> {
    await this.amqpConnection.publish(BETTING_EXCHANGE, routingKey, payload);
  }
}
