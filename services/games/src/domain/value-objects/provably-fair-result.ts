import { createHash, randomBytes } from 'crypto';

export class ProvablyFairResult {
  private constructor(
    private readonly _serverSeed: string,
    private readonly _hash: string,
    private readonly _crashPoint: number,
  ) {}

  static generate(previousServerSeed?: string): ProvablyFairResult {
    const serverSeed = previousServerSeed
      ? ProvablyFairResult.hashOf(previousServerSeed)
      : randomBytes(32).toString('hex');
    const hash = ProvablyFairResult.hashOf(serverSeed);
    const crashPoint = ProvablyFairResult.deriveCrashPoint(serverSeed);
    return new ProvablyFairResult(serverSeed, hash, crashPoint);
  }

  static restore(serverSeed: string, hash: string, crashPoint: number): ProvablyFairResult {
    return new ProvablyFairResult(serverSeed, hash, crashPoint);
  }

  static verify(serverSeed: string, expectedHash: string, expectedCrashPoint: number): boolean {
    return (
      ProvablyFairResult.hashOf(serverSeed) === expectedHash &&
      ProvablyFairResult.deriveCrashPoint(serverSeed) === expectedCrashPoint
    );
  }

  static verifyChainLink(previousServerSeed: string, serverSeed: string): boolean {
    return ProvablyFairResult.hashOf(previousServerSeed) === serverSeed;
  }

  private static hashOf(serverSeed: string): string {
    return createHash('sha256').update(serverSeed).digest('hex');
  }

  private static deriveCrashPoint(serverSeed: string): number {
    const crashSourceHash = createHash('sha256').update(serverSeed).update('crash').digest('hex');
    const integer = parseInt(crashSourceHash.slice(0, 13), 16);
    const e = Math.pow(2, 52);
    const point = Math.floor((100 * e - integer) / (e - integer)) / 100;
    return Math.max(1, point);
  }

  get serverSeed(): string {
    return this._serverSeed;
  }

  get hash(): string {
    return this._hash;
  }

  get crashPoint(): number {
    return this._crashPoint;
  }
}
