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

### 2.4 User Management (Admin) ✅ COMPLETED

- [x] `GET /users` - Danh sách tất cả users (Admin, pagination)
- [x] `GET /users/search` - Tìm kiếm users theo email/username (Admin)
- [x] `PATCH /users/:id/ban` - Ban user (Admin)
- [x] `PATCH /users/:id/unban` - Unban user (Admin)
- [x] `GET /users/:id/activities` - Xem lịch sử hoạt động user (Admin)
- [x] `DELETE /users/:id` - Xóa user (Admin, soft delete)

---

## Phase 3: Game & User Game Profile (Week 3-4)

### 3.1 Game Module (Admin) ✅ COMPLETED

- [x] `GET /games/mobile` - Danh sách game cho user
- [x] `GET /games/admin` - Danh sách game cho admin
- [x] `GET /games/:id` - Chi tiết game
- [x] `POST /games` - Thêm game (Admin)
- [x] `PATCH /games/:id` - Cập nhật game (Admin)
- [x] `DELETE /games/:id` - Xóa game (Admin)

### 3.2 User Game Profile ✅ COMPLETED

- [x] `GET /user-game-profiles/me` - Danh sách game của user hiện tại
- [x] `GET /user-game-profiles/:id` - Chi tiết game profile
- [x] `POST /user-game-profiles` - Thêm game profile mới
- [x] `PATCH /user-game-profiles/:id` - Cập nhật rank level
- [x] `DELETE /user-game-profiles/:id` - Xóa game profile

---

## Phase 4: Zone - Tìm Bạn (Week 4-6) ✅ COMPLETED

### 4.1 Zone CRUD ✅ COMPLETED

- [x] `POST /zones` - Tạo zone mới (tối đa 4 zone)
- [x] `GET /zones` - Danh sách zone công khai (pagination)
- [x] `GET /zones/search` - Tìm kiếm zone với filters và sorting
- [x] `GET /zones/my` - Danh sách zone của chính mình
- [x] `GET /zones/:id/public` - Chi tiết zone (công khai)
- [x] `GET /zones/:id/owner` - Chi tiết zone (cho chủ sở hữu, xem requests)
- [x] `PATCH /zones/:id` - Cập nhật zone (owner only)
- [x] `DELETE /zones/:id` - Xóa zone (owner only)

### 4.2 Zone Filters ✅ COMPLETED

- [x] Filter theo game (tên, ID)
- [x] Filter theo rank level (min-max logic validation)
- [x] Filter theo tags
- [x] Filter theo status (OPEN/FULL/CLOSED)
- [x] Search theo title/description/username (Search API)
- [x] Sort theo newest, oldest, players count

### 4.3 Zone Tags ✅ COMPLETED

> **Note:** Route sử dụng `/tags` thay vì `/zone-tags` như plan ban đầu.

- [x] `GET /tags` - Danh sách tags (Public)
- [x] `POST /tags` - Tạo tag (Admin)
- [x] `PATCH /tags/:id` - Cập nhật tag (Admin)
- [x] `DELETE /tags/:id` - Xóa tag (Admin)

### 4.4 Zone Contact Methods ✅ COMPLETED

- [x] Thêm contact methods khi tạo zone (POST /zones - field `contacts`)
- [x] Cập nhật contact methods (PATCH /zones/:id - field `contacts`, delete-recreate strategy)

### 4.5 Zone Management (Admin) ✅ COMPLETED

> **Note:** List endpoint sử dụng `GET /zones/admin` thay vì `GET /admin/zones`.

- [x] `GET /zones/admin` - Danh sách tất cả zones (Admin, bypass ownership, pagination)
- [x] `DELETE /zones/admin/:id` - Force delete zone (Admin)
- [x] `PATCH /zones/admin/:id/close` - Force close zone (Admin)

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

### 5.4 Group Management (Admin)

- [ ] `GET /admin/groups` - Danh sách tất cả groups (Admin)
- [ ] `DELETE /admin/groups/:id` - Force delete/dissolve group (Admin)
- [ ] `GET /admin/groups/:id/messages` - Xem messages của group (Admin)

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

### 6.4 Message Moderation (Admin)

- [ ] `GET /admin/messages` - Danh sách messages được report (Admin)
- [ ] `DELETE /admin/messages/:id` - Force delete message (Admin)
- [ ] `GET /admin/messages/flagged` - Messages vi phạm (Auto-flagged, Admin)

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

- [ ] Ban user (linked to 2.4)
- [ ] Close zone (linked to 4.5)
- [ ] Delete group (linked to 5.4)
- [ ] View report history
- [ ] `GET /admin/reports/stats` - Thống kê reports (Admin)

