import { randomUUID } from 'crypto';
import { ProvablyFairResult } from '../value-objects/provably-fair-result';
import { InvalidRoundTransitionError } from '../errors/invalid-round-transition.error';
import { CrashDataNotRevealedError } from '../errors/crash-data-not-revealed.error';

export enum RoundPhase {
  BETTING = 'BETTING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
}

export class Round {
  private constructor(
    private readonly _id: string,
    private _phase: RoundPhase,
    private readonly _provablyFair: ProvablyFairResult,
  ) {}

  static create(): Round {
    return new Round(randomUUID(), RoundPhase.BETTING, ProvablyFairResult.generate());
  }

  start(): void {
    if (this._phase !== RoundPhase.BETTING) {
      throw new InvalidRoundTransitionError(this._phase, RoundPhase.RUNNING);
    }
    this._phase = RoundPhase.RUNNING;
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
