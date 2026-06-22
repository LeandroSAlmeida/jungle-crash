import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Bet } from '../../../domain/entities/bet';
import { Money } from '../../../domain/value-objects/money';
import type { BetRepository } from '../../../domain/repositories/bet.repository';
import { BetEntity } from '../entities/bet.entity';

function toDomain(entity: BetEntity): Bet {
  return Bet.restore(
    entity.id,
    entity.roundId,
    entity.playerId,
    entity.username ?? null,
    Money.fromCents(entity.amountInCents),
    entity.status,
    entity.cashoutMultiplier ?? null,
  );
}

@Injectable()
export class MikroOrmBetRepository implements BetRepository {
  constructor(private readonly em: EntityManager) {}

  async save(bet: Bet): Promise<void> {
    const entity = await this.em.findOne(BetEntity, { id: bet.id });

    if (entity) {
      entity.status = bet.status;
      entity.cashoutMultiplier = bet.cashoutMultiplier ?? undefined;
    } else {
      this.em.create(BetEntity, {
        id: bet.id,
        roundId: bet.roundId,
        playerId: bet.playerId,
        username: bet.username ?? undefined,
        amountInCents: bet.amount.cents,
        status: bet.status,
        cashoutMultiplier: bet.cashoutMultiplier ?? undefined,
        createdAt: new Date(),
      });
    }

    await this.em.flush();
  }

  async findById(id: string): Promise<Bet | null> {
    const entity = await this.em.findOne(BetEntity, { id });
    return entity ? toDomain(entity) : null;
  }

  async findByRoundAndPlayer(roundId: string, playerId: string): Promise<Bet | null> {
    const entity = await this.em.findOne(BetEntity, { roundId, playerId });
    return entity ? toDomain(entity) : null;
  }

  async findByRoundId(roundId: string): Promise<Bet[]> {
    const entities = await this.em.find(BetEntity, { roundId });
    return entities.map(toDomain);
  }

  async findByPlayerId(playerId: string, limit: number, offset: number): Promise<Bet[]> {
    const entities = await this.em.find(BetEntity, { playerId }, { orderBy: { createdAt: 'desc' }, limit, offset });
    return entities.map(toDomain);
  }
}
