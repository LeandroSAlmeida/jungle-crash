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

  multiply(factor: number): Money {
    return new Money(Math.floor(this.cents * factor));
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
