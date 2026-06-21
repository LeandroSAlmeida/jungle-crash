export class CrashDataNotRevealedError extends Error {
  constructor() {
    super('Crash data cannot be revealed before the round has crashed');
  }
}
