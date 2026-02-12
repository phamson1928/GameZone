import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Google ID token from client-side Google Sign-In',
  })
  @IsString()
  @IsNotEmpty({ message: 'idToken is required' })
  idToken!: string;
}
