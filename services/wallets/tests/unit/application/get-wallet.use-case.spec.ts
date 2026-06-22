import { describe, it, expect } from 'bun:test';
import { GetWalletUseCase } from '../../../src/application/use-cases/get-wallet.use-case';
import { CreateWalletUseCase } from '../../../src/application/use-cases/create-wallet.use-case';
import { WalletNotFoundError } from '../../../src/domain/errors/wallet-not-found.error';
import { InMemoryWalletRepository } from '../fakes/in-memory-wallet.repository';

describe('GetWalletUseCase', () => {
  it('returns the wallet of a player that has one', async () => {
    const repository = new InMemoryWalletRepository();
    await new CreateWalletUseCase(repository).execute('player-1');
    const useCase = new GetWalletUseCase(repository);

    const wallet = await useCase.execute('player-1');

    expect(wallet.playerId).toBe('player-1');
  });

  it('throws WalletNotFoundError when the player has no wallet', async () => {
    const repository = new InMemoryWalletRepository();
    const useCase = new GetWalletUseCase(repository);

    await expect(useCase.execute('player-1')).rejects.toThrow(WalletNotFoundError);
  });
});
