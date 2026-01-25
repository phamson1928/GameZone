# PlayZone Backend - Development Plan

## Overview

PlayZone là nền tảng tìm bạn chơi game, cho phép người dùng tạo Zone để tìm đồng đội, ghép nhóm và chat với nhau.

---

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Framework | NestJS                       |
| Database  | PostgreSQL                   |
| ORM       | Prisma                       |
| Auth      | JWT (Access + Refresh Token) |
| Real-time | WebSocket (Socket.io)        |
| Container | Docker                       |

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Project Setup

- [x] Khởi tạo NestJS project
- [x] Setup Docker + PostgreSQL
- [x] Setup Prisma schema
- [x] Cấu hình environment variables
- [x] Setup validation (class-validator)
- [x] Setup Swagger documentation
- [x] Setup error handling global

### 1.2 Prisma Module

- [x] Tạo `PrismaModule` + `PrismaService`
- [x] Config connection pooling
- [ ] Tạo base repository pattern (optional)

### 1.3 Common Utilities

- [x] Response DTO chuẩn (success/error)
- [x] Pagination DTO
- [x] Custom decorators (@CurrentUser, @Public)
- [x] Guards (AuthGuard, RolesGuard)

---

## Phase 2: Authentication (Week 2-3) ✅ COMPLETED

### 2.1 Auth Module

- [x] `POST /auth/register` - Đăng ký
- [x] `POST /auth/login` - Đăng nhập (trả về access + refresh token)
- [x] `POST /auth/refresh` - Refresh token
- [x] `POST /auth/logout` - Đăng xuất (revoke refresh token)
- [x] `POST /auth/logout-all` - Đăng xuất tất cả thiết bị

### 2.2 Password & Security

- [x] Hash password với bcrypt (12 salt rounds)
- [x] JWT strategy (Passport.js)
- [x] Rate limiting cho auth endpoints (5-10 req/min)
- [ ] Token blacklist (optional)

### 2.3 User Module

- [x] `GET /users/me` - Lấy thông tin user hiện tại
- [x] `PATCH /users/me` - Cập nhật profile
- [x] `GET /users/:id` - Xem profile user khác (public info)
- [x] `PATCH /users/me/avatar` - Upload avatar URL

---

## Phase 3: Game & User Game Profile (Week 3-4)

### 3.1 Game Module (Admin)

- [x] `GET /games` - Danh sách game
- [x] `GET /games/:id` - Chi tiết game
- [x] `POST /games` - Thêm game (Admin)
- [x] `PATCH /games/:id` - Cập nhật game (Admin)
- [x] `DELETE /games/:id` - Xóa game (Admin)

### 3.2 User Game Profile

- [x] `GET /users/me/games` - Danh sách game của user
- [x] `POST /users/me/games` - Thêm game profile
- [x] `PATCH /users/me/games/:gameId` - Cập nhật rank
- [x] `DELETE /users/me/games/:gameId` - Xóa game profile

---

## Phase 4: Zone - Tìm Bạn (Week 4-6)

### 4.1 Zone CRUD

- [ ] `POST /zones` - Tạo zone mới
- [ ] `GET /zones` - Danh sách zone (với filter, pagination)
- [ ] `GET /zones/:id` - Chi tiết zone
- [ ] `PATCH /zones/:id` - Cập nhật zone (owner only)
- [ ] `DELETE /zones/:id` - Xóa zone (owner only)

### 4.2 Zone Filters

- [ ] Filter theo game
- [ ] Filter theo rank level (min-max)
- [ ] Filter theo tags
- [ ] Filter theo status (OPEN/FULL/CLOSED)
- [ ] Search theo title/description
- [ ] Sort theo createdAt, requiredPlayers

### 4.3 Zone Tags

- [ ] `GET /zone-tags` - Danh sách tags
- [ ] `POST /zone-tags` - Tạo tag (Admin)
- [ ] Attach/detach tags khi tạo/sửa zone

### 4.4 Zone Contact Methods

- [ ] Thêm contact methods khi tạo zone
- [ ] Cập nhật contact methods

---

## Phase 5: Matching & Group (Week 6-8)

### 5.1 Join Requests

- [ ] `POST /zones/:id/join` - Gửi yêu cầu tham gia
- [ ] `GET /zones/:id/requests` - Danh sách requests (owner)
- [ ] `PATCH /zones/:id/requests/:requestId` - Approve/Reject
- [ ] `DELETE /zones/:id/join` - Hủy request (user)
- [ ] `GET /users/me/join-requests` - Requests của user

### 5.2 Group Formation

- [ ] Tự động tạo Group khi Zone đủ người
- [ ] `GET /groups` - Danh sách groups của user
- [ ] `GET /groups/:id` - Chi tiết group
- [ ] `POST /groups/:id/leave` - Rời group
- [ ] `DELETE /groups/:id` - Giải tán group (leader)

