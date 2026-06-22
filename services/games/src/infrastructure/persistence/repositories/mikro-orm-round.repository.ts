import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Round, RoundPhase } from '../../../domain/entities/round';
import { ProvablyFairResult } from '../../../domain/value-objects/provably-fair-result';
import type { RoundRepository } from '../../../domain/repositories/round.repository';
import { RoundEntity } from '../entities/round.entity';

function toDomain(entity: RoundEntity): Round {
  return Round.restore(
    entity.id,
    entity.phase,
    ProvablyFairResult.restore(entity.serverSeed, entity.hash, entity.crashPoint),
    entity.startedAt ?? null,
    entity.previousRoundId ?? null,
  );
}

@Injectable()
export class MikroOrmRoundRepository implements RoundRepository {
  constructor(private readonly em: EntityManager) {}

  async save(round: Round): Promise<void> {
    const snapshot = round.toSnapshot();
    const entity = await this.em.findOne(RoundEntity, { id: snapshot.id });

    if (entity) {
      entity.phase = snapshot.phase;
      entity.startedAt = snapshot.startedAt ?? undefined;
    } else {
      this.em.create(RoundEntity, {
        id: snapshot.id,
        phase: snapshot.phase,
        hash: snapshot.hash,
        serverSeed: snapshot.serverSeed,
        crashPoint: snapshot.crashPoint,
        startedAt: snapshot.startedAt ?? undefined,
        previousRoundId: snapshot.previousRoundId ?? undefined,
      });
    }

    await this.em.flush();
  }

  async findById(id: string): Promise<Round | null> {
    const entity = await this.em.findOne(RoundEntity, { id });
    return entity ? toDomain(entity) : null;
  }

  async findCurrent(): Promise<Round | null> {
    const entity = await this.em.findOne(RoundEntity, { phase: { $ne: RoundPhase.CRASHED } });
    return entity ? toDomain(entity) : null;
  }

  async findLastCrashed(): Promise<Round | null> {
    const entity = await this.em.findOne(
      RoundEntity,
      { phase: RoundPhase.CRASHED },
      { orderBy: { startedAt: 'desc' } },
    );
    return entity ? toDomain(entity) : null;
  }

  async findHistory(limit: number, offset: number): Promise<Round[]> {
    const entities = await this.em.find(
      RoundEntity,
      { phase: RoundPhase.CRASHED },
      { orderBy: { startedAt: 'desc' }, limit, offset },
    );
    return entities.map(toDomain);
  }
}
