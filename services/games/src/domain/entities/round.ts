import { randomUUID } from 'crypto';
import { ProvablyFairResult } from '../value-objects/provably-fair-result';
import { InvalidRoundTransitionError } from '../errors/invalid-round-transition.error';
import { CrashDataNotRevealedError } from '../errors/crash-data-not-revealed.error';
import { RoundNotRunningError } from '../errors/round-not-running.error';

export enum RoundPhase {
  BETTING = 'BETTING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
}

export const MULTIPLIER_GROWTH_RATE = 0.000062;

export class Round {
  private _startedAt: Date | null = null;

  private constructor(
    private readonly _id: string,
    private _phase: RoundPhase,
    private readonly _provablyFair: ProvablyFairResult,
    private readonly _previousRoundId: string | null,
  ) {}

  static create(previousRound?: { id: string; serverSeed: string }): Round {
    return new Round(
      randomUUID(),
      RoundPhase.BETTING,
      ProvablyFairResult.generate(previousRound?.serverSeed),
      previousRound?.id ?? null,
    );
  }

  static restore(
    id: string,
    phase: RoundPhase,
    provablyFair: ProvablyFairResult,
    startedAt: Date | null,
    previousRoundId: string | null,
  ): Round {
    const round = new Round(id, phase, provablyFair, previousRoundId);
    round._startedAt = startedAt;
    return round;
  }

  toSnapshot(): {
    id: string;
    phase: RoundPhase;
    hash: string;
    serverSeed: string;
    crashPoint: number;
    startedAt: Date | null;
    previousRoundId: string | null;
  } {
    return {
      id: this._id,
      phase: this._phase,
      hash: this._provablyFair.hash,
      serverSeed: this._provablyFair.serverSeed,
      crashPoint: this._provablyFair.crashPoint,
      startedAt: this._startedAt,
      previousRoundId: this._previousRoundId,
    };
  }

  start(startedAt: Date): void {
    if (this._phase !== RoundPhase.BETTING) {
      throw new InvalidRoundTransitionError(this._phase, RoundPhase.RUNNING);
    }
    this._phase = RoundPhase.RUNNING;
    this._startedAt = startedAt;
  }

  currentMultiplierAt(now: Date): number {
    if (this._phase !== RoundPhase.RUNNING || this._startedAt === null) {
      throw new RoundNotRunningError();
    }
    const elapsedMs = now.getTime() - this._startedAt.getTime();
    return Math.exp(MULTIPLIER_GROWTH_RATE * elapsedMs);
  }

  crash(): void {
    if (this._phase !== RoundPhase.RUNNING) {
      throw new InvalidRoundTransitionError(this._phase, RoundPhase.CRASHED);
    }
    this._phase = RoundPhase.CRASHED;
  }

  canAcceptBets(): boolean {
    return this._phase === RoundPhase.BETTING;
  }

  hasReachedCrashPoint(currentMultiplier: number): boolean {
    return currentMultiplier >= this._provablyFair.crashPoint;
  }

  get id(): string {
    return this._id;
  }

  get phase(): RoundPhase {
    return this._phase;
  }

  get hash(): string {
    return this._provablyFair.hash;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get previousRoundId(): string | null {
    return this._previousRoundId;
  }

  get crashPoint(): number {
    this.ensureCrashed();
    return this._provablyFair.crashPoint;
  }

  get serverSeed(): string {
    this.ensureCrashed();
    return this._provablyFair.serverSeed;
  }

  private ensureCrashed(): void {
    if (this._phase !== RoundPhase.CRASHED) {
      throw new CrashDataNotRevealedError();
    }
  }
}
