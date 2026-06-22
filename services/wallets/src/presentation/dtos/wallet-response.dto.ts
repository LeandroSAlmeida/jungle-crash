import { ApiProperty } from "@nestjs/swagger";

export class WalletResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  playerId: string;

  @ApiProperty({ description: "Saldo em centavos, nunca em float" })
  balanceInCents: number;
}
