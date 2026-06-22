import { Inject, Injectable } from '@nestjs/common';
import { Round } from '../../domain/entities/round';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';

@Injectable()
export class StartRoundUseCase {
  constructor(@Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository) {}

  async execute(roundId: string, now: Date = new Date()): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId);
    }

    round.start(now);
    await this.roundRepository.save(round);
    return round;
  }
}
