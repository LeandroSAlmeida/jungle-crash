import { Entity, Enum, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { BetStatus } from '../../../domain/entities/bet';

@Entity({ tableName: 'bets' })
@Unique({ properties: ['roundId', 'playerId'] })
export class BetEntity {
  @PrimaryKey()
  id!: string;

  @Property()
  roundId!: string;

  @Property()
  playerId!: string;

  @Property({ columnType: 'bigint', type: 'number' })
  amountInCents!: number;

  @Enum(() => BetStatus)
  status!: BetStatus;

  @Property({ type: 'double', nullable: true })
  cashoutMultiplier?: number | null;

  @Property()
  createdAt!: Date;
}
