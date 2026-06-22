import { describe, it, expect } from 'bun:test';
import { CreateWalletUseCase } from '../../../src/application/use-cases/create-wallet.use-case';
import { WalletAlreadyExistsError } from '../../../src/domain/errors/wallet-already-exists.error';
import { InMemoryWalletRepository } from '../fakes/in-memory-wallet.repository';

describe('CreateWalletUseCase', () => {
  it('creates a wallet for a player that does not have one yet', async () => {
    const repository = new InMemoryWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    const wallet = await useCase.execute('player-1');

    expect(wallet.playerId).toBe('player-1');
    expect(wallet.balance.cents).toBe(0);
    expect(await repository.findByPlayerId('player-1')).toBe(wallet);
  });

  it('throws WalletAlreadyExistsError when the player already has a wallet', async () => {
    const repository = new InMemoryWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    await useCase.execute('player-1');

    await expect(useCase.execute('player-1')).rejects.toThrow(WalletAlreadyExistsError);
  });
});
