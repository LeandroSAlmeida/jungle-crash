import { describe, it, expect } from 'bun:test';
import { Round, RoundPhase } from '../../../src/domain/entities/round';
import { InvalidRoundTransitionError } from '../../../src/domain/errors/invalid-round-transition.error';
import { CrashDataNotRevealedError } from '../../../src/domain/errors/crash-data-not-revealed.error';
import { RoundNotRunningError } from '../../../src/domain/errors/round-not-running.error';
import { ProvablyFairResult } from '../../../src/domain/value-objects/provably-fair-result';

describe('Round', () => {
  it('is created in the BETTING phase, accepting bets, with a public hash', () => {
    const round = Round.create();

    expect(round.phase).toBe(RoundPhase.BETTING);
    expect(round.canAcceptBets()).toBe(true);
    expect(round.hash).toHaveLength(64);
  });

  it('has no previous round when it is the first in the chain', () => {
    const round = Round.create();

    expect(round.previousRoundId).toBeNull();
  });

  it('derives its seed from the previous round when chained', () => {
    const first = Round.create();
    first.start(new Date());
    first.crash();

    const second = Round.create({ id: first.id, serverSeed: first.serverSeed });

    expect(second.previousRoundId).toBe(first.id);
    second.start(new Date());
    second.crash();
    expect(ProvablyFairResult.verifyChainLink(first.serverSeed, second.serverSeed)).toBe(true);
  });

  it('transitions from BETTING to RUNNING', () => {
    const round = Round.create();
    round.start(new Date());

    expect(round.phase).toBe(RoundPhase.RUNNING);
    expect(round.canAcceptBets()).toBe(false);
  });

  it('transitions from RUNNING to CRASHED', () => {
    const round = Round.create();
    round.start(new Date());
    round.crash();

    expect(round.phase).toBe(RoundPhase.CRASHED);
  });

  it('rejects starting a round that is not in BETTING', () => {
    const round = Round.create();
    round.start(new Date());

    expect(() => round.start(new Date())).toThrow(InvalidRoundTransitionError);
  });

  it('rejects crashing a round that is not RUNNING', () => {
    const round = Round.create();

    expect(() => round.crash()).toThrow(InvalidRoundTransitionError);
  });

  it('hides crash point and server seed until the round has crashed', () => {
    const round = Round.create();

    expect(() => round.crashPoint).toThrow(CrashDataNotRevealedError);
    expect(() => round.serverSeed).toThrow(CrashDataNotRevealedError);
  });

  it('reveals crash point and server seed once crashed', () => {
    const round = Round.create();
    round.start(new Date());
    round.crash();

    expect(round.crashPoint).toBeGreaterThanOrEqual(1);
    expect(round.serverSeed).toHaveLength(64);
  });

  it('knows when the current multiplier has reached the crash point without exposing it', () => {
    const round = Round.create();
    round.start(new Date());

    expect(round.hasReachedCrashPoint(0)).toBe(false);
    expect(round.hasReachedCrashPoint(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('computes the multiplier as 1.00 right when the round starts', () => {
    const startedAt = new Date('2024-01-01T00:00:00.000Z');
    const round = Round.create();
    round.start(startedAt);

    expect(round.currentMultiplierAt(startedAt)).toBeCloseTo(1, 5);
  });

  it('computes a higher multiplier as more time passes', () => {
    const startedAt = new Date('2024-01-01T00:00:00.000Z');
    const round = Round.create();
    round.start(startedAt);

    const oneSecondLater = new Date(startedAt.getTime() + 1000);
    expect(round.currentMultiplierAt(oneSecondLater)).toBeGreaterThan(1);
  });

  it('rejects reading the current multiplier when the round is not running', () => {
    const round = Round.create();

    expect(() => round.currentMultiplierAt(new Date())).toThrow(RoundNotRunningError);
  });

  it('restores a round from a snapshot, preserving its phase and started time', () => {
    const startedAt = new Date('2024-01-01T00:00:00.000Z');
    const original = Round.create();
    original.start(startedAt);
    original.crash();

    const snapshot = original.toSnapshot();
    const restored = Round.restore(
      snapshot.id,
      snapshot.phase,
      ProvablyFairResult.restore(snapshot.serverSeed, snapshot.hash, snapshot.crashPoint),
      snapshot.startedAt,
      snapshot.previousRoundId,
    );

    expect(restored.id).toBe(original.id);
    expect(restored.phase).toBe(RoundPhase.CRASHED);
    expect(restored.crashPoint).toBe(original.crashPoint);
    expect(restored.serverSeed).toBe(original.serverSeed);
  });

  it('exposes the secret data via toSnapshot even before the round has crashed', () => {
    const round = Round.create();

    const snapshot = round.toSnapshot();
    expect(snapshot.serverSeed).toHaveLength(64);
    expect(snapshot.crashPoint).toBeGreaterThanOrEqual(1);
  });
});
