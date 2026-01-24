import { ApiProperty } from '@nestjs/swagger';

export class TokensResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'gamer123',
    description: 'Username',
  })
  username: string;

  @ApiProperty({ type: TokensResponseDto })
  tokens: TokensResponseDto;
}
