import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Wallet } from '../../../domain/entities/wallet';
import { Money } from '../../../domain/value-objects/money';
import type { WalletRepository } from '../../../domain/repositories/wallet.repository';
import { WalletEntity } from '../entities/wallet.entity';

@Injectable()
export class MikroOrmWalletRepository implements WalletRepository {
  constructor(private readonly em: EntityManager) {}

  async save(wallet: Wallet): Promise<void> {
    const entity = await this.em.findOne(WalletEntity, { id: wallet.id });

    if (entity) {
      entity.balanceInCents = wallet.balance.cents;
    } else {
      this.em.create(WalletEntity, {
        id: wallet.id,
        playerId: wallet.playerId,
        balanceInCents: wallet.balance.cents,
      });
    }

    await this.em.flush();
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const entity = await this.em.findOne(WalletEntity, { playerId });
    if (!entity) {
      return null;
    }

    return Wallet.restore(entity.id, entity.playerId, Money.fromCents(entity.balanceInCents));
  }
}
