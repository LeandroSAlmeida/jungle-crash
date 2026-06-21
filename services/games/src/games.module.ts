import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GamesController } from './presentation/controllers/games.controller';
import { RoundEntity } from './infrastructure/persistence/entities/round.entity';
import { BetEntity } from './infrastructure/persistence/entities/bet.entity';
import { MikroOrmRoundRepository } from './infrastructure/persistence/repositories/mikro-orm-round.repository';
import { MikroOrmBetRepository } from './infrastructure/persistence/repositories/mikro-orm-bet.repository';
import { ROUND_REPOSITORY } from './domain/repositories/round.repository';
import { BET_REPOSITORY } from './domain/repositories/bet.repository';
import { CreateRoundUseCase } from './application/use-cases/create-round.use-case';
import { StartRoundUseCase } from './application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from './application/use-cases/crash-round.use-case';
import { PlaceBetUseCase } from './application/use-cases/place-bet.use-case';
import { CashOutUseCase } from './application/use-cases/cash-out.use-case';

@Module({
  imports: [MikroOrmModule.forFeature([RoundEntity, BetEntity])],
  controllers: [GamesController],
  providers: [
    { provide: ROUND_REPOSITORY, useClass: MikroOrmRoundRepository },
    { provide: BET_REPOSITORY, useClass: MikroOrmBetRepository },
    CreateRoundUseCase,
    StartRoundUseCase,
    CrashRoundUseCase,
    PlaceBetUseCase,
    CashOutUseCase,
  ],
})
export class GamesModule {}
