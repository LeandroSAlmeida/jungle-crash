import { Money } from '../../domain/value-objects/money';
import { WalletRepository } from '../../domain/repositories/wallet.repository';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

export class CreditWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(playerId: string, amountInCents: number): Promise<void> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new WalletNotFoundError(playerId);
    }

    wallet.credit(Money.fromCents(amountInCents));
    await this.walletRepository.save(wallet);
  }
}
