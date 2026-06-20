import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money';
import { InsufficientBalanceError } from '../errors/insufficient-balance.error';

export class Wallet {
  private constructor(
    private readonly _id: string,
    private readonly _playerId: string,
    private _balance: Money,
  ) {}

  static create(playerId: string): Wallet {
    return new Wallet(randomUUID(), playerId, Money.zero());
  }

  static restore(id: string, playerId: string, balance: Money): Wallet {
    return new Wallet(id, playerId, balance);
  }

  get id(): string {
    return this._id;
  }

  get playerId(): string {
    return this._playerId;
  }

  get balance(): Money {
    return this._balance;
  }

  credit(amount: Money): void {
    this._balance = this._balance.add(amount);
  }

  debit(amount: Money): void {
    if (this._balance.isLessThan(amount)) {
      throw new InsufficientBalanceError();
    }
    this._balance = this._balance.subtract(amount);
  }
}
