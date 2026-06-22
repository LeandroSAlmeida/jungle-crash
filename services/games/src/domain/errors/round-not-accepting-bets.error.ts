export class RoundNotAcceptingBetsError extends Error {
  constructor() {
    super('Round is not currently accepting bets');
  }
}
