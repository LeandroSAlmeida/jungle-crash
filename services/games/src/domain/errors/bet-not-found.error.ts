export class BetNotFoundError extends Error {
  constructor() {
    super('No bet found for this player in this round');
  }
}
