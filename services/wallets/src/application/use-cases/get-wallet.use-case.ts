import { Wallet } from '../../domain/entities/wallet';
import { WalletRepository } from '../../domain/repositories/wallet.repository';
import { WalletNotFoundError } from '../../domain/errors/wallet-not-found.error';

export class GetWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(playerId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new WalletNotFoundError(playerId);
    }
    return wallet;
  }
}