### 8.3 Admin Dashboard Statistics

- [ ] `GET /admin/dashboard/stats` - Tổng quan dashboard (Admin)
  - Total users (active/banned)
  - Total zones (open/closed)
  - Total groups (active/dissolved)
  - Total reports (open/resolved)
  - New users today/this week
  - Active users today/this week
- [ ] `GET /admin/dashboard/charts/users` - Biểu đồ tăng trưởng users (Admin)
- [ ] `GET /admin/dashboard/charts/zones` - Biểu đồ zones theo game (Admin)
- [ ] `GET /admin/dashboard/charts/activity` - Biểu đồ hoạt động theo giờ (Admin)

### 8.4 Audit Logs (Admin)

- [ ] `GET /admin/audit-logs` - Lịch sử admin actions (Admin)
- [ ] `POST /admin/audit-logs` - Tự động log mỗi admin action
- [ ] Log actions: BAN_USER, UNBAN_USER, DELETE_ZONE, DELETE_GROUP, RESOLVE_REPORT

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

| Module                 | Endpoints           |
| ---------------------- | ------------------- |
| Auth                   | 5                   |
| Users                  | 4                   |
| **Admin - Users**      | **6**               |
| Games                  | 5                   |
| User Game Profile      | 4                   |
| Zones                  | 5                   |
| Zone Tags (`/tags`)    | 4                   |
| **Admin - Zones**      | **3**               |
| Join Requests          | 5                   |
| Groups                 | 5                   |
| **Admin - Groups**     | **3**               |
| Group Members          | 3                   |
| Messages               | 2                   |
| **Admin - Messages**   | **3**               |
| Notifications          | 4                   |
| Reports                | 3                   |
| **Admin - Reports**    | **1**               |
| **Admin - Dashboard**  | **4**               |
| **Admin - Audit Logs** | **2**               |
| **Total**              | **~71 endpoints**   |

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

| Priority          | Features                                                        |
| ----------------- | --------------------------------------------------------------- |
| P0 (Must have)    | Auth, Users, Games, Zones, Join Requests, Groups                |
| P1 (Should have)  | Chat, Notifications, **Admin User Management, Admin Dashboard** |
| P2 (Nice to have) | Reports, Advanced filters, Caching, **Admin Audit Logs**        |

---

## Admin Endpoints Summary

### User Management (Phase 2.4)

- List/Search all users
- Ban/Unban users
- View user activities
- Soft delete users

### Zone Management (Phase 4.5)

- ✅ View all zones (bypass ownership) — `GET /zones/admin`
- ✅ Force delete zones — `DELETE /zones/admin/:id`
- ✅ Force close zones — `PATCH /zones/admin/:id/close`


### Group Management (Phase 5.4)

- View all groups
- Force dissolve groups
- View group messages

### Message Moderation (Phase 6.4)

- View reported messages
- Force delete messages
- View auto-flagged content

### Dashboard & Analytics (Phase 8.3)

- Real-time statistics
- User growth charts
- Zone distribution by game
- Activity heatmaps

### Audit Logs (Phase 8.4)

- Track all admin actions
- Filter by admin/action type
- Export audit trail

---

## Notes

- Mỗi Phase nên có PR riêng để dễ review
- Viết tests song song với code
- Document API với Swagger
- Commit thường xuyên, message rõ ràng

---

## Known Issues & Performance TODOs

| #   | Vấn đề                                                                                                     | File                | Mức độ      |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------- | ----------- |
| 1   | `create` và `update` zone không dùng `$transaction` — partial data nếu tag/contact creation fail           | `zones.service.ts`  | 🔴 Critical |
| 2   | `findAllByUser` thiếu `total` count — frontend pagination không có `totalPages`                            | `zones.service.ts`  | 🟡 Medium   |
| 3   | Không có DB indexes trên `title`, `description` — search `contains` + `insensitive` gây full table scan    | `schema.prisma`     | 🟡 Medium   |
| 4   | Không có `onDelete: Cascade` trên relations — zone delete sẽ fail nếu có tag/contact/joinRequest liên quan | `schema.prisma`     | 🔴 Critical |
| 5   | `CreateTagDto` thiếu validation (`@IsString`, `@IsNotEmpty`)                                               | `create-tag.dto.ts` | 🟡 Medium   |
| 6   | `TagsService.getAllTags` throw Error khi không có tags — nên return `[]`                                   | `tags.service.ts`   | 🟠 Low      |
| 7   | Duplicate methods: `findAllByAdmin` (line 108) và `findAllForAdmin` (line 429) gần giống nhau              | `zones.service.ts`  | 🟠 Low      |
