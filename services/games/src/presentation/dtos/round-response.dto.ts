import { MULTIPLIER_GROWTH_RATE, Round, RoundPhase } from '../../domain/entities/round';

export class RoundResponseDto {
  id!: string;
  phase!: RoundPhase;
  hash!: string;
  crashPoint?: number;
  startedAt?: string;
  growthRate?: number;
}

export function toRoundResponseDto(round: Round): RoundResponseDto {
  return {
    id: round.id,
    phase: round.phase,
    hash: round.hash,
    crashPoint: round.phase === RoundPhase.CRASHED ? round.crashPoint : undefined,
    startedAt: round.phase === RoundPhase.RUNNING ? round.startedAt?.toISOString() : undefined,
    growthRate: round.phase === RoundPhase.RUNNING ? MULTIPLIER_GROWTH_RATE : undefined,
  };
}
