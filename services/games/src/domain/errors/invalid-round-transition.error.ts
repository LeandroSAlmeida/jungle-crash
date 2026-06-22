export class InvalidRoundTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition round from ${from} to ${to}`);
  }
}
