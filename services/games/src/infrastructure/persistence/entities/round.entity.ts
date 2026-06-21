import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';
import { RoundPhase } from '../../../domain/entities/round';

@Entity({ tableName: 'rounds' })
export class RoundEntity {
  @PrimaryKey()
  id!: string;

  @Enum(() => RoundPhase)
  phase!: RoundPhase;

  @Property()
  hash!: string;

  @Property()
  serverSeed!: string;

  @Property({ type: 'float' })
  crashPoint!: number;

  @Property({ nullable: true })
  startedAt?: Date;
}
