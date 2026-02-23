# Phase 6: Real-time Chat — Hướng dẫn Code Hoàn Chỉnh

> **Trạng thái hiện tại của dự án:** Các module `chat` và `messages` đã được tạo bởi NestJS CLI nhưng vẫn còn là code placeholder.  
> **Mục tiêu:** Viết đầy đủ logic để có chat real-time hoạt động.

---

## Tổng quan những gì cần làm

```
✅ Đã có sẵn:             ❌ Cần viết:
- chat/chat.module.ts     - chat/ws-jwt.guard.ts       (GUARD mới)
- chat/chat.gateway.ts    - chat/chat.gateway.ts        (GHI ĐÈ logic)
- chat/chat.service.ts    - chat/chat.module.ts         (GHI ĐÈ imports)
- messages/...            - messages/messages.service.ts (GHI ĐÈ logic)
- groups/groups.module.ts - messages/messages.controller.ts (GHI ĐÈ)
- prisma/schema.prisma    - messages/dto/... (GHI ĐÈ DTOs)
                          - Thêm cột isDeleted vào Message
```

---

## Bước 1 — Cài thư viện cần thiết

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install -D @types/socket.io
```

---

## Bước 2 — Cập nhật Prisma Schema

Mở file `prisma/schema.prisma`, tìm model `Message` và thêm `isDeleted` + index:

```prisma
model Message {
  id        String  @id @default(uuid())
  groupId   String
  senderId  String
  content   String
  isDeleted Boolean @default(false)   // ← THÊM DÒNG NÀY

  group  Group @relation(fields: [groupId], references: [id])
  sender User  @relation(fields: [senderId], references: [id])

  createdAt DateTime @default(now())

  @@index([groupId, createdAt])        // ← THÊM DÒNG NÀY
}
```

Sau đó chạy migration:

```bash
npx prisma migrate dev --name add_message_soft_delete
```

---

## Bước 3 — Tạo DTOs cho Messages

### `src/messages/dto/message-query.dto.ts`

> Xóa file `create-message.dto.ts` và `update-message.dto.ts` cũ đi, thay bằng 2 file mới này.

```typescript
// src/messages/dto/message-query.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
```

### `src/messages/dto/message-response.dto.ts`

```typescript
// src/messages/dto/message-response.dto.ts
export class MessageResponseDto {
  id: string;
  groupId: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}
```

---

## Bước 4 — Viết MessagesService

Ghi đè toàn bộ file `src/messages/messages.service.ts`:

```typescript
// src/messages/messages.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy lịch sử chat của một group (chỉ member mới được xem).
   * Trả về tin nhắn theo trang, mỗi trang mặc định 30 tin, sắp xếp mới nhất → cũ nhất.
   */
  async getGroupMessages(
    userId: string,
    groupId: string,
    page: number = 1,
    limit: number = 30,
  ) {
    // 1. Kiểm tra user có phải member của group không
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('Bạn không phải thành viên của group này');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          groupId,
          isDeleted: false, // Không lấy tin nhắn đã xóa
        },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        // Lấy mới nhất trước để dễ phân trang
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({
        where: { groupId, isDeleted: false },
      }),
    ]);

    return {
      data: data.reverse(), // Đảo lại để hiển thị theo thứ tự cũ → mới
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tạo một tin nhắn mới vào DB.
   * Hàm này được gọi từ ChatGateway (WebSocket), không phải từ REST API.
   */
  async createMessage(senderId: string, groupId: string, content: string) {
    return this.prisma.message.create({
      data: { groupId, senderId, content },
      include: {
        sender: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Người dùng xóa tin nhắn của chính mình (soft delete).
   * Chỉ người gửi mới được xóa.
   */
  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Bạn chỉ có thể xoá tin nhắn của mình');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { message: 'Đã xóa tin nhắn' };
  }

  // ========================
  // Admin methods
  // ========================

  /**
   * Admin lấy danh sách tất cả messages (kể cả đã xóa).
   */
  async adminGetMessages(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
          group: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count(),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin xóa bất kỳ tin nhắn nào (soft delete).
   */
  async adminDeleteMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    return { message: 'Admin đã xóa tin nhắn' };
  }
}
```

---

## Bước 5 — Viết MessagesController

Ghi đè toàn bộ file `src/messages/messages.controller.ts`:

```typescript
// src/messages/messages.controller.ts
import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessageQueryDto } from './dto/message-query.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /groups/:id/messages
   * Lấy lịch sử tin nhắn của group. Chỉ member mới được xem.
   */
  @Get('groups/:groupId/messages')
  getGroupMessages(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.messagesService.getGroupMessages(
      req.user.sub,
      groupId,
      query.page,
      query.limit,
    );
  }

  /**
   * DELETE /messages/:id
   * Xóa tin nhắn của chính mình.
   */
  @Delete('messages/:id')
  deleteMessage(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.deleteMessage(req.user.sub, id);
  }

  /**
   * GET /messages/admin
   * Admin lấy danh sách tất cả messages. (Chỉ ADMIN)
   */
  @Roles('ADMIN')
  @Get('messages/admin')
  adminGetMessages(@Query() query: MessageQueryDto) {
    return this.messagesService.adminGetMessages(query.page, query.limit);
  }

  /**
   * DELETE /messages/admin/:id
   * Admin xóa bất kỳ tin nhắn nào. (Chỉ ADMIN)
   */
  @Roles('ADMIN')
  @Delete('messages/admin/:id')
  adminDeleteMessage(@Param('id') id: string) {
    return this.messagesService.adminDeleteMessage(id);
  }
}
```

---

## Bước 6 — Cập nhật MessagesModule

Ghi đè file `src/messages/messages.module.ts`:

```typescript
// src/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService], // Export để ChatGateway dùng
})
export class MessagesModule {}
```

---

## Bước 7 — Tạo WsJwtGuard

Tạo file mới `src/chat/ws-jwt.guard.ts`:

```typescript
// src/chat/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

