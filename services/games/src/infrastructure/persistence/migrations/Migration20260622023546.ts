import { Migration } from '@mikro-orm/migrations';

export class Migration20260622023546 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "rounds" add column "previous_round_id" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "rounds" drop column "previous_round_id";`);
  }

}
