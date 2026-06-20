import { describe, it, expect } from 'bun:test';
import { Wallet } from '../../../src/domain/entities/wallet';
import { Money } from '../../../src/domain/value-objects/money';
import { InsufficientBalanceError } from '../../../src/domain/errors/insufficient-balance.error';

describe('Wallet', () => {
  it('is created with zero balance', () => {
    const wallet = Wallet.create('player-1');
    expect(wallet.balance.cents).toBe(0);
  });

  it('is created with a unique id and the given playerId', () => {
    const wallet = Wallet.create('player-1');
    expect(wallet.id).toBeTruthy();
    expect(wallet.playerId).toBe('player-1');
  });

  it('credits the balance', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(Money.fromCents(1000));
    expect(wallet.balance.cents).toBe(1000);
  });

  it('debits the balance when there are enough funds', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(Money.fromCents(1000));
    wallet.debit(Money.fromCents(400));
    expect(wallet.balance.cents).toBe(600);
  });

  it('throws InsufficientBalanceError when debiting more than the balance', () => {
    const wallet = Wallet.create('player-1');
    wallet.credit(Money.fromCents(100));
    expect(() => wallet.debit(Money.fromCents(200))).toThrow(InsufficientBalanceError);
  });

  it('never lets the balance go negative', () => {
    const wallet = Wallet.create('player-1');
    expect(() => wallet.debit(Money.fromCents(1))).toThrow(InsufficientBalanceError);
    expect(wallet.balance.cents).toBe(0);
  });

  it('keeps exact precision across many small operations', () => {
    const wallet = Wallet.create('player-1');
    for (let i = 0; i < 100; i++) {
      wallet.credit(Money.fromCents(1));
    }
    expect(wallet.balance.cents).toBe(100);
  });
});
