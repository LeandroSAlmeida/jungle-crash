import { defineConfig } from '@mikro-orm/postgresql';
import { WalletEntity } from './entities/wallet.entity';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities: [WalletEntity],
  migrations: {
    path: 'src/infrastructure/persistence/migrations',
  },
});
