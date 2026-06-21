import { describe, it, expect } from 'bun:test';
import { ROUTING_KEYS } from '@crash/contracts';
import { CashOutUseCase } from '../../../src/application/use-cases/cash-out.use-case';
import { PlaceBetUseCase } from '../../../src/application/use-cases/place-bet.use-case';
import { CreateRoundUseCase } from '../../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../../src/application/use-cases/start-round.use-case';
import { BetStatus } from '../../../src/domain/entities/bet';
import { BetNotFoundError } from '../../../src/domain/errors/bet-not-found.error';
import { BetNotPendingError } from '../../../src/domain/errors/bet-not-pending.error';
import { InMemoryRoundRepository } from '../fakes/in-memory-round.repository';
import { InMemoryBetRepository } from '../fakes/in-memory-bet.repository';
import { RecordingEventPublisher } from '../fakes/recording-event-publisher';

describe('CashOutUseCase', () => {
  it('cashes out a pending bet at the current multiplier', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const eventPublisher = new RecordingEventPublisher();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new PlaceBetUseCase(roundRepository, betRepository, eventPublisher).execute(round.id, 'player-1', 5000);

    const startedAt = new Date('2024-01-01T00:00:00.000Z');
    await new StartRoundUseCase(roundRepository).execute(round.id, startedAt);

    const oneSecondLater = new Date(startedAt.getTime() + 1000);
    const bet = await new CashOutUseCase(roundRepository, betRepository, eventPublisher).execute(
      round.id,
      'player-1',
      oneSecondLater,
    );

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashoutMultiplier).toBeGreaterThan(1);
  });

  it('publishes a bet.cashed_out event with the payout', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const eventPublisher = new RecordingEventPublisher();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new PlaceBetUseCase(roundRepository, betRepository, eventPublisher).execute(round.id, 'player-1', 5000);
    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());

    const bet = await new CashOutUseCase(roundRepository, betRepository, eventPublisher).execute(
      round.id,
      'player-1',
    );

    const cashedOutEvent = eventPublisher.published.find((e) => e.routingKey === ROUTING_KEYS.BET_CASHED_OUT);
    expect(cashedOutEvent?.payload).toEqual({
      betId: bet.id,
      playerId: 'player-1',
      payoutInCents: bet.payout.cents,
    });
  });

  it('throws BetNotFoundError when the player never bet in this round', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());

    const useCase = new CashOutUseCase(roundRepository, betRepository, new RecordingEventPublisher());
    await expect(useCase.execute(round.id, 'player-1')).rejects.toThrow(BetNotFoundError);
  });

  it('throws BetNotPendingError when cashing out twice', async () => {
    const roundRepository = new InMemoryRoundRepository();
    const betRepository = new InMemoryBetRepository();
    const eventPublisher = new RecordingEventPublisher();
    const round = await new CreateRoundUseCase(roundRepository).execute();
    await new PlaceBetUseCase(roundRepository, betRepository, eventPublisher).execute(round.id, 'player-1', 5000);
    await new StartRoundUseCase(roundRepository).execute(round.id, new Date());

    const useCase = new CashOutUseCase(roundRepository, betRepository, eventPublisher);
    await useCase.execute(round.id, 'player-1');

    await expect(useCase.execute(round.id, 'player-1')).rejects.toThrow(BetNotPendingError);
  });
});
