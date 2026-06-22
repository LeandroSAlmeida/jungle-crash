import { Migration } from '@mikro-orm/migrations';

export class Migration20260622015503 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "bets" add column "username" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "bets" drop column "username";`);
  }

}
