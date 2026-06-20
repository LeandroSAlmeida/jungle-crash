import { describe, it, expect } from 'bun:test';
import { DebitWalletUseCase } from '../../../src/application/use-cases/debit-wallet.use-case';
import { CreditWalletUseCase } from '../../../src/application/use-cases/credit-wallet.use-case';
import { CreateWalletUseCase } from '../../../src/application/use-cases/create-wallet.use-case';
import { WalletNotFoundError } from '../../../src/domain/errors/wallet-not-found.error';
import { InsufficientBalanceError } from '../../../src/domain/errors/insufficient-balance.error';
import { InMemoryWalletRepository } from '../fakes/in-memory-wallet.repository';

describe('DebitWalletUseCase', () => {
  it('debits the balance of an existing wallet with enough funds', async () => {
    const repository = new InMemoryWalletRepository();
    await new CreateWalletUseCase(repository).execute('player-1');
    await new CreditWalletUseCase(repository).execute('player-1', 1000);
    const useCase = new DebitWalletUseCase(repository);

    await useCase.execute('player-1', 400);

    const wallet = await repository.findByPlayerId('player-1');
    expect(wallet?.balance.cents).toBe(600);
  });

  it('throws InsufficientBalanceError when the wallet does not have enough funds', async () => {
    const repository = new InMemoryWalletRepository();
    await new CreateWalletUseCase(repository).execute('player-1');
    const useCase = new DebitWalletUseCase(repository);

    await expect(useCase.execute('player-1', 100)).rejects.toThrow(InsufficientBalanceError);
  });

  it('throws WalletNotFoundError when the player has no wallet', async () => {
    const repository = new InMemoryWalletRepository();
    const useCase = new DebitWalletUseCase(repository);

    await expect(useCase.execute('player-1', 100)).rejects.toThrow(WalletNotFoundError);
  });
});
