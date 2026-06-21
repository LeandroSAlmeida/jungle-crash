import { Inject, Injectable } from '@nestjs/common';
import { Round } from '../../domain/entities/round';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';

@Injectable()
export class CreateRoundUseCase {
  constructor(@Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository) {}

  async execute(): Promise<Round> {
    const round = Round.create();
    await this.roundRepository.save(round);
    return round;
  }
}
