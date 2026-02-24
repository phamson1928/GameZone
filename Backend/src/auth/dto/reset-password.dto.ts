import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        example: 'abc123def456...',
        description: 'Token đặt lại mật khẩu nhận từ email',
    })
    @IsString()
    token!: string;

    @ApiProperty({
        example: 'NewPassword123',
        description: 'Mật khẩu mới (min 6 ký tự)',
    })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    @MaxLength(100, { message: 'Password must not exceed 100 characters' })
    newPassword!: string;
}
