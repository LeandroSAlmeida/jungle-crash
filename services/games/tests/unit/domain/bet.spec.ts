import { describe, it, expect } from 'bun:test';
import { Bet, BetStatus } from '../../../src/domain/entities/bet';
import { Money } from '../../../src/domain/value-objects/money';
import { InvalidBetAmountError } from '../../../src/domain/errors/invalid-bet-amount.error';
import { BetNotPendingError } from '../../../src/domain/errors/bet-not-pending.error';
import { BetNotCashedOutError } from '../../../src/domain/errors/bet-not-cashed-out.error';

describe('Bet', () => {
  it('is placed as PENDING with the given round, player and amount', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));

    expect(bet.status).toBe(BetStatus.PENDING);
    expect(bet.roundId).toBe('round-1');
    expect(bet.playerId).toBe('player-1');
    expect(bet.amount.cents).toBe(5000);
  });

  it('rejects amounts below the minimum', () => {
    expect(() => Bet.place('round-1', 'player-1', Money.fromCents(99))).toThrow(InvalidBetAmountError);
  });

  it('rejects amounts above the maximum', () => {
    expect(() => Bet.place('round-1', 'player-1', Money.fromCents(100001))).toThrow(InvalidBetAmountError);
  });

  it('cashes out, recording the multiplier', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));
    bet.cashOut(2.5);

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashoutMultiplier).toBe(2.5);
  });

  it('computes the payout as amount times the cashout multiplier', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));
    bet.cashOut(2.5);

    expect(bet.payout.cents).toBe(12500);
  });

  it('marks a pending bet as lost', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));
    bet.markAsLost();

    expect(bet.status).toBe(BetStatus.LOST);
  });

  it('rejects cashing out a bet that is not pending', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));
    bet.markAsLost();

    expect(() => bet.cashOut(2)).toThrow(BetNotPendingError);
  });

  it('rejects marking as lost a bet that is not pending', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));
    bet.cashOut(2);

    expect(() => bet.markAsLost()).toThrow(BetNotPendingError);
  });

  it('rejects reading the payout before cashing out', () => {
    const bet = Bet.place('round-1', 'player-1', Money.fromCents(5000));

    expect(() => bet.payout).toThrow(BetNotCashedOutError);
  });
});
