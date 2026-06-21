import { Inject, Injectable } from '@nestjs/common';
import { Round } from '../../domain/entities/round';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';

@Injectable()
export class GetRoundHistoryUseCase {
  constructor(@Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository) {}

  async execute(limit: number, offset: number): Promise<Round[]> {
    return this.roundRepository.findHistory(limit, offset);
  }
}
