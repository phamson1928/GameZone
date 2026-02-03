import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiPropertyOptional({ example: 'I love playing FPS games!' })
  bio?: string | null;

  @ApiPropertyOptional({ example: 'Competitive' })
  playStyle?: string | null;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' })
  timezone?: string | null;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  lastActiveAt?: Date | null;
}

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'gamer123' })
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string | null;

  @ApiProperty({ example: 'USER', enum: ['USER', 'ADMIN'] })
  role: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'BANNED'] })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ type: UserProfileResponseDto })
  profile?: UserProfileResponseDto | null;
}

export class PublicUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'gamer123' })
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ type: UserProfileResponseDto })
  profile?: UserProfileResponseDto | null;
}
