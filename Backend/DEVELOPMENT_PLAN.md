# TeamZoneVN Backend - Development Plan

## Overview

TeamZoneVN là nền tảng tìm bạn chơi game, cho phép người dùng tạo Zone để tìm đồng đội, ghép nhóm và chat với nhau.

---

## Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Framework | NestJS                       |
| Database  | PostgreSQL                   |
| ORM       | Prisma                       |
| Auth      | JWT (Access + Refresh Token) + Google OAuth2 |
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

### 2.2 Google Auth ✅ COMPLETED

- [x] `POST /auth/google` - Đăng nhập bằng Google (Mobile — verify idToken)
- [x] `GET /auth/google/redirect` - Redirect đến Google OAuth2 (Web)
- [x] `GET /auth/google/callback` - Google OAuth2 callback (Web)
- [x] Schema: AuthProvider enum (LOCAL/GOOGLE), googleId field
- [x] Auto-link Google account nếu email đã tồn tại
- [x] Auto-generate username cho Google users mới

### 2.3 Password & Security

- [x] Hash password với bcrypt (12 salt rounds)
- [x] JWT strategy (Passport.js)
- [x] Rate limiting cho auth endpoints (5-10 req/min)
- [x] `POST /auth/forgot-password` - Quên mật khẩu (gửi email reset link, hiệu lực 15 phút)
- [x] `POST /auth/reset-password` - Đặt lại mật khẩu bằng token
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

## Phase 5: Matching & Group (Week 6-8) ✅ COMPLETED

### 5.1 Join Requests ✅ COMPLETED

- [x] `POST /zones/:id/join` - Gửi yêu cầu tham gia
- [x] `GET /zones/:id/requests` - Danh sách requests (owner)
- [x] `PATCH /zones/:id/requests/:requestId` - Approve/Reject
- [x] `DELETE /zones/:id/join` - Hủy request (user)
- [x] `GET /users/me/join-requests` - Requests của user (Incoming/Outgoing)

### 5.2 Group Formation ✅ COMPLETED

- [x] Tự động tạo Group khi Zone đủ người
- [x] `GET /groups` - Danh sách groups của user
- [x] `GET /groups/:id` - Chi tiết group
- [x] `POST /groups/:id/leave` - Rời group
- [x] `DELETE /groups/:id` - Giải tán group (leader)

### 5.3 Group Members ✅ COMPLETED

- [x] `GET /groups/:id/members` - Danh sách members
- [x] `DELETE /groups/:id/members/:userId` - Kick member (leader)
- [x] `PATCH /groups/:id/members/:userId` - Đổi role

### 5.4 Group Management (Admin) ✅ COMPLETED

> **Note:** Route sử dụng `/groups/admin` thay vì `/admin/groups` như plan ban đầu, giống pattern của Zone Admin.

- [x] `GET /groups/admin` - Danh sách tất cả groups (Admin)
- [x] `DELETE /groups/admin/:id` - Force delete/dissolve group (Admin)
- [x] `GET /groups/admin/:id/messages` - Xem messages của group (Admin)

---

## Phase 6: Real-time Chat (Week 8-10)

### 6.1 WebSocket Setup

- [x] Setup Socket.io với NestJS Gateway
- [x] JWT authentication cho WebSocket
- [x] Room management (mỗi group = 1 room)

### 6.2 Chat Features

- [x] `event: sendMessage` - Gửi tin nhắn
- [x] `event: newMessage` - Nhận tin nhắn real-time
- [x] `event: typing` - Đang nhập
- [x] `event: joinRoom` - Join group room
- [x] `event: leaveRoom` - Leave group room

### 6.3 Message History

- [x] `GET /groups/:id/messages` - Lịch sử chat (pagination)
- [x] `DELETE /messages/:id` - Xóa tin nhắn (sender only)

### 6.4 Message Moderation (Admin)

