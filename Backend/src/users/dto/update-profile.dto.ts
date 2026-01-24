import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'I love playing FPS games!',
    description: 'User bio',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @ApiPropertyOptional({
    example: 'Competitive',
    description: 'User play style',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Play style must not exceed 50 characters' })
  playStyle?: string;

  @ApiPropertyOptional({
    example: 'Asia/Ho_Chi_Minh',
    description: 'User timezone',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Timezone must not exceed 50 characters' })
  timezone?: string;
}
