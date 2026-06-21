export class RoundNotFoundError extends Error {
  constructor(roundId: string) {
    super(`Round not found: ${roundId}`);
  }
}
