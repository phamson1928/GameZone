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
  ) { }

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

    if (data.content.trim().length > 2000) {
      throw new WsException('Tin nhắn không được vượt quá 2000 ký tự');
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