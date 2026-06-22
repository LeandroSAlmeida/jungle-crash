import { ApiProperty } from '@nestjs/swagger';
import { Bet, BetStatus } from '../../domain/entities/bet';

export class BetResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  roundId!: string;

  @ApiProperty()
  playerId!: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ description: 'Valor da aposta em centavos' })
  amountInCents!: number;

  @ApiProperty({ enum: BetStatus })
  status!: BetStatus;

  @ApiProperty({ required: false })
  cashoutMultiplier?: number;

  @ApiProperty({ required: false, description: 'Em centavos, só presente quando CASHED_OUT' })
  payoutInCents?: number;
}

export function toBetResponseDto(bet: Bet): BetResponseDto {
  return {
    id: bet.id,
    roundId: bet.roundId,
    playerId: bet.playerId,
    username: bet.username ?? undefined,
    amountInCents: bet.amount.cents,
    status: bet.status,
    cashoutMultiplier: bet.cashoutMultiplier ?? undefined,
    payoutInCents: bet.status === BetStatus.CASHED_OUT ? bet.payout.cents : undefined,
  };
}
