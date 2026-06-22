import { Wallet } from '../../../src/domain/entities/wallet';
import type { WalletRepository } from '../../../src/domain/repositories/wallet.repository';

export class InMemoryWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, Wallet>();

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.playerId, wallet);
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.wallets.get(playerId) ?? null;
  }
}
