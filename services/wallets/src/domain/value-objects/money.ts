export class Money {
  private constructor(private readonly _cents: number) {}

  static zero(): Money {
    return new Money(0);
  }

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new Error('Money must be an integer amount of cents');
    }
    if (cents < 0) {
      throw new Error('Money cannot be negative');
    }
    return new Money(cents);
  }

  get cents(): number {
    return this._cents;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    if (other.cents > this.cents) {
      throw new Error('Cannot subtract: insufficient amount');
    }
    return new Money(this.cents - other.cents);
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  toString(): string {
    return (this.cents / 100).toFixed(2);
  }
}
