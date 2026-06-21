import { Inject, Injectable } from '@nestjs/common';
import { Bet } from '../../domain/entities/bet';
import { BET_REPOSITORY, type BetRepository } from '../../domain/repositories/bet.repository';

@Injectable()
export class GetPlayerBetsUseCase {
  constructor(@Inject(BET_REPOSITORY) private readonly betRepository: BetRepository) {}

  async execute(playerId: string, limit: number, offset: number): Promise<Bet[]> {
    return this.betRepository.findByPlayerId(playerId, limit, offset);
  }
}
