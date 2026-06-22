import { OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MULTIPLIER_GROWTH_RATE } from '../../domain/entities/round';

interface RoundCreatedPayload {
  roundId: string;
  hash: string;
  bettingWindowMs: number;
}

interface RoundStartedPayload {
  roundId: string;
  startedAt: string;
}

interface RoundCrashedPayload {
  roundId: string;
  crashPoint: number;
  serverSeed: string;
}

interface BetPlacedPayload {
  roundId: string;
  playerId: string;
  username: string | null;
  amountInCents: number;
}

interface BetCashedOutPayload {
  roundId: string;
  playerId: string;
  username: string | null;
  cashoutMultiplier: number;
  payoutInCents: number;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class GamesGateway {
  @WebSocketServer()
  private readonly server!: Server;

  @OnEvent('round.created')
  onRoundCreated(payload: RoundCreatedPayload): void {
    this.server.emit('round.created', { ...payload, growthRate: MULTIPLIER_GROWTH_RATE });
  }

  @OnEvent('round.started')
  onRoundStarted(payload: RoundStartedPayload): void {
    this.server.emit('round.started', payload);
  }

  @OnEvent('round.crashed')
  onRoundCrashed(payload: RoundCrashedPayload): void {
    this.server.emit('round.crashed', payload);
  }

  @OnEvent('bet.placed')
  onBetPlaced(payload: BetPlacedPayload): void {
    this.server.emit('bet.placed', payload);
  }

  @OnEvent('bet.cashed_out')
  onBetCashedOut(payload: BetCashedOutPayload): void {
    this.server.emit('bet.cashed_out', payload);
  }
}
