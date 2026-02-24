# Phase 6: Real-time Chat — Hướng dẫn dành cho sinh viên

---

## 🤔 Chat real-time hoạt động như thế nào?

Khi làm CRUD thông thường, client phải **hỏi server** ("có tin nhắn mới không?") — đây gọi là HTTP polling, rất chậm.

Với **WebSocket**, sau khi kết nối, server có thể **chủ động đẩy dữ liệu xuống client** bất cứ lúc nào. Giống như đường dây điện thoại — khi kết nối rồi, 2 bên có thể nói chuyện bất cứ lúc nào.

```
HTTP (CRUD thông thường):         WebSocket (Chat real-time):
Client ──▶ Request ──▶ Server     Client ◀──▶ Server  (2 chiều, liên tục)
Client ◀── Response ◀── Server    (server có thể push bất cứ lúc nào)
```

**Socket.io** là thư viện giúp dùng WebSocket dễ hơn. NestJS có sẵn support qua `@WebSocketGateway`.

---

## 📚 Kiến thức cần học trước khi làm

### Cần biết (bắt buộc)

| # | Chủ đề | Học ở đâu |
|---|---|---|
| 1 | **WebSocket là gì** — khác HTTP như thế nào, khi nào dùng | [Fireship - WebSocket in 100s](https://youtu.be/1BfCnjr_Vjg) |
| 2 | **Socket.io cơ bản** — `emit`, `on`, `room`, `namespace` | [Socket.io docs - Get started](https://socket.io/get-started/chat) |
| 3 | **NestJS Gateway** — `@WebSocketGateway`, `@SubscribeMessage`, `@WebSocketServer` | [NestJS docs - Gateways](https://docs.nestjs.com/websockets/gateways) |
| 4 | **NestJS Guards cho WebSocket** — `CanActivate`, `ExecutionContext` với WS | [NestJS docs - Guards](https://docs.nestjs.com/guards) (đọc phần WebSocket) |

### Nên biết thêm (giúp làm tốt hơn)

| # | Chủ đề | Ghi chú |
|---|---|---|
| 5 | **JWT trong WebSocket** — khác HTTP ở chỗ không có header `Authorization` thông thường, token gửi qua `handshake.auth` | Đọc phần dưới |
| 6 | **Hard delete vs Soft delete** — hệ thống hiện tại dùng **hard delete** cho messages để tiết kiệm storage | Xem `messages.service.ts` |
| 7 | **Database indexing** — tại sao cần `@@index([groupId, createdAt])` cho chat | [Prisma docs - Indexes](https://www.prisma.io/docs/concepts/components/prisma-schema/indexes) |

---

## 🗂️ Sẽ tạo những file nào?

```
src/
├── messages/                    ← MODULE MỚI (REST API)
│   ├── messages.module.ts
│   ├── messages.service.ts
│   ├── messages.controller.ts
│   └── dto/
│       ├── message-query.dto.ts
│       └── message-response.dto.ts
│
├── chat/                        ← MODULE MỚI (WebSocket)
│   ├── chat.module.ts
│   ├── chat.gateway.ts          ← "Controller" của WebSocket
│   └── ws-jwt.guard.ts          ← Guard xác thực JWT qua WS
│
└── groups/
    └── groups.module.ts         ← CHỈNH SỬA: thêm exports
```

---

## 📋 Các bước thực hiện

### Bước 1 — Cập nhật Prisma Schema

Thêm `isDeleted` vào model `Message` (để khi xóa tin nhắn, vẫn còn trong DB):

```prisma
// prisma/schema.prisma
model Message {
  id        String  @id @default(uuid())
  groupId   String
  senderId  String
  content   String
  isDeleted Boolean @default(false)   // ← THÊM DÒNG NÀY

  group  Group @relation(fields: [groupId], references: [id])
  sender User  @relation(fields: [senderId], references: [id])

  createdAt DateTime @default(now())

  @@index([groupId, createdAt])        // ← THÊM DÒNG NÀY (tăng tốc query)
}
```

Sau đó chạy migration:
```bash
npx prisma migrate dev --name add_message_soft_delete
```

---

### Bước 2 — Cài thư viện Socket.io

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

---

### Bước 3 — Tạo `MessagesModule` (REST API)

Đây là phần bạn đã quen — CRUD thông thường.

**`messages.service.ts`** cần 4 hàm:

| Hàm | Làm gì |
|---|---|
| `getGroupMessages(userId, groupId, page, limit)` | Kiểm tra user có trong group không → lấy tin nhắn |
| `createMessage(senderId, groupId, content)` | INSERT 1 tin nhắn vào DB (gọi từ Gateway, không phải REST). Content tối đa 2000 ký tự |
| `deleteMessage(userId, messageId)` | Chỉ người gửi được xóa → **hard delete** (xóa hẳn khỏi DB) |
| `adminDeleteMessage(messageId)` | Admin xóa bất kỳ tin nhắn → **hard delete** |

**`messages.controller.ts`** có 4 endpoint:

```
GET    /groups/:id/messages        → Lịch sử chat (member only)
DELETE /messages/:id               → Xóa tin nhắn của mình
GET    /messages/admin             → Danh sách messages (admin)
DELETE /messages/admin/:id         → Admin xóa message
```

---

### Bước 4 — Tạo `WsJwtGuard`

Đây là phần **khác nhất** so với HTTP thông thường.

Trong HTTP, client gửi token qua header:
```
Authorization: Bearer <token>
```

Trong WebSocket, không có header như vậy. Client gửi token lúc **kết nối** (handshake):
```javascript
// Phía React Native client
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'Bearer <accessToken>' }
});
```

Guard phía server sẽ đọc token từ `client.handshake.auth.token`:

```typescript
// ws-jwt.guard.ts — đại ý như sau
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth?.token?.replace('Bearer ', '');
    // verify token → gắn user vào client.data.user
    const user = this.jwtService.verify(token);
    client.data.user = user;
    return true;
  }
}
```

---

### Bước 5 — Tạo `ChatGateway`

Gateway giống như Controller nhưng cho WebSocket. Dùng `@SubscribeMessage` thay vì `@Get/@Post`.

**Các "event" (giống endpoint nhưng là tên string):**

| Client gửi lên | Server nhận | Mô tả |
|---|---|---|
| `joinRoom` | `{ groupId }` | Client xin vào phòng chat của group |
| `leaveRoom` | `{ groupId }` | Client rời phòng |
| `sendMessage` | `{ groupId, content }` | Gửi tin nhắn |
| `typing` | `{ groupId, isTyping }` | "Đang nhập..." |

| Server đẩy xuống | Payload | Mô tả |
|---|---|---|
| `newMessage` | `{ id, content, sender, createdAt }` | Tin nhắn mới (broadcast cho cả phòng) |
| `userTyping` | `{ userId, username, isTyping }` | Ai đó đang nhập |
| `error` | `{ message }` | Báo lỗi cho client |

**Logic của `sendMessage`:**
```
1. Lấy user từ socket.data.user (đã verify bởi WsJwtGuard)
2. Gọi MessagesService.createMessage() → lưu vào DB
3. Emit "newMessage" tới TẤT CẢ người trong phòng group đó
   (dùng this.server.to(`group:${groupId}`).emit(...))
```

**Tại sao không lưu DB cho "typing"?**
Vì "đang nhập..." không cần lưu — chỉ cần relay ngay lập tức rồi thôi.

---

### Bước 6 — Kết nối vào AppModule

Thêm 2 module mới vào `app.module.ts`:
```typescript
import { MessagesModule } from './messages/messages.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ..., // modules cũ
    MessagesModule,
    ChatModule,
  ],
})
export class AppModule {}
```

Và export `GroupsService` từ `groups.module.ts` để các module khác dùng được:
```typescript
@Module({
  providers: [GroupsService],
  exports: [GroupsService], // ← thêm dòng này
})
export class GroupsModule {}
```

---

## ✅ Kiểm tra thủ công

### Test WebSocket bằng Postman:
1. Mở Postman → New → **WebSocket Request**
2. URL: `ws://localhost:3000/chat`
3. Headers / Auth: thêm `auth.token = Bearer <JWT>`
4. Connect → emit `joinRoom` → emit `sendMessage`

### Test REST bằng Postman thông thường:
```
GET http://localhost:3000/groups/<groupId>/messages
Authorization: Bearer <token>
```

---

## 🗓️ Thứ tự học đề xuất

```
Ngày 1-2:  Xem video WebSocket + đọc docs Socket.io cơ bản
Ngày 3:    Đọc NestJS Gateways docs, thử tạo gateway "hello world"
Ngày 4:    Hiểu WsJwtGuard — đọc lại phần JWT guard trong codebase
Ngày 5-6:  Bắt đầu code theo từng bước ở trên
Ngày 7:    Test bằng Postman WebSocket
```

---

## ❓ Những điểm hay nhầm lẫn

| Nhầm lẫn | Thực tế |
|---|---|
| "Gateway thay thế Controller" | Không — Gateway và Controller tồn tại **song song**. REST dùng Controller, WebSocket dùng Gateway. |
| "Cần thay đổi main.ts nhiều" | Không — NestJS tự động kích hoạt Gateway khi import module. |
| "Token gửi như HTTP" | Không — WS gửi token lúc handshake qua `socket.handshake.auth.token`. |
| "Mỗi tin nhắn đều gọi DB 2 lần" | Chỉ 1 lần INSERT, sau đó broadcast từ memory — không query lại DB. |
