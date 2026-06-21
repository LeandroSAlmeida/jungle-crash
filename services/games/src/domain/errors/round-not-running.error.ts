export class RoundNotRunningError extends Error {
  constructor() {
    super('Round is not currently running');
  }
}
