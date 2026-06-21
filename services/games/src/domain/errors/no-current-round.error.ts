export class NoCurrentRoundError extends Error {
  constructor() {
    super('There is no round in progress');
  }
}
