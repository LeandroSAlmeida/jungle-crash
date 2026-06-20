import { describe, it, expect } from 'bun:test';
import { Money } from '../../../src/domain/value-objects/money';

describe('Money', () => {
  it('creates a zero amount', () => {
    expect(Money.zero().cents).toBe(0);
  });

  it('creates from an integer amount of cents', () => {
    expect(Money.fromCents(1050).cents).toBe(1050);
  });

  it('rejects negative amounts', () => {
    expect(() => Money.fromCents(-1)).toThrow();
  });

  it('rejects non-integer amounts', () => {
    expect(() => Money.fromCents(10.5)).toThrow();
  });

  it('adds two amounts without floating point drift', () => {
    const result = Money.fromCents(10).add(Money.fromCents(20));
    expect(result.cents).toBe(30);
  });

  it('subtracts two amounts', () => {
    const result = Money.fromCents(100).subtract(Money.fromCents(40));
    expect(result.cents).toBe(60);
  });

  it('throws when subtracting more than it has', () => {
    expect(() => Money.fromCents(10).subtract(Money.fromCents(20))).toThrow();
  });

  it('does not mutate the original amount on add/subtract', () => {
    const original = Money.fromCents(100);
    original.add(Money.fromCents(50));
    expect(original.cents).toBe(100);
  });

  it('compares amounts', () => {
    expect(Money.fromCents(100).isGreaterThan(Money.fromCents(50))).toBe(true);
    expect(Money.fromCents(50).isLessThan(Money.fromCents(100))).toBe(true);
    expect(Money.fromCents(50).equals(Money.fromCents(50))).toBe(true);
  });

  it('formats as a decimal string', () => {
    expect(Money.fromCents(1050).toString()).toBe('10.50');
  });
});