### 5.3 Group Members

- [ ] `GET /groups/:id/members` - Danh sách members
- [ ] `DELETE /groups/:id/members/:userId` - Kick member (leader)
- [ ] `PATCH /groups/:id/members/:userId` - Đổi role

---

## Phase 6: Real-time Chat (Week 8-10)

### 6.1 WebSocket Setup

- [ ] Setup Socket.io với NestJS Gateway
- [ ] JWT authentication cho WebSocket
- [ ] Room management (mỗi group = 1 room)

### 6.2 Chat Features

- [ ] `event: sendMessage` - Gửi tin nhắn
- [ ] `event: newMessage` - Nhận tin nhắn real-time
- [ ] `event: typing` - Đang nhập
- [ ] `event: joinRoom` - Join group room
- [ ] `event: leaveRoom` - Leave group room

### 6.3 Message History

- [ ] `GET /groups/:id/messages` - Lịch sử chat (pagination)
- [ ] `DELETE /messages/:id` - Xóa tin nhắn (sender only)

---

## Phase 7: Notifications (Week 10-11)

### 7.1 Notification System

- [ ] `GET /notifications` - Danh sách notifications
- [ ] `PATCH /notifications/:id/read` - Đánh dấu đã đọc
- [ ] `PATCH /notifications/read-all` - Đọc tất cả
- [ ] `DELETE /notifications/:id` - Xóa notification

### 7.2 Notification Types

- [ ] `JOIN_REQUEST` - Có người muốn join zone
- [ ] `REQUEST_APPROVED` - Request được chấp nhận
- [ ] `REQUEST_REJECTED` - Request bị từ chối
- [ ] `GROUP_FORMED` - Group được tạo
- [ ] `NEW_MESSAGE` - Tin nhắn mới (optional)
- [ ] `MEMBER_LEFT` - Thành viên rời group

### 7.3 Real-time Notifications

- [ ] Push notification qua WebSocket
- [ ] Badge count unread

---

## Phase 8: Report & Moderation (Week 11-12)

### 8.1 Report System

- [ ] `POST /reports` - Tạo report
- [ ] `GET /reports` - Danh sách reports (Admin)
- [ ] `PATCH /reports/:id` - Resolve report (Admin)

### 8.2 Moderation Actions

- [ ] Ban user
- [ ] Close zone
- [ ] Delete group
- [ ] View report history

---

## Phase 9: Testing & Optimization (Week 12-14)

### 9.1 Testing

- [ ] Unit tests cho services
- [ ] E2E tests cho API endpoints
- [ ] WebSocket tests

### 9.2 Performance

- [ ] Database indexing
- [ ] Query optimization
- [ ] Caching với Redis (optional)
- [x] Rate limiting (Global: 100 req/min, Auth: 5-10 req/min)

### 9.3 Security

- [x] Input validation (class-validator)
- [x] SQL injection prevention (Prisma handles)
- [ ] XSS prevention
- [ ] CORS configuration

---

## Phase 10: Deployment (Week 14-15)

### 10.1 Production Setup

- [ ] Production Dockerfile
- [ ] CI/CD pipeline
- [ ] Environment configuration
- [ ] Database migrations

### 10.2 Monitoring

- [ ] Logging (Winston/Pino)
- [ ] Health checks
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

---

## API Endpoints Summary

| Module            | Endpoints         |
| ----------------- | ----------------- |
| Auth              | 5                 |
| Users             | 4                 |
| Games             | 5                 |
| User Game Profile | 4                 |
| Zones             | 5                 |
| Zone Tags         | 2                 |
| Join Requests     | 5                 |
| Groups            | 5                 |
| Group Members     | 3                 |
| Messages          | 2                 |
| Notifications     | 4                 |
| Reports           | 3                 |
| **Total**         | **~47 endpoints** |

---

## Folder Structure

```
src/
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   └── dto/
├── prisma/
│   └── prisma.service.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   └── dto/
├── users/
├── games/
├── zones/
├── groups/
├── messages/
├── notifications/
├── reports/
└── gateways/
    └── chat.gateway.ts
```

---

## Priority Matrix

| Priority          | Features                                         |
| ----------------- | ------------------------------------------------ |
| P0 (Must have)    | Auth, Users, Games, Zones, Join Requests, Groups |
| P1 (Should have)  | Chat, Notifications                              |
| P2 (Nice to have) | Reports, Advanced filters, Caching               |

---

## Notes

- Mỗi Phase nên có PR riêng để dễ review
- Viết tests song song với code
- Document API với Swagger
- Commit thường xuyên, message rõ ràng
