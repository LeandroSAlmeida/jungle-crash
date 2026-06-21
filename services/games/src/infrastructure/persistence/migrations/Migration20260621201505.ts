import { Migration } from '@mikro-orm/migrations';

export class Migration20260621201505 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "bets" add column "created_at" timestamptz not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "bets" drop column "created_at";`);
  }

}
