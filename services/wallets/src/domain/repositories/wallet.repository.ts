import { Wallet } from '../entities/wallet';

export interface WalletRepository {
  save(wallet: Wallet): Promise<void>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
}

export const WALLET_REPOSITORY = Symbol('WalletRepository');