/**
 * Guard xác thực JWT cho WebSocket.
 * Khác với HTTP: client không gửi token qua header Authorization,
 * mà gửi qua socket.handshake.auth.token khi kết nối.
 *
 * Ví dụ phía client (React Native):
 *   const socket = io('http://192.168.1.x:3000/chat', {
 *     auth: { token: 'Bearer <accessToken>' }
 *   });
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
```

---

## Bước 8 — Viết ChatGateway

Ghi đè toàn bộ file `src/chat/chat.gateway.ts`:

```typescript
// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ChatGateway — "Controller" cho WebSocket.
 *
 * Cổng: 3000 (cùng port với HTTP, Socket.IO tự handle)
 * Namespace: /chat  (client kết nối vào http://host:3000/chat)
 * CORS: cho phép mọi origin trong dev
 *
 * Cách hoạt động của "phòng" (room):
 *   - Khi user vào group chat, client emit 'joinRoom' với { groupId }
 *   - Server cho socket join vào room có tên `group:${groupId}`
 *   - Khi có tin nhắn mới, server emit 'newMessage' vào đúng room đó
 *   - Chỉ những ai đang trong room mới nhận được tin
 */
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagesService: MessagesService,
    private prisma: PrismaService,
  ) {}

  // ==========================
  // Lifecycle hooks
  // ==========================

  handleConnection(client: Socket) {
    console.log(`[Chat] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat] Client disconnected: ${client.id}`);
  }

  // ==========================
  // Events — client gửi lên
  // ==========================

  /**
   * EVENT: 'joinRoom'
   * Client gửi: { groupId: string }
   * Server làm: Kiểm tra user có phải member → cho vào room
   *
   * Ví dụ client:
   *   socket.emit('joinRoom', { groupId: 'abc-123' });
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId: string = client.data.user?.sub;

    // Kiểm tra user có phải member của group không
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId: data.groupId, userId },
      },
    });

    if (!member) {
      throw new WsException('Bạn không phải thành viên của group này');
    }

    // Cho socket join vào room của group
    const roomName = `group:${data.groupId}`;
    await client.join(roomName);

    console.log(`[Chat] User ${userId} joined room ${roomName}`);

    return { success: true, message: `Đã vào phòng ${data.groupId}` };
  }

  /**
   * EVENT: 'leaveRoom'
   * Client gửi: { groupId: string }
   * Server làm: Cho socket rời room
   *
   * Ví dụ client:
   *   socket.emit('leaveRoom', { groupId: 'abc-123' });
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `group:${data.groupId}`;
    await client.leave(roomName);
    return { success: true };
  }

  /**
   * EVENT: 'sendMessage'
   * Client gửi: { groupId: string, content: string }
   * Server làm:
   *   1. Lưu tin nhắn vào DB
   *   2. Broadcast 'newMessage' cho TẤT CẢ người trong room
   *
   * Ví dụ client:
   *   socket.emit('sendMessage', { groupId: 'abc-123', content: 'Chơi không?' });
   *
   * Client lắng nghe tin nhắn mới:
   *   socket.on('newMessage', (msg) => { ... });
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { groupId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId: string = client.data.user?.sub;

    if (!data.content?.trim()) {
      throw new WsException('Nội dung tin nhắn không được để trống');
    }

    // Lưu vào DB thông qua MessagesService
    const message = await this.messagesService.createMessage(
      userId,
      data.groupId,
      data.content.trim(),
    );

    const roomName = `group:${data.groupId}`;

    // Broadcast cho TẤT CẢ người trong room (kể cả người gửi)
    this.server.to(roomName).emit('newMessage', {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender,
    });

    return { success: true };
  }

  /**
   * EVENT: 'typing'
   * Client gửi: { groupId: string, isTyping: boolean }
   * Server làm: Broadcast 'userTyping' cho NHỮNG NGƯỜI KHÁC trong room
   *             (Không lưu vào DB vì không cần thiết)
   *
   * Ví dụ client:
   *   socket.emit('typing', { groupId: 'abc-123', isTyping: true });
   *
   * Client lắng nghe:
   *   socket.on('userTyping', ({ userId, username, isTyping }) => { ... });
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { groupId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const roomName = `group:${data.groupId}`;

    // broadcast = gửi cho TẤT CẢ người trong room NGOẠI TRỪ người gửi
    client.to(roomName).emit('userTyping', {
      userId: user.sub,
      username: user.username,
      isTyping: data.isTyping,
    });
  }
}
```

---

## Bước 9 — Cập nhật ChatModule

Ghi đè file `src/chat/chat.module.ts`:

```typescript
// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { MessagesModule } from '../messages/messages.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    // Import JwtModule để WsJwtGuard có thể verify token
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MessagesModule, // Import để ChatGateway dùng MessagesService
    PrismaModule,
  ],
  providers: [ChatGateway, WsJwtGuard],
})
export class ChatModule {}
```

---

## Bước 10 — Kiểm tra AppModule và GroupsModule

### `src/app.module.ts` — Không cần sửa gì thêm!
`ChatModule` và `MessagesModule` đã được import rồi ✅

### `src/groups/groups.module.ts` — Không cần sửa gì thêm!
`GroupsService` đã được export rồi ✅

---

## Bước 11 — Chạy và kiểm tra

```bash
# Khởi động server
npm run start:dev
```

Nếu thành công, console sẽ hiện:
```
Application is running on: http://localhost:3000
```

---

## Bước 12 — Test bằng Postman

### Test REST API (lấy lịch sử chat):

```
GET http://192.168.1.47:3000/groups/<groupId>/messages?page=1&limit=30
Authorization: Bearer <your_jwt_token>
```

### Test WebSocket bằng Postman:

1. Mở Postman → New → **WebSocket Request**
2. URL: `ws://192.168.1.47:3000/chat` 
3. Trước khi Connect, vào tab **Headers** thêm:
   - (hoặc dùng tab **Messages**) để gửi auth khi kết nối
4. Click **Connect**
5. Sau khi connect, gửi message dạng JSON:

```json
// Bước 1: Vào phòng
42["joinRoom", { "groupId": "YOUR_GROUP_ID" }]

// Bước 2: Gửi tin nhắn
42["sendMessage", { "groupId": "YOUR_GROUP_ID", "content": "Xin chào!" }]
```

> **Ghi chú:** Với Socket.io, format là `42["eventName", data]` trong mode raw WebSocket.  
> Dễ hơn nếu bạn dùng **Postman Socket.io** (chọn Socket.IO thay vì WebSocket thuần).

---

## Bước 13 — Kết nối từ React Native (Frontend)

Tham khảo code này khi bạn implement Chat Screen:

```typescript
// Cài thư viện:
// npm install socket.io-client

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://192.168.1.47:3000';

// 1. Kết nối tới namespace /chat, gửi token qua auth
const socket: Socket = io(`${BASE_URL}/chat`, {
  auth: {
    token: `Bearer ${useAuthStore.getState().accessToken}`,
  },
  transports: ['websocket'], // Dùng WebSocket thuần, không dùng polling
});

// 2. Lắng nghe sự kiện kết nối
socket.on('connect', () => {
  console.log('Đã kết nối tới chat server!');

  // 3. Vào phòng của group
  socket.emit('joinRoom', { groupId: 'YOUR_GROUP_ID' });
});

// 4. Lắng nghe tin nhắn mới
socket.on('newMessage', (message) => {
  console.log('Tin nhắn mới:', message);
  // Thêm vào danh sách tin nhắn trong state
});

// 5. Lắng nghe "đang nhập..."
socket.on('userTyping', ({ userId, username, isTyping }) => {
  if (isTyping) {
    console.log(`${username} đang nhập...`);
  }
});

// 6. Gửi tin nhắn
const sendMessage = (groupId: string, content: string) => {
  socket.emit('sendMessage', { groupId, content });
};

// 7. Thông báo "đang nhập..."
const notifyTyping = (groupId: string, isTyping: boolean) => {
  socket.emit('typing', { groupId, isTyping });
};

// 8. Ngắt kết nối khi rời màn hình
socket.disconnect();
```

---

## Những điều hay quên / dễ lỗi

| Vấn đề | Giải thích |
|---|---|
| "Guards không nhận được token" | WsJwtGuard đọc từ `client.handshake.auth.token`, KHÔNG phải header HTTP |
| "CORS error khi kết nối" | Đảm bảo `cors: { origin: '*' }` trong decorator `@WebSocketGateway` |
| "Message không broadcast" | Kiểm tra client đã `joinRoom` trước chưa. Không vào room thì không nhận được event |
| "Token expired sau vài giờ" | Client cần reconnect và gửi access token mới. Xem xét thêm logic auto-reconnect |
| Không thấy log khi connect | Kiểm tra client dùng đúng URL và namespace (`/chat`), không phải `/` |
