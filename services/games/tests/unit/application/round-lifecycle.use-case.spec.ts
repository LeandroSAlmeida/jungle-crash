import { describe, it, expect } from 'bun:test';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../../src/application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from '../../../src/application/use-cases/crash-round.use-case';
import { PlaceBetUseCase } from '../../../src/application/use-cases/place-bet.use-case';
import { RoundPhase } from '../../../src/domain/entities/round';
import { BetStatus } from '../../../src/domain/entities/bet';
import { RoundNotFoundError } from '../../../src/domain/errors/round-not-found.error';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';

describe('Round lifecycle use cases', () => {
  it('creates a round in the BETTING phase', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    expect(round.phase).toBe(RoundPhase.BETTING);
    expect(await roundRepository.findById(round.id)).toBe(round);
  });

  it('starts an existing round', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    const started = await new StartRoundUseCase(roundRepository).execute(round.id, new Date());

    expect(started.phase).toBe(RoundPhase.RUNNING);
  });

  it('throws RoundNotFoundError when starting a round that does not exist', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const useCase = new StartRoundUseCase(roundRepository);

    await expect(useCase.execute('missing-round')).rejects.toThrow(RoundNotFoundError);
  });

  it('crashing a round marks every still-pending bet as lost', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    const bet = await new PlaceBetUseCase(roundRepository, betRepository).execute(round.id, 'player-1', 5000);
    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());

    const crashed = await new CrashRoundUseCase(roundRepository, betRepository).execute(round.id);

    expect(crashed.phase).toBe(RoundPhase.CRASHED);
    const updatedBet = await betRepository.findByRoundAndPlayer(round.id, 'player-1');
    expect(updatedBet?.status).toBe(BetStatus.LOST);
    expect(bet.id).toBe(updatedBet!.id);
  });

  it('does not touch a bet that was already cashed out before the crash', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    const bet = await new PlaceBetUseCase(roundRepository, betRepository).execute(round.id, 'player-1', 5000);
    bet.cashOut(2);
    await betRepository.save(bet);

    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());
    await new CrashRoundUseCase(roundRepository, betRepository).execute(round.id);

    const updatedBet = await betRepository.findByRoundAndPlayer(round.id, 'player-1');
    expect(updatedBet?.status).toBe(BetStatus.CASHED_OUT);
  });
});
