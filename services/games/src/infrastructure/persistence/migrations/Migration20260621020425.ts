import { Migration } from '@mikro-orm/migrations';

export class Migration20260621020425 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "bets" alter column "cashout_multiplier" type double precision using ("cashout_multiplier"::double precision);`);

    this.addSql(`alter table "rounds" alter column "crash_point" type double precision using ("crash_point"::double precision);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "bets" alter column "cashout_multiplier" type float4 using ("cashout_multiplier"::float4);`);

    this.addSql(`alter table "rounds" alter column "crash_point" type float4 using ("crash_point"::float4);`);
  }

}