- [x] `GET /messages/admin` - Danh sách tất cả messages (Admin)
- [x] `DELETE /messages/admin/:id` - Force delete message (Admin)
- [ ] `GET /admin/messages/flagged` - Messages vi phạm (Auto-flagged, Admin)

### 6.5 Storage Optimization ✅ COMPLETED

- [x] `onDelete: Cascade` cho `GroupMember` → `Group` (xóa group → tự xóa members)
- [x] `onDelete: Cascade` cho `Message` → `Group` (xóa group → tự xóa messages)
- [x] `dissolveGroup()` và `adminForceDissolve()` → chuyển sang **hard delete** group
- [x] `deleteMessage()` và `adminDeleteMessage()` → chuyển sang **hard delete** message
- [x] Giới hạn content 2000 ký tự (`@db.VarChar(2000)` + gateway validation)
- [x] `MessagesCleanupService` — Cron job tự động xóa messages cũ hơn 30 ngày (mỗi ngày 3:00 AM)
- [x] `MessagesCleanupService` — Cron job xóa messages của group dissolved (mỗi ngày 3:05 AM)

---

## Phase 7: Notifications (Week 10-11) ✅ COMPLETED

### 7.1 Notification System

- [x] `GET /notifications` - Danh sách notifications (pagination: page, limit, response: items, total, unreadCount)
- [x] `PATCH /notifications/:id/read` - Đánh dấu 1 thông báo đã đọc
- [x] `PATCH /notifications/read-all` - Đánh dấu tất cả đã đọc
- [x] `DELETE /notifications/:id` - Xóa 1 notification (chỉ của chính user)

### 7.2 Notification Types

- [x] `JOIN_REQUEST` - Có người muốn join zone → gửi cho chủ zone
- [x] `REQUEST_APPROVED` - Request được chấp nhận → gửi cho người gửi request
- [x] `REQUEST_REJECTED` - Request bị từ chối → gửi cho người gửi request
- [x] `GROUP_FORMED` - Group được tạo → gửi cho tất cả members
- [ ] `NEW_MESSAGE` - Tin nhắn mới (bỏ qua Phase 7 — dễ spam, làm sau)
- [x] `MEMBER_LEFT` - Thành viên rời group / bị kick → gửi cho leader

### 7.3 Real-time Notifications

- [x] Push notification qua WebSocket — event `notification:new` tới room `user:${userId}`
- [x] Badge count unread — payload `{ notification, unreadCount }` khi emit
- [x] Client join `user:${userId}` khi gửi `joinRoom` với `groupId` (dùng chung handler)

### 7.4 Notification Storage Optimization

- [x] `NotificationsCleanupService` — Cron job tự động xóa notifications đã đọc & cũ hơn 90 ngày (mỗi ngày 3:10 AM)

---

## Phase 8: Report & Moderation (Week 11-12)

### 8.1 Report System

- [ ] `POST /reports` - Tạo report
- [ ] `GET /reports` - Danh sách reports (Admin)
- [ ] `PATCH /reports/:id` - Resolve report (Admin)

### 8.2 Moderation Actions

> **Note:** Các action đã có sẵn trong các phase trước.

- [x] Ban user — `PATCH /users/:id/ban` (Phase 2.4)
- [x] Close zone — `PATCH /zones/admin/:id/close` (Phase 4.5)
- [x] Delete group — `DELETE /groups/admin/:id` (Phase 5.4)
- [ ] View report history — `GET /reports` (Admin list)
- [ ] Report stats gộp trong `GET /dashboard/stats`

### 8.3 Dashboard Module (Admin Statistics)

> **Note:** Module `dashboard` riêng cho thống kê trang Admin. Route prefix: `/dashboard`. Query `?period=7d|30d` cho charts.

**Stats (Phase 8):**
- [ ] `GET /dashboard/stats` - Tổng quan dashboard (Admin)
  - Total users (active/banned)
  - Total zones (open/closed)
  - Total groups (active/dissolved)
  - Total reports (open/resolved)
  - New users today/this week
  - Active users today/this week

