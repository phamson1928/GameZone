# Phase 7 - Notifications (Backend)

## 1. Mục tiêu

- User xem danh sách thông báo, đánh dấu đọc, xóa.
- Realtime qua WebSocket (thông báo mới + badge số chưa đọc).

---

## 2. Làm gì? Làm thế nào?

### Bước 1: DB — Tạo bảng Notification

**Model (schema.prisma):**

```prisma
enum NotificationType {
  JOIN_REQUEST      // Ai đó gửi request join zone
  REQUEST_APPROVED  // Request được duyệt
  REQUEST_REJECTED  // Request bị từ chối
  GROUP_FORMED      // Group đã tạo
  MEMBER_LEFT       // Ai đó rời group
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String           // VD: "Có 1 request mới"
  data      Json?            // zoneId, groupId, requestId... (optional)
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
}
```

Chạy: `npx prisma migrate dev --name add_notifications`.

---

### Bước 2: API REST

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/notifications` | Danh sách của user (pagination: page, limit) |
| PATCH | `/notifications/:id/read` | Đánh dấu 1 cái đã đọc |
| PATCH | `/notifications/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/notifications/:id` | Xóa 1 notification |

Response GET: `{ items, total, unreadCount }`.

---

### Bước 3: Service

| Method | Mô tả |
|--------|-------|
| `create(userId, type, title, data?)` | Tạo notification, dùng khi gọi từ modules khác |
| `createMany(userIds, type, title, data?)` | Tạo cho nhiều user (vd: GROUP_FORMED) |
| `findForUser(userId, page, limit)` | Lấy list + unreadCount |
| `markRead(userId, id)` | Đánh dấu đọc |
| `markAllRead(userId)` | Đánh dấu tất cả đọc |
| `delete(userId, id)` | Xóa (chỉ notification của chính user) |

---

### Bước 4: Realtime (WebSocket)

- Dùng lại `chat.gateway` (đã có auth + room).
- Emit 1 event: `notification:new` — payload = `{ notification, unreadCount }`.
- Gọi emit trong `NotificationsService.create()` / `createMany()` sau khi lưu DB.

---

### Bước 5: Gắn vào business logic

| Khi nào | Gọi gì | Cho ai |
|---------|--------|--------|
| User gửi join request | `create(ownerId, JOIN_REQUEST, "Có request mới", {zoneId, requestId})` | Chủ zone |
| Owner approve/reject | `create(requesterId, REQUEST_APPROVED/REJECTED, "Request đã xử lý", {...})` | Người gửi request |
| Zone đủ người → tạo group | `createMany(memberIds, GROUP_FORMED, "Group đã tạo", {groupId})` | Tất cả members |
| User rời group | `create(leaderId, MEMBER_LEFT, "Ai đó rời group", {groupId})` | Leader |

Inject `NotificationsService` vào: Zone (join flow), Groups (form/dissolve/leave).

---

## 3. Checklist ngắn gọn

- [ ] Thêm enum + model Notification, chạy migration
- [ ] Viết NotificationsService + controller (4 endpoints)
- [ ] Emit `notification:new` qua gateway
- [ ] Gắn create/createMany vào: join request, approve/reject, group formed, member left
- [ ] Viết `NotificationsCleanupService` (cron mỗi ngày xóa notifications đã đọc quá 90 ngày dựa trên `createdAt`)

---

## 4. Lưu ý

- Chỉ dùng `data` khi cần (vd: navigate đến zone/group).
- `NEW_MESSAGE` bỏ qua ở Phase 7 — dễ spam, làm sau.
- Security: mọi thao tác đều `where { userId: currentUser.id }`.
