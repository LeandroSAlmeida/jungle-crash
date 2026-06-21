import { Inject, Injectable } from '@nestjs/common';
import { ROUND_REPOSITORY, type RoundRepository } from '../../domain/repositories/round.repository';
import { ProvablyFairResult } from '../../domain/value-objects/provably-fair-result';
import { RoundNotFoundError } from '../../domain/errors/round-not-found.error';

export interface VerifyRoundResult {
  hash: string;
  serverSeed: string;
  crashPoint: number;
  verified: boolean;
}

@Injectable()
export class VerifyRoundUseCase {
  constructor(@Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository) {}

  async execute(roundId: string): Promise<VerifyRoundResult> {
    const round = await this.roundRepository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundError(roundId);
    }

    const hash = round.hash;
    const serverSeed = round.serverSeed;
    const crashPoint = round.crashPoint;
    const verified = ProvablyFairResult.verify(serverSeed, hash, crashPoint);

    return { hash, serverSeed, crashPoint, verified };
  }
}