**Charts MVP (Phase 8):**
- [ ] `GET /dashboard/charts/users` - Tăng trưởng users theo ngày
- [ ] `GET /dashboard/charts/zones` - Zones theo game (phân bố)
- [ ] `GET /dashboard/charts/activity` - Hoạt động theo giờ

**Charts Production (Phase 10):**
- [ ] `GET /dashboard/charts/reports` - Xu hướng reports (open vs resolved)
- [ ] `GET /dashboard/charts/engagement` - Zones/Groups tạo mới theo ngày
- [ ] `GET /dashboard/charts/top-games` - Top games (zones, groups count)
- [ ] `GET /dashboard/charts/peak-hours` - Giờ cao điểm (zones, join requests)
- [ ] `GET /dashboard/charts/moderation` - Moderation workload (cần Report.resolvedAt)

---

## Phase 9: Social & Discovery (Week 12-14)

> **Mục đích:** Mở rộng trải nghiệm multi-user — Friend List, Zone Invite, Quick Match, Suggested Zones, Top User theo Like.

### 9.1 Friend List

- [ ] Schema: `Friendship` (userId, friendId, status: PENDING | ACCEPTED)
- [ ] `POST /friends/request/:userId` - Gửi lời mời kết bạn
- [ ] `PATCH /friends/request/:id` - Chấp nhận / Từ chối (Accept/Decline)
- [ ] `GET /friends` - Danh sách bạn bè (pagination)
- [ ] `GET /friends/requests` - Lời mời đang chờ (incoming)
- [ ] `DELETE /friends/:userId` - Hủy kết bạn / Hủy lời mời

### 9.2 Zone Invite (Mời bạn vào Zone)

- [ ] Schema: `ZoneInvite` (zoneId, inviterId, inviteeId, status: PENDING | ACCEPTED | DECLINED)
- [ ] `POST /zones/:id/invite` - Mời bạn bè vào zone (chọn từ friend list, owner only)
- [ ] `PATCH /zones/:id/invites/:inviteId` - Chấp nhận / Từ chối lời mời (invitee)
- [ ] `GET /users/me/zone-invites` - Danh sách lời mời zone đang chờ
- [ ] Notification type: `ZONE_INVITE` — gửi khi owner mời bạn vào zone
- [ ] Logic: Invitee chấp nhận → auto-approve join request (hoặc add trực tiếp nếu zone còn slot)

### 9.3 Quick Match (Ghép nhanh)

- [ ] Schema: `QuickMatchQueue` (userId, gameId, rankLevel, requiredPlayers, createdAt) — hoặc dùng Redis
- [ ] `POST /quick-match` - Vào hàng đợi (gameId, rankLevel, requiredPlayers)
- [ ] `DELETE /quick-match` - Rời hàng đợi
- [ ] Logic match: Ghép users cùng game, rank tương thích (Silver–Gold–Plat), đủ requiredPlayers
- [ ] Khi match: Tự động tạo Zone + Group, gửi notification cho tất cả
- [ ] Timeout: Sau X phút (config) chưa match → thông báo, cho phép retry

### 9.4 Suggested Zones (Gợi ý Zone)

- [ ] `GET /zones/suggested` - Danh sách zone gợi ý cho user hiện tại
- [ ] Logic gợi ý: Theo game (UserGameProfile), rank tương thích, zone mới, tags phổ biến
- [ ] Loại trừ: Zone user đã join/reject, zone FULL/CLOSED
- [ ] Có thể merge vào `GET /zones` với query `?suggested=true` hoặc endpoint riêng

### 9.5 Top User (User Like / Leaderboard)

- [ ] Schema: `UserLike` (userId, likerId) — userId = người được like, likerId = người like (unique)
- [ ] `POST /users/:id/like` - Like user (1 user chỉ like 1 user 1 lần)
- [ ] `DELETE /users/:id/like` - Bỏ like
- [ ] `GET /leaderboard/users` - Top user theo số like (query: ?period=week|month|all, ?gameId=)
- [ ] `GET /users/:id` - Bổ sung field `likeCount`, `isLikedByMe` (nếu có auth)

