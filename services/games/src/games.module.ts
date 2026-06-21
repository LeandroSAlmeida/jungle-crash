import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { BETTING_EXCHANGE } from '@crash/contracts';
import { GamesController } from './presentation/controllers/games.controller';
import { RoundEntity } from './infrastructure/persistence/entities/round.entity';
import { BetEntity } from './infrastructure/persistence/entities/bet.entity';
import { MikroOrmRoundRepository } from './infrastructure/persistence/repositories/mikro-orm-round.repository';
import { MikroOrmBetRepository } from './infrastructure/persistence/repositories/mikro-orm-bet.repository';
import { ROUND_REPOSITORY } from './domain/repositories/round.repository';
import { BET_REPOSITORY } from './domain/repositories/bet.repository';
import { EVENT_PUBLISHER } from './application/ports/event-publisher';
import { RabbitMqEventPublisher } from './infrastructure/messaging/rabbitmq-event-publisher';
import { BetCompensationConsumer } from './infrastructure/messaging/bet-compensation.consumer';
import { CreateRoundUseCase } from './application/use-cases/create-round.use-case';
import { StartRoundUseCase } from './application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from './application/use-cases/crash-round.use-case';
import { PlaceBetUseCase } from './application/use-cases/place-bet.use-case';
import { CashOutUseCase } from './application/use-cases/cash-out.use-case';
import { RejectBetUseCase } from './application/use-cases/reject-bet.use-case';
import { GetCurrentRoundUseCase } from './application/use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from './application/use-cases/get-round-history.use-case';
import { VerifyRoundUseCase } from './application/use-cases/verify-round.use-case';
import { GetPlayerBetsUseCase } from './application/use-cases/get-player-bets.use-case';

@Module({
  imports: [
    MikroOrmModule.forFeature([RoundEntity, BetEntity]),
    RabbitMQModule.forRoot({
      exchanges: [{ name: BETTING_EXCHANGE, type: 'topic' }],
      uri: process.env.RABBITMQ_URL ?? '',
    }),
  ],
  controllers: [GamesController],
  providers: [
    { provide: ROUND_REPOSITORY, useClass: MikroOrmRoundRepository },
    { provide: BET_REPOSITORY, useClass: MikroOrmBetRepository },
    { provide: EVENT_PUBLISHER, useClass: RabbitMqEventPublisher },
    BetCompensationConsumer,
    CreateRoundUseCase,
    StartRoundUseCase,
    CrashRoundUseCase,
    PlaceBetUseCase,
    CashOutUseCase,
    RejectBetUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    VerifyRoundUseCase,
    GetPlayerBetsUseCase,
  ],
})
export class GamesModule {}
