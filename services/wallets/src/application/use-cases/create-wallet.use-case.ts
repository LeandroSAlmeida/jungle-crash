import { Wallet } from '../../domain/entities/wallet';
import { WalletRepository } from '../../domain/repositories/wallet.repository';
import { WalletAlreadyExistsError } from '../../domain/errors/wallet-already-exists.error';

export class CreateWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

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
