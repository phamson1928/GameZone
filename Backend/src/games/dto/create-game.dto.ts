import { IsString, IsNotEmpty, IsUrl, IsEnum } from 'class-validator';
import { Platform } from '@prisma/client';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsUrl()
  @IsNotEmpty()
  iconUrl: string = '';

  @IsUrl()
  @IsNotEmpty()
  bannerUrl: string = '';

  @IsEnum(Platform, { each: true })
  @IsNotEmpty()
  platforms: Platform[] = [Platform.PC];
}
