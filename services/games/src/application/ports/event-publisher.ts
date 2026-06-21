export interface EventPublisher {
  publish(routingKey: string, payload: object): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisher');
