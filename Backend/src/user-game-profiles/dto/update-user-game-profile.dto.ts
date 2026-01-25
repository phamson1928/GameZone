import { ApiProperty } from '@nestjs/swagger';
import { RankLevel } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserGameProfileDto {
  @ApiProperty({ enum: RankLevel, example: RankLevel.INTERMEDIATE })
  @IsEnum(RankLevel)
  @IsNotEmpty()
  rankLevel: RankLevel;
}
