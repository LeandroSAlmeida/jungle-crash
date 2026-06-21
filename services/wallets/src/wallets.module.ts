import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { WalletsController } from './presentation/controllers/wallets.controller';
import { WalletEntity } from './infrastructure/persistence/entities/wallet.entity';
import { MikroOrmWalletRepository } from './infrastructure/persistence/repositories/mikro-orm-wallet.repository';
import { WALLET_REPOSITORY } from './domain/repositories/wallet.repository';
import { EVENT_PUBLISHER } from './application/ports/event-publisher';
import { RabbitMqEventPublisher } from './infrastructure/messaging/rabbitmq-event-publisher';
import { BettingEventsConsumer } from './infrastructure/messaging/betting-events.consumer';
import { CreateWalletUseCase } from './application/use-cases/create-wallet.use-case';
import { GetWalletUseCase } from './application/use-cases/get-wallet.use-case';
import { CreditWalletUseCase } from './application/use-cases/credit-wallet.use-case';
import { DebitWalletUseCase } from './application/use-cases/debit-wallet.use-case';

@Module({
  imports: [MikroOrmModule.forFeature([WalletEntity])],
  controllers: [WalletsController],
  providers: [
    { provide: WALLET_REPOSITORY, useClass: MikroOrmWalletRepository },
    { provide: EVENT_PUBLISHER, useClass: RabbitMqEventPublisher },
    BettingEventsConsumer,
    CreateWalletUseCase,
    GetWalletUseCase,
    CreditWalletUseCase,
    DebitWalletUseCase,
  ],
})
export class WalletsModule {}
