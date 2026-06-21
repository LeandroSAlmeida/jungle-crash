import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { CreateRoundUseCase } from '../../application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from '../../application/use-cases/crash-round.use-case';

const BETTING_WINDOW_MS = Number(process.env.ROUND_BETTING_WINDOW_MS ?? 10000);
const REVEAL_DELAY_MS = Number(process.env.ROUND_REVEAL_DELAY_MS ?? 3000);
const TICK_INTERVAL_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class GameLoopService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(GameLoopService.name);
  private running = false;

  constructor(
    private readonly orm: MikroORM,
    private readonly eventEmitter: EventEmitter2,
    private readonly createRoundUseCase: CreateRoundUseCase,
    private readonly startRoundUseCase: StartRoundUseCase,
    private readonly crashRoundUseCase: CrashRoundUseCase,
  ) {}

  onApplicationBootstrap(): void {
    this.running = true;
    void this.runLoop();
  }

  onApplicationShutdown(): void {
    this.running = false;
  }

  private async runLoop(): Promise<void> {
    while (this.running) {
      try {
        await RequestContext.create(this.orm.em, () => this.playOneRound());
      } catch (error) {
        this.logger.error(`Game loop iteration failed: ${error}`);
        await sleep(1000);
      }
    }
  }

  private async playOneRound(): Promise<void> {
    const created = await this.createRoundUseCase.execute();
    this.logger.log(`Round ${created.id} created, betting phase open for ${BETTING_WINDOW_MS}ms`);
    this.eventEmitter.emit('round.created', {
      roundId: created.id,
      hash: created.hash,
      bettingWindowMs: BETTING_WINDOW_MS,
    });
    await sleep(BETTING_WINDOW_MS);

    const startedAt = new Date();
    const running = await this.startRoundUseCase.execute(created.id, startedAt);
    this.logger.log(`Round ${running.id} started`);
    this.eventEmitter.emit('round.started', { roundId: running.id, startedAt: startedAt.toISOString() });

    while (this.running) {
      const multiplier = running.currentMultiplierAt(new Date());
      if (running.hasReachedCrashPoint(multiplier)) {
        break;
      }
      await sleep(TICK_INTERVAL_MS);
    }

    const crashed = await this.crashRoundUseCase.execute(running.id);
    this.logger.log(`Round ${crashed.id} crashed`);
    this.eventEmitter.emit('round.crashed', {
      roundId: crashed.id,
      crashPoint: crashed.crashPoint,
      serverSeed: crashed.serverSeed,
    });

    await sleep(REVEAL_DELAY_MS);
  }
}
