import { describe, it, expect } from 'bun:test';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetPlayerBetsUseCase } from '../../../src/application/use-cases/get-player-bets.use-case';
import { PlaceBetUseCase } from '../../../src/application/use-cases/place-bet.use-case';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';
import { RecordingEventPublisher } from '../fakes/recording-event-publisher';

describe('GetPlayerBetsUseCase', () => {
  it("returns only the given player's bets", async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const placeBet = new PlaceBetUseCase(roundRepository, betRepository, new RecordingEventPublisher(), new EventEmitter2());

    const round = await new CreateRoundUseCase(roundRepository).execute();
    await placeBet.execute(round.id, 'player-1', 5000);
    await placeBet.execute(round.id, 'player-2', 3000);

    const bets = await new GetPlayerBetsUseCase(betRepository).execute('player-1', 20, 0);

    expect(bets).toHaveLength(1);
    expect(bets[0].playerId).toBe('player-1');
  });
});
