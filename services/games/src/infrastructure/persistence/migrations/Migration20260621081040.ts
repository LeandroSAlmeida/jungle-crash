import { Migration } from '@mikro-orm/migrations';

export class Migration20260621081040 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "bets" drop constraint if exists "bets_status_check";`);

    this.addSql(`alter table "bets" add constraint "bets_status_check" check("status" in ('PENDING', 'CASHED_OUT', 'LOST', 'REJECTED'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "bets" drop constraint if exists "bets_status_check";`);

    this.addSql(`alter table "bets" add constraint "bets_status_check" check("status" in ('PENDING', 'CASHED_OUT', 'LOST'));`);
  }

}
