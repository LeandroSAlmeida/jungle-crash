import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { WalletsController } from './presentation/controllers/wallets.controller';
import { WalletEntity } from './infrastructure/persistence/entities/wallet.entity';
import { MikroOrmWalletRepository } from './infrastructure/persistence/repositories/mikro-orm-wallet.repository';
import { WALLET_REPOSITORY } from './domain/repositories/wallet.repository';
import { CreateWalletUseCase } from './application/use-cases/create-wallet.use-case';
import { GetWalletUseCase } from './application/use-cases/get-wallet.use-case';
import { CreditWalletUseCase } from './application/use-cases/credit-wallet.use-case';
import { DebitWalletUseCase } from './application/use-cases/debit-wallet.use-case';

@Module({
  imports: [MikroOrmModule.forFeature([WalletEntity])],
  controllers: [WalletsController],
  providers: [
    { provide: WALLET_REPOSITORY, useClass: MikroOrmWalletRepository },
    CreateWalletUseCase,
    GetWalletUseCase,
    CreditWalletUseCase,
    DebitWalletUseCase,
  ],
})
export class WalletsModule {}
