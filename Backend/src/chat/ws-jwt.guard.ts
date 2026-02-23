import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const client: Socket = context.switchToWs().getClient();

        // Lấy token từ handshake.auth (React Native gửi lên khi connect)
        const rawToken: string = client.handshake.auth?.token || '';
        const token = rawToken.replace('Bearer ', '').trim();

        if (!token) {
            throw new WsException('Không có token xác thực');
        }

        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            // Gắn user vào socket.data để các handler dùng sau
            client.data.user = payload;
            return true;
        } catch {
            throw new WsException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
}