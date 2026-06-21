import { Controller, Get, Post, Headers, ConflictException, NotFoundException } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { GetWalletUseCase } from "../../application/use-cases/get-wallet.use-case";
import { Wallet } from "../../domain/entities/wallet";
import { WalletAlreadyExistsError } from "../../domain/errors/wallet-already-exists.error";
import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";

function toResponseDto(wallet: Wallet): WalletResponseDto {
  return {
    id: wallet.id,
    playerId: wallet.playerId,
    balanceInCents: wallet.balance.cents,
  };
}

@Controller()
export class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  async create(@Headers("x-player-id") playerId: string): Promise<WalletResponseDto> {
    try {
      const wallet = await this.createWalletUseCase.execute(playerId);
      return toResponseDto(wallet);
    } catch (error) {
      if (error instanceof WalletAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get("me")
  async getMine(@Headers("x-player-id") playerId: string): Promise<WalletResponseDto> {
    try {
      const wallet = await this.getWalletUseCase.execute(playerId);
      return toResponseDto(wallet);
    } catch (error) {
      if (error instanceof WalletNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
