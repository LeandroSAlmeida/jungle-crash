import { Bet, BetStatus } from '../../domain/entities/bet';

export class BetResponseDto {
  id: string;
  roundId: string;
  playerId: string;
  amountInCents: number;
  status: BetStatus;
  cashoutMultiplier?: number;
  payoutInCents?: number;
}

export function toBetResponseDto(bet: Bet): BetResponseDto {
  return {
    id: bet.id,
    roundId: bet.roundId,
    playerId: bet.playerId,
    amountInCents: bet.amount.cents,
    status: bet.status,
    cashoutMultiplier: bet.cashoutMultiplier ?? undefined,
    payoutInCents: bet.status === BetStatus.CASHED_OUT ? bet.payout.cents : undefined,
  };
}
