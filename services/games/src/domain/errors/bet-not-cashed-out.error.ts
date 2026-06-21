export class BetNotCashedOutError extends Error {
  constructor() {
    super('Payout is only available for a bet that has been cashed out');
  }
}
