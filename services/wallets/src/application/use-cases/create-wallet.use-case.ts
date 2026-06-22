import { Inject, Injectable } from '@nestjs/common';
import { Wallet } from '../../domain/entities/wallet';
import { WALLET_REPOSITORY, type WalletRepository } from '../../domain/repositories/wallet.repository';
import { WalletAlreadyExistsError } from '../../domain/errors/wallet-already-exists.error';

@Injectable()
export class CreateWalletUseCase {
  constructor(@Inject(WALLET_REPOSITORY) private readonly walletRepository: WalletRepository) {}

  async execute(playerId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(playerId);
    if (existing) {
      throw new WalletAlreadyExistsError(playerId);
    }

    const wallet = Wallet.create(playerId);
    await this.walletRepository.save(wallet);
    return wallet;
  }
}
