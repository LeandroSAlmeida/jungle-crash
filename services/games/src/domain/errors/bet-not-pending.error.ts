export class BetNotPendingError extends Error {
  constructor() {
    super('Bet is no longer pending');
  }
}
