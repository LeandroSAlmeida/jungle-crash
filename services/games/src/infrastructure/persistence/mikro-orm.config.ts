import { defineConfig } from '@mikro-orm/postgresql';
import { RoundEntity } from './entities/round.entity';
import { BetEntity } from './entities/bet.entity';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities: [RoundEntity, BetEntity],
  migrations: {
    path: 'src/infrastructure/persistence/migrations',
  },
});
