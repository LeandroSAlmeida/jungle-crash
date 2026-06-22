import { describe, it, expect } from 'bun:test';
import { CreditWalletUseCase } from '../../../src/application/use-cases/credit-wallet.use-case';
import { CreateWalletUseCase } from '../../../src/application/use-cases/create-wallet.use-case';
import { WalletNotFoundError } from '../../../src/domain/errors/wallet-not-found.error';
import { InMemoryWalletRepository } from '../fakes/in-memory-wallet.repository';

describe('CreditWalletUseCase', () => {
  it('credits the balance of an existing wallet', async () => {
    const repository = new InMemoryWalletRepository();
    await new CreateWalletUseCase(repository).execute('player-1');
    const useCase = new CreditWalletUseCase(repository);

    await useCase.execute('player-1', 1000);

    const wallet = await repository.findByPlayerId('player-1');
    expect(wallet?.balance.cents).toBe(1000);
  });

  it('throws WalletNotFoundError when the player has no wallet', async () => {
    const repository = new InMemoryWalletRepository();
    const useCase = new CreditWalletUseCase(repository);

    await expect(useCase.execute('player-1', 1000)).rejects.toThrow(WalletNotFoundError);
  });
});
