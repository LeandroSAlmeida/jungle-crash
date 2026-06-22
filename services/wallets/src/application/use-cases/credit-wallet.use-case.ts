import { Inject, Injectable } from '@nestjs/common';
import { Money } from '../../domain/value-objects/money';
import { WALLET_REPOSITORY, type WalletRepository } from '../../domain/repositories/wallet.repository';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

@Injectable()
export class CreditWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepository) {}

  async execute(playerId: string, amountInCents: number): Promise<void> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new WalletNotFoundError(playerId);
    }

    wallet.credit(Money.fromCents(amountInCents));
    await this.walletRepository.save(wallet);
  }
}