---

## Phase 10: Testing & Optimization (Week 14-16)

### 10.0 Dashboard Charts Production (bổ sung Phase 8)

- [ ] `GET /dashboard/charts/reports` - Xu hướng reports
- [ ] `GET /dashboard/charts/engagement` - Engagement (zones, groups theo ngày)
- [ ] `GET /dashboard/charts/top-games` - Top games
- [ ] `GET /dashboard/charts/peak-hours` - Peak hours
- [ ] `GET /dashboard/charts/moderation` - Moderation workload

### 10.1 Testing

- [ ] Unit tests cho services
- [ ] E2E tests cho API endpoints
- [ ] WebSocket tests

### 10.2 Performance

- [x] Database indexing (Zone: title, ownerId, gameId, status, createdAt)
- [x] Query optimization ($transaction cho create/update, total count cho pagination)
- [x] **Message retention policy**: Auto-purge messages > 30 ngày (Cron 3:00 AM)
- [x] **Notification cleanup**: Auto-purge notifications đã đọc > 90 ngày (Cron 3:10 AM)
- [x] **Hard delete**: messages và groups xóa thật, không soft delete → tiết kiệm storage
- [x] **Cascade delete**: Zone → Group → GroupMember + Message (tự dọn khi giải tán)
- [x] **Content limit**: Message giới hạn 2000 ký tự (VarChar + gateway validation)
- [ ] Caching với Redis (Đã dời sang Phase 11)
- [x] Rate limiting (Global: 100 req/min, Auth: 5-10 req/min)

### 10.3 Security

- [x] Input validation (class-validator)
- [x] SQL injection prevention (Prisma handles)
- [ ] XSS prevention
- [ ] CORS configuration

---

## Phase 11: Deployment (Week 16-17)

### 11.1 Production Setup

- [ ] Production Dockerfile
- [ ] CI/CD pipeline
- [ ] Environment configuration
- [ ] Database migrations

### 11.2 Monitoring

- [ ] Logging (Winston/Pino)
- [ ] Health checks
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

---

## Phase 12: Scaling & Redis Integration (Future)

*(Thực hiện khi hệ thống đạt khoảng 5,000 - 10,000 Active Users)*

### 12.1 Setup & Infrastructure
- [ ] Setup Redis server (Docker hoặc Managed Service)
- [ ] Tích hợp `ioredis` và `@nestjs/cache-manager` vào NestJS

### 12.2 Performance Caching
- [ ] Cache danh sách tĩnh ít thay đổi (Games, Tags) để giảm tải truy vấn DB.
- [ ] Cấu hình cơ chế Cache Invalidation khi Admin cập nhật Games/Tags.
- [ ] Cache Public Profile của User.

### 12.3 Real-time & Socket Optimization
- [ ] Tích hợp Redis Adapter cho Socket.IO để hỗ trợ scale đa server (Load Balancing).
- [ ] Lưu trạng thái Online/Offline (Presence) của User trên Redis.
- [ ] [Optional] Dùng Redis Pub/Sub hoặc Queue để xử lý lượng tin nhắn lớn.

### 12.4 Security & Session
- [ ] Lưu trữ và quản lý Rate Limiting (`ThrottlerModule`) tập trung bằng Redis.
- [ ] Lưu trữ ngắn hạn OTP / mã xác nhận cấp lại mật khẩu kèm cơ chế TTL tự hủy.

---

## API Endpoints Summary

