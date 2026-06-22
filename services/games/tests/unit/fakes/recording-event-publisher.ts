import type { EventPublisher } from '../../../src/application/ports/event-publisher';

export class RecordingEventPublisher implements EventPublisher {
  readonly published: { routingKey: string; payload: object }[] = [];

  async publish(routingKey: string, payload: object): Promise<void> {
    this.published.push({ routingKey, payload });
  }
}
