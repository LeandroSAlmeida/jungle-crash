export class InvalidBetAmountError extends Error {
  constructor(minCents: number, maxCents: number) {
    super(`Bet amount must be between ${minCents} and ${maxCents} cents`);
  }
}
