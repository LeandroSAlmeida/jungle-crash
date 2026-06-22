import { describe, it, expect } from 'bun:test';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetCurrentRoundUseCase } from '../../../src/application/use-cases/get-current-round.use-case';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { PlaceBetUseCase } from '../../../src/application/use-cases/place-bet.use-case';
import { NoCurrentRoundError } from '../../../src/domain/errors/no-current-round.error';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';
import { RecordingEventPublisher } from '../fakes/recording-event-publisher';

describe('GetCurrentRoundUseCase', () => {
  it('returns the current round along with its bets', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new PlaceBetUseCase(roundRepository, betRepository, new RecordingEventPublisher(), new EventEmitter2()).execute(
      round.id,
      'player-1',
      5000,
    );

    const result = await new GetCurrentRoundUseCase(roundRepository, betRepository).execute();

    expect(result.round.id).toBe(round.id);
    expect(result.bets).toHaveLength(1);
  });

  it('throws NoCurrentRoundError when there is no round in progress', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();

    await expect(new GetCurrentRoundUseCase(roundRepository, betRepository).execute()).rejects.toThrow(
      NoCurrentRoundError,
    );
  });
});
