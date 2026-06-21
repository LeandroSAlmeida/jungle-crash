import { Round, RoundPhase } from '../../domain/entities/round';

export class RoundResponseDto {
  id!: string;
  phase!: RoundPhase;
  hash!: string;
  crashPoint?: number;
}

export function toRoundResponseDto(round: Round): RoundResponseDto {
  return {
    id: round.id,
    phase: round.phase,
    hash: round.hash,
    crashPoint: round.phase === RoundPhase.CRASHED ? round.crashPoint : undefined,
  };
}
