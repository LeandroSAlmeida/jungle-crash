import { describe, it, expect } from 'bun:test';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROUTING_KEYS } from '@crash/contracts';
import { PlaceBetUseCase } from '../../../src/application/use-cases/place-bet.use-case';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../../src/application/use-cases/start-round.use-case';
import { BetStatus } from '../../../src/domain/entities/bet';
import { RoundNotFoundError } from '../../../src/domain/errors/round-not-found.error';
import { RoundNotAcceptingBetsError } from '../../../src/domain/errors/round-not-accepting-bets.error';
import { AlreadyBetThisRoundError } from '../../../src/domain/errors/already-bet-this-round.error';
import { InvalidBetAmountError } from '../../../src/domain/errors/invalid-bet-amount.error';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';
import { RecordingEventPublisher } from '../fakes/recording-event-publisher';

describe('PlaceBetUseCase', () => {
  it('places a bet while the round is in the betting phase', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const eventPublisher = new RecordingEventPublisher();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    const bet = await new PlaceBetUseCase(roundRepository, betRepository, eventPublisher, new EventEmitter2()).execute(
      round.id,
      'player-1',
      5000,
    );

    expect(bet.status).toBe(BetStatus.PENDING);
    expect(bet.amount.cents).toBe(5000);
  });

  it('publishes a bet.placed event after placing the bet', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const eventPublisher = new RecordingEventPublisher();
    const round = await new CreateRoundUseCase(roundRepository).execute();

    const bet = await new PlaceBetUseCase(roundRepository, betRepository, eventPublisher, new EventEmitter2()).execute(
      round.id,
      'player-1',
      5000,
    );

    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0]).toEqual({
      routingKey: ROUTING_KEYS.BET_PLACED,
      payload: { betId: bet.id, playerId: 'player-1', amountInCents: 5000 },
    });
  });

  it('throws RoundNotFoundError for a round that does not exist', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const useCase = new PlaceBetUseCase(roundRepository, betRepository, new RecordingEventPublisher(), new EventEmitter2());

    await expect(useCase.execute('missing-round', 'player-1', 5000)).rejects.toThrow(RoundNotFoundError);
  });

  it('throws RoundNotAcceptingBetsError once the round is running', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());

    const useCase = new PlaceBetUseCase(roundRepository, betRepository, new RecordingEventPublisher(), new EventEmitter2());
    await expect(useCase.execute(round.id, 'player-1', 5000)).rejects.toThrow(RoundNotAcceptingBetsError);
  });

  it('throws AlreadyBetThisRoundError on a second bet from the same player', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    const useCase = new PlaceBetUseCase(roundRepository, betRepository, new RecordingEventPublisher(), new EventEmitter2());
    await useCase.execute(round.id, 'player-1', 5000);

    await expect(useCase.execute(round.id, 'player-1', 1000)).rejects.toThrow(AlreadyBetThisRoundError);
  });

  it('throws InvalidBetAmountError for an amount outside the allowed range', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    const useCase = new PlaceBetUseCase(roundRepository, betRepository, new RecordingEventPublisher(), new EventEmitter2());

    await expect(useCase.execute(round.id, 'player-1', 1)).rejects.toThrow(InvalidBetAmountError);
  });
});
