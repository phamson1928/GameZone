import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email đã đăng ký để nhận link đặt lại mật khẩu',
    })
    @IsEmail({}, { message: 'Invalid email format' })
    email!: string;
}