| Module                 | Endpoints         |
| ---------------------- | ----------------- |
| Auth                   | 10 (incl. Google + forgot/reset password) |
| Users                  | 4                 |
| **Admin - Users**      | **6**             |
| Games                  | 5                 |
| User Game Profile      | 4                 |
| Zones                  | 5                 |
| Zone Tags (`/tags`)    | 4                 |
| **Admin - Zones**      | **3**             |
| Join Requests          | 5                 |
| Groups                 | 5                 |
| **Admin - Groups**     | **3**             |
| Group Members          | 3                 |
| Messages               | 2                 |
| **Admin - Messages**   | **3**             |
| Notifications          | 4                 |
| Reports                | 3                 |
| **Dashboard**          | **9** (1 stats + 8 charts, Admin) |
| **Friends (Phase 9)**  | **6**             |
| **Zone Invites (Phase 9)** | **4**         |
| **Quick Match (Phase 9)** | **3**          |
| **Suggested Zones (Phase 9)** | **1**      |
| **Leaderboard (Phase 9)** | **4**          |
| **Total**              | **~95 endpoints** |

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
├── dashboard/          ← Module riêng cho thống kê Admin
├── friends/            ← Phase 9: Friend List
├── zone-invites/       ← Phase 9: Zone Invite (có thể gộp vào zones/)
├── quick-match/        ← Phase 9: Quick Match
└── gateways/
    └── chat.gateway.ts
```

---

## Priority Matrix

| Priority          | Features                                                        |
| ----------------- | --------------------------------------------------------------- |
| P0 (Must have)    | Auth, Users, Games, Zones, Join Requests, Groups                |
| P1 (Should have)  | Chat, Notifications, **Admin User Management, Admin Dashboard** |
| P2 (Nice to have) | Reports, Advanced filters, Caching                             |
| P3 (Phase 9)      | **Friend List**, **Zone Invite**, **Quick Match**, **Suggested Zones**, **Top User (Like)** |

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

- ✅ View all groups — `GET /groups/admin`
- ✅ Force dissolve groups — `DELETE /groups/admin/:id`
- ✅ View group messages — `GET /groups/admin/:id/messages`

### Message Moderation (Phase 6.4)

- View reported messages
- Force delete messages
- View auto-flagged content

### Dashboard (Phase 8.3 + 10.0)

- Module riêng: `dashboard/`
- `GET /dashboard/stats` — Tổng quan (users, zones, groups, reports)
- **Charts MVP:** users, zones, activity
- **Charts Production:** reports, engagement, top-games, peak-hours, moderation

---

## Notes

- Mỗi Phase nên có PR riêng để dễ review
- Viết tests song song với code
- Document API với Swagger
- Commit thường xuyên, message rõ ràng

---

## Known Issues & Performance TODOs

| #   | Vấn đề                                                                                                     | File                | Mức độ      | Trạng thái      |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------- | ----------- | --------------- |
| 1   | `create` và `update` zone không dùng `$transaction` — partial data nếu tag/contact creation fail           | `zones.service.ts`  | 🔴 Critical | ✅ Đã sửa       |
| 2   | `findAllByUser` thiếu `total` count — frontend pagination không có `totalPages`                            | `zones.service.ts`  | 🟡 Medium   | ✅ Đã sửa       |
| 3   | Không có DB indexes trên `title`, `ownerId`, `gameId`, `status`, `createdAt`                               | `schema.prisma`     | 🟡 Medium   | ✅ Đã sửa       |
| 4   | Không có `onDelete: Cascade` trên relations — zone delete sẽ fail nếu có tag/contact/joinRequest liên quan | `schema.prisma`     | 🔴 Critical | ✅ Đã sửa       |
| 5   | `CreateTagDto` thiếu validation (`@IsString`, `@IsNotEmpty`)                                               | `create-tag.dto.ts` | 🟡 Medium   | ✅ Đã sửa       |
| 6   | `TagsService.getAllTags` throw Error khi không có tags — nên return `[]`                                   | `tags.service.ts`   | 🟠 Low      | ✅ Đã sửa       |
| 7   | Duplicate methods: `findAllByAdmin` và `findAllForAdmin` gần giống nhau                                    | `zones.service.ts`  | 🟠 Low      | ✅ Đã xóa trùng |
