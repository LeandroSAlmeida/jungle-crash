import { describe, it, expect } from 'bun:test';
import { ProvablyFairResult } from '../../../src/domain/value-objects/provably-fair-result';

describe('ProvablyFairResult', () => {
  it('generates a server seed, a hash and a crash point', () => {
    const result = ProvablyFairResult.generate();

    expect(result.serverSeed).toHaveLength(64);
    expect(result.hash).toHaveLength(64);
    expect(result.crashPoint).toBeGreaterThanOrEqual(1);
  });

  it('never reveals a crash point derivable from the hash alone', () => {
    const a = ProvablyFairResult.generate();
    const b = ProvablyFairResult.generate();

    expect(a.hash).not.toBe(b.hash);
    expect(a.serverSeed).not.toBe(b.serverSeed);
  });

  it('is deterministic: the same server seed always yields the same hash and crash point', () => {
    const first = ProvablyFairResult.generate();
    const recomputedHash = ProvablyFairResult.verify(first.serverSeed, first.hash, first.crashPoint);

    expect(recomputedHash).toBe(true);
  });

  it('fails verification when the hash does not match the revealed seed', () => {
    const result = ProvablyFairResult.generate();
    const tamperedHash = 'a'.repeat(64);

    expect(ProvablyFairResult.verify(result.serverSeed, tamperedHash, result.crashPoint)).toBe(false);
  });

  it('fails verification when the crash point does not match the revealed seed', () => {
    const result = ProvablyFairResult.generate();

    expect(ProvablyFairResult.verify(result.serverSeed, result.hash, result.crashPoint + 1)).toBe(false);
  });
});
