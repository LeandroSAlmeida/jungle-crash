import { Migration } from '@mikro-orm/migrations';

export class Migration20260621014306 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "bets" ("id" varchar(255) not null, "round_id" varchar(255) not null, "player_id" varchar(255) not null, "amount_in_cents" bigint not null, "status" text check ("status" in ('PENDING', 'CASHED_OUT', 'LOST')) not null, "cashout_multiplier" real null, constraint "bets_pkey" primary key ("id"));`);
    this.addSql(`alter table "bets" add constraint "bets_round_id_player_id_unique" unique ("round_id", "player_id");`);

    this.addSql(`create table "rounds" ("id" varchar(255) not null, "phase" text check ("phase" in ('BETTING', 'RUNNING', 'CRASHED')) not null, "hash" varchar(255) not null, "server_seed" varchar(255) not null, "crash_point" real not null, "started_at" timestamptz null, constraint "rounds_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "bets" cascade;`);

    this.addSql(`drop table if exists "rounds" cascade;`);
  }

}
