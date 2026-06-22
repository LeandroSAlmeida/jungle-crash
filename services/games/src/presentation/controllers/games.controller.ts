import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentPlayer, CurrentUsername } from '@crash/auth';
import { HealthCheckResponseDto } from '../dtos/health-check-response.dto';
import { RoundResponseDto, toRoundResponseDto } from '../dtos/round-response.dto';
import { BetResponseDto, toBetResponseDto } from '../dtos/bet-response.dto';
import { PlaceBetRequestDto } from '../dtos/place-bet-request.dto';
import { GetCurrentRoundUseCase } from '../../application/use-cases/get-current-round.use-case';
import { GetRoundHistoryUseCase } from '../../application/use-cases/get-round-history.use-case';
import { VerifyRoundUseCase } from '../../application/use-cases/verify-round.use-case';
import { GetPlayerBetsUseCase } from '../../application/use-cases/get-player-bets.use-case';
import { PlaceBetUseCase } from '../../application/use-cases/place-bet.use-case';
import { CashOutUseCase } from '../../application/use-cases/cash-out.use-case';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';
import { NoCurrentRoundError } from '../../domain/errors/no-current-round.error';
import { CrashDataNotRevealedError } from '../../domain/errors/crash-data-not-revealed.error';
import { RoundNotAcceptingBetsError } from '../../domain/errors/round-not-accepting-bets.error';
import { AlreadyBetThisRoundError } from '../../domain/errors/already-bet-this-round.error';
import { InvalidBetAmountError } from '../../domain/errors/invalid-bet-amount.error';
import { BetNotFoundError } from '../../domain/errors/bet-not-found.error';
import { BetNotPendingError } from '../../domain/errors/bet-not-pending.error';

const DEFAULT_PAGE_SIZE = 20;

@Controller()
export class GamesController {
  constructor(
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly verifyRoundUseCase: VerifyRoundUseCase,
    private readonly getPlayerBetsUseCase: GetPlayerBetsUseCase,
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
  ) {}

  @Get('health')
  check(): HealthCheckResponseDto {
    return { status: 'ok', service: 'games' };
  }

  @Get('rounds/current')
  async getCurrentRound(): Promise<{ round: RoundResponseDto; bets: BetResponseDto[] }> {
    try {
      const { round, bets } = await this.getCurrentRoundUseCase.execute();
      return { round: toRoundResponseDto(round), bets: bets.map(toBetResponseDto) };
    } catch (error) {
      if (error instanceof NoCurrentRoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get('rounds/history')
  async getRoundHistory(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<RoundResponseDto[]> {
    const rounds = await this.getRoundHistoryUseCase.execute(
      limit ? Number(limit) : DEFAULT_PAGE_SIZE,
      offset ? Number(offset) : 0,
    );
    return rounds.map(toRoundResponseDto);
  }

  @Get('rounds/:roundId/verify')
  async verifyRound(@Param('roundId') roundId: string) {
    try {
      return await this.verifyRoundUseCase.execute(roundId);
    } catch (error) {
      if (error instanceof RoundNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof CrashDataNotRevealedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('bets/me')
  async getMyBets(
    @CurrentPlayer() playerId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<BetResponseDto[]> {
    const bets = await this.getPlayerBetsUseCase.execute(
      playerId,
      limit ? Number(limit) : DEFAULT_PAGE_SIZE,
      offset ? Number(offset) : 0,
    );
    return bets.map(toBetResponseDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bet')
  async placeBet(
    @CurrentPlayer() playerId: string,
    @CurrentUsername() username: string | undefined,
    @Body() body: PlaceBetRequestDto,
  ): Promise<BetResponseDto> {
    try {
      const { round } = await this.getCurrentRoundUseCase.execute();
      const bet = await this.placeBetUseCase.execute(round.id, playerId, body.amountInCents, username);
      return toBetResponseDto(bet);
    } catch (error) {
      if (error instanceof NoCurrentRoundError || error instanceof RoundNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof RoundNotAcceptingBetsError || error instanceof AlreadyBetThisRoundError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof InvalidBetAmountError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('bet/cashout')
  async cashOut(@CurrentPlayer() playerId: string): Promise<BetResponseDto> {
    try {
      const { round } = await this.getCurrentRoundUseCase.execute();
      const bet = await this.cashOutUseCase.execute(round.id, playerId);
      return toBetResponseDto(bet);
    } catch (error) {
      if (
        error instanceof NoCurrentRoundError ||
        error instanceof RoundNotFoundError ||
        error instanceof BetNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BetNotPendingError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
