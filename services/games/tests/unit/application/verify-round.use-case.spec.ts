import { describe, it, expect } from 'bun:test';
import { VerifyRoundUseCase } from '../../../src/application/use-cases/verify-round.use-case';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../../src/application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from '../../../src/application/use-cases/crash-round.use-case';
import { RoundNotFoundError } from '../../../src/domain/errors/round-not-found.error';
import { CrashDataNotRevealedError } from '../../../src/domain/errors/crash-data-not-revealed.error';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';

describe('VerifyRoundUseCase', () => {
  it('returns the hash, server seed, crash point and confirms verification', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());
    await new CrashRoundUseCase(roundRepository, betRepository).execute(round.id);

    const result = await new VerifyRoundUseCase(roundRepository).execute(round.id);

    expect(result.hash).toBe(round.hash);
    expect(result.serverSeed).toBe(round.serverSeed);
    expect(result.crashPoint).toBe(round.crashPoint);
    expect(result.verified).toBe(true);
  });

  it('throws RoundNotFoundError for a round that does not exist', async () => {
    const roundRepository = new InMemoryRoundRepository();

    await expect(new VerifyRoundUseCase(roundRepository).execute('missing')).rejects.toThrow(RoundNotFoundError);
  });

  it('throws CrashDataNotRevealedError before the round has crashed', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    await expect(new VerifyRoundUseCase(roundRepository).execute(round.id)).rejects.toThrow(
      CrashDataNotRevealedError,
    );
  });
});
