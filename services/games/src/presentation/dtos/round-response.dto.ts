import { ApiProperty } from '@nestjs/swagger';
import { MULTIPLIER_GROWTH_RATE, Round, RoundPhase } from '../../domain/entities/round';

export class RoundResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: RoundPhase })
  phase!: RoundPhase;

  @ApiProperty({ description: 'SHA256(serverSeed), publicado antes do crash' })
  hash!: string;

  @ApiProperty({ required: false, description: 'Só presente quando a rodada já crashou' })
  crashPoint?: number;

  @ApiProperty({ required: false, description: 'ISO 8601, só presente enquanto a rodada está RUNNING' })
  startedAt?: string;

  @ApiProperty({ required: false })
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
