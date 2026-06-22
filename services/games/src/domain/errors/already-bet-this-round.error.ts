export class AlreadyBetThisRoundError extends Error {
  constructor(playerId: string) {
    super(`Player ${playerId} already placed a bet in this round`);
  }
}
