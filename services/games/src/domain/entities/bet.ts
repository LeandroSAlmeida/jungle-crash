import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money';
import { InvalidBetAmountError } from '../errors/invalid-bet-amount.error';
import { BetNotPendingError } from '../errors/bet-not-pending.error';
import { BetNotCashedOutError } from '../errors/bet-not-cashed-out.error';

export enum BetStatus {
  PENDING = 'PENDING',
  CASHED_OUT = 'CASHED_OUT',
  LOST = 'LOST',
  REJECTED = 'REJECTED',
}

export class Bet {
  static readonly MIN_AMOUNT_CENTS = 100;
  static readonly MAX_AMOUNT_CENTS = 100000;

  private constructor(
    private readonly _id: string,
    private readonly _roundId: string,
    private readonly _playerId: string,
    private readonly _amount: Money,
    private _status: BetStatus,
    private _cashoutMultiplier: number | null,
  ) {}

  static place(roundId: string, playerId: string, amount: Money): Bet {
    if (amount.cents < Bet.MIN_AMOUNT_CENTS || amount.cents > Bet.MAX_AMOUNT_CENTS) {
      throw new InvalidBetAmountError(Bet.MIN_AMOUNT_CENTS, Bet.MAX_AMOUNT_CENTS);
    }
    return new Bet(randomUUID(), roundId, playerId, amount, BetStatus.PENDING, null);
  }

  static restore(
    id: string,
    roundId: string,
    playerId: string,
    amount: Money,
    status: BetStatus,
    cashoutMultiplier: number | null,
  ): Bet {
    return new Bet(id, roundId, playerId, amount, status, cashoutMultiplier);
  }

  cashOut(multiplier: number): void {
    if (this._status !== BetStatus.PENDING) {
      throw new BetNotPendingError();
    }
    this._status = BetStatus.CASHED_OUT;
    this._cashoutMultiplier = multiplier;
  }

  markAsLost(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new BetNotPendingError();
    }
    this._status = BetStatus.LOST;
  }

  reject(): void {
    if (this._status !== BetStatus.PENDING) {
      throw new BetNotPendingError();
    }
    this._status = BetStatus.REJECTED;
  }

  get id(): string {
    return this._id;
  }

  get roundId(): string {
    return this._roundId;
  }

  get playerId(): string {
    return this._playerId;
  }

  get amount(): Money {
    return this._amount;
  }

  get status(): BetStatus {
    return this._status;
  }

  get cashoutMultiplier(): number | null {
    return this._cashoutMultiplier;
  }

  get payout(): Money {
    if (this._status !== BetStatus.CASHED_OUT || this._cashoutMultiplier === null) {
      throw new BetNotCashedOutError();
    }
    return this._amount.multiply(this._cashoutMultiplier);
  }
}
