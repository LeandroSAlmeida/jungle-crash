import { Migration } from '@mikro-orm/migrations';

export class Migration20260620222713 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "wallets" ("id" varchar(255) not null, "player_id" varchar(255) not null, "balance_in_cents" bigint not null, constraint "wallets_pkey" primary key ("id"));`);
    this.addSql(`alter table "wallets" add constraint "wallets_player_id_unique" unique ("player_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wallets" cascade;`);
  }

}
