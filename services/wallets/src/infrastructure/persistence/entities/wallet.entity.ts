import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity({ tableName: 'wallets' })
export class WalletEntity {
  @PrimaryKey()
  id!: string;

  @Property()
  @Unique()
  playerId!: string;

  @Property({ columnType: 'bigint', type: 'number' })
  balanceInCents!: number;
}
