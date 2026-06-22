import { ApiProperty } from '@nestjs/swagger';

export class PlaceBetRequestDto {
  @ApiProperty({ description: 'Em centavos, entre 100 (R$1,00) e 100000 (R$1.000,00)' })
  amountInCents!: number;
}
