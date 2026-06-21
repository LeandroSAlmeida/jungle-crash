import { describe, it, expect } from 'bun:test';
import { GetRoundHistoryUseCase } from '../../../src/application/use-cases/get-round-history.use-case';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../../src/application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from '../../../src/application/use-cases/crash-round.use-case';
import { RoundPhase } from '../../../src/domain/entities/round';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';

describe('GetRoundHistoryUseCase', () => {
  it('only returns rounds that have crashed', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();

    const crashed = await new CreateRoundUseCase(roundRepository).execute();
    await new StartRoundUseCase(roundRepository).execute(crashed.id, new Date());
    await new CrashRoundUseCase(roundRepository, betRepository).execute(crashed.id);

    await new CreateRoundUseCase(roundRepository).execute();

    const history = await new GetRoundHistoryUseCase(roundRepository).execute(20, 0);

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(crashed.id);
    expect(history[0].phase).toBe(RoundPhase.CRASHED);
  });

  it('respects limit and offset', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();

    for (let i = 0; i < 3; i++) {
      const round = await new CreateRoundUseCase(roundRepository).execute();
      await new StartRoundUseCase(roundRepository).execute(round.id, new Date());
      await new CrashRoundUseCase(roundRepository, betRepository).execute(round.id);
    }

    const page = await new GetRoundHistoryUseCase(roundRepository).execute(1, 1);
    expect(page).toHaveLength(1);
  });
});
