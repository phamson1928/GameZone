# TeamZoneVN API Endpoints Documentation

## Base URL

```
http://localhost:3000
```

## Swagger Documentation

To view the live API documentation and test endpoints, visit:
[http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Authentication

Hầu hết các endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer <access_token>
```

---

## 1. Health Check

### GET `/`

Kiểm tra API hoạt động.

**Auth Required:** No

```bash
curl -s http://localhost:3000/
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "TeamZoneVN API is running",
    "timestamp": "2026-01-31T17:13:29.347Z"
  },
  "timestamp": "2026-01-31T17:13:29.347Z"
}
```

### GET `/health`

Health check endpoint.

**Auth Required:** No

```bash
curl -s http://localhost:3000/health
```

**Response:** Same as above

---

## 2. Authentication

### POST `/auth/register`

Đăng ký tài khoản mới.

**Auth Required:** No

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "username": "testuser"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email hợp lệ |
| password | string | Yes | Mật khẩu (min 8 ký tự) |
| username | string | Yes | Tên người dùng |

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "email": "test@example.com",
    "username": "testuser",
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2026-01-31T17:13:34.725Z"
}
```

---

### POST `/auth/login`

Đăng nhập.

**Auth Required:** No

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email đã đăng ký |
| password | string | Yes | Mật khẩu |

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "email": "test@example.com",
    "username": "testuser",
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2026-01-31T17:13:35.407Z"
}
```

---

### POST `/auth/google`

Đăng nhập bằng Google (Mobile) — gửi idToken từ Google Sign-In SDK.

**Auth Required:** No

```bash
curl -s -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| idToken | string | Yes | Google ID Token từ client SDK |

**Response (Success):**

```json
{
  "success": true,
  "data": {
    "userId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "email": "user@gmail.com",
    "username": "user_auto_generated",
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "timestamp": "2026-02-12T13:22:58.593Z"
}
```

**Error Response (401 - Invalid Token):**

```json
{
  "success": false,
  "message": "Invalid Google token",
  "errorCode": "UNAUTHORIZED",
  "statusCode": 401
}
```

**Behavior:**
- Nếu user đã có tài khoản với Google ID → đăng nhập bình thường
- Nếu user đã có email nhưng chưa liên kết Google → tự động liên kết Google ID
- Nếu user mới hoàn toàn → tạo tài khoản mới (username tự sinh từ email/display name)

---

### GET `/auth/google/redirect`

Đăng nhập bằng Google (Web) — redirect đến Google OAuth2 consent screen.

**Auth Required:** No

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/google/redirect
# Returns 302 redirect to https://accounts.google.com/o/oauth2/v2/auth?...
```

**Response:** `302 Redirect` → Google OAuth2 consent screen

---

### GET `/auth/google/callback`

Google OAuth2 callback — nhận authorization code từ Google, exchange lấy tokens, redirect về frontend với JWT tokens.

**Auth Required:** No (called by Google OAuth2)

**Flow:**
1. Google gọi endpoint này với `?code=...`
2. Backend exchange code → lấy Google profile
3. Tìm/tạo user (logic giống `POST /auth/google`)
4. Redirect về `FRONTEND_URL/auth/callback?accessToken=...&refreshToken=...&userId=...`

**Environment Variables cần thiết:**
| Variable | Description |
|----------|-------------|
| GOOGLE_CLIENT_ID | Google OAuth Client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret |
| GOOGLE_CALLBACK_URL | `http://localhost:3000/auth/google/callback` |
| FRONTEND_URL | Frontend URL (default: `http://localhost:3001`) |

---

### POST `/auth/refresh`

Làm mới access token.

**Auth Required:** No

```bash
curl -s -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Refresh token từ login/register |

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-01-31T17:15:24.495Z"
}
```

---

### POST `/auth/logout`

Đăng xuất (revoke refresh token).

**Auth Required:** Yes

```bash
curl -s -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Refresh token cần revoke |

**Response:** Empty (200 OK)

---

### POST `/auth/forgot-password`

Quên mật khẩu — gửi email chứa link đặt lại mật khẩu.

**Auth Required:** No

**Rate Limit:** 5 requests/phút

> ⚠️ **Security Note:** Endpoint luôn trả về `200 OK` dù email có tồn tại hay không, để tránh **email enumeration attack**. Chỉ tài khoản LOCAL (đăng ký bằng email/password) mới nhận được email — tài khoản Google-only sẽ bị bỏ qua silently.

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/auth/forgot-password" `
  -ContentType "application/json" `
  -Body '{"email": "user@example.com"}'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email đã đăng ký tài khoản |

**Response (200 OK — luôn trả về response này):**

```json
{
  "success": true,
  "data": {
    "message": "If an account with this email exists, a password reset link has been sent."
  },
  "timestamp": "2026-02-24T12:30:26.343Z"
}
```

**Error Responses:**

**400 - Email không đúng định dạng:**

```json
{
  "success": false,
  "message": ["Invalid email format"],
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

**429 - Too Many Requests (rate limit):**

```json
{
  "success": false,
  "message": "ThrottlerException: Too Many Requests",
  "errorCode": "TOO_MANY_REQUESTS",
  "statusCode": 429
}
```

**Flow chi tiết:**
1. User nhập email → `POST /auth/forgot-password`
2. Backend tìm user theo email (không tìm thấy → trả về generic message)
3. Invalidate tất cả token reset cũ chưa dùng của user
4. Tạo **secure random token** (32 bytes hex via `crypto.randomBytes`)
5. Lưu **SHA-256 hash** của token vào DB (bảo mật — raw token không bao giờ lưu DB)
6. Gửi email chứa link: `FRONTEND_URL/auth/reset-password?token=<raw_token>`
7. Token hết hạn sau **15 phút**

**Environment Variables cần thiết:**
| Variable | Description | Example |
|----------|-------------|---------|
| MAIL_HOST | SMTP server host | `smtp.gmail.com` |
| MAIL_PORT | SMTP port | `587` |
| MAIL_USER | SMTP username/email | `noreply@teamzonevn.com` |
| MAIL_PASS | SMTP password / App Password | `your_app_password` |
| MAIL_FROM | Sender name + email | `"TeamZoneVN" <noreply@teamzonevn.com>` |
| FRONTEND_URL | Frontend URL dùng để build reset link | `http://localhost:3001` |

---

### POST `/auth/reset-password`

Đặt lại mật khẩu bằng token nhận từ email.

**Auth Required:** No

**Rate Limit:** 10 requests/phút

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/auth/reset-password" `
  -ContentType "application/json" `
  -Body '{"token": "<token_from_email>", "newPassword": "NewPassword123"}'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Token nhận từ link trong email |
| newPassword | string | Yes | Mật khẩu mới (min 6, max 100 ký tự) |

**Response (200 OK — thành công):**

```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully. Please log in with your new password."
  },
  "timestamp": "2026-02-24T12:35:10.123Z"
}
```

**Error Responses:**

**404 - Token không tồn tại:**

```json
{
  "success": false,
  "message": "Invalid or expired reset token",
  "errorCode": "NOT_FOUND",
  "statusCode": 404
}
```

**400 - Token đã được dùng:**

```json
{
  "success": false,
  "message": "This reset token has already been used",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

**400 - Token đã hết hạn (quá 15 phút):**

```json
{
  "success": false,
  "message": "Reset token has expired. Please request a new one.",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

**400 - Mật khẩu không đủ yêu cầu:**

```json
{
  "success": false,
  "message": ["Password must be at least 6 characters"],
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

**Security behaviors:**
- Token chỉ được sử dụng **1 lần** (đánh dấu `used = true` ngay sau khi dùng)
- DB chỉ lưu **SHA-256 hash** của token, không lưu raw token
- Sau khi reset thành công: **tất cả refresh tokens bị revoke** (đăng xuất tất cả thiết bị)
- Toàn bộ quá trình update password + mark used + revoke tokens thực hiện trong **1 DB transaction**

---

## 3. Users


### GET `/users/me`

Lấy thông tin user hiện tại.

**Auth Required:** Yes

```bash
curl -s http://localhost:3000/users/me \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "email": "test@example.com",
    "username": "testuser",
    "avatarUrl": null,
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-01-31T17:13:34.708Z",
    "profile": {
      "bio": null,
      "playStyle": null,
      "timezone": null,
      "lastActiveAt": null
    }
  },
  "timestamp": "2026-01-31T17:13:41.921Z"
}
```

---

### PATCH `/users/me`

Cập nhật profile user hiện tại.

**Auth Required:** Yes

```bash
curl -s -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Pro gamer since 2020",
    "playStyle": "Aggressive",
    "timezone": "Asia/Ho_Chi_Minh"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bio | string | No | Giới thiệu bản thân |
| playStyle | string | No | Phong cách chơi |
| timezone | string | No | Múi giờ |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "email": "test@example.com",
    "username": "testuser",
    "avatarUrl": null,
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-01-31T17:13:34.708Z",
    "profile": {
      "bio": "Pro gamer since 2020",
      "playStyle": "Aggressive",
      "timezone": "Asia/Ho_Chi_Minh",
      "lastActiveAt": "2026-01-31T17:13:41.919Z"
    }
  },
  "timestamp": "2026-01-31T17:15:18.693Z"
}
```

---

### PATCH `/users/me/avatar`

Cập nhật avatar của user hiện tại.

**Auth Required:** Yes

```bash
curl -s -X PATCH http://localhost:3000/users/me/avatar \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "avatarUrl": "https://example.com/avatar.jpg"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| avatarUrl | string | Yes | URL của avatar mới |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "email": "test@example.com",
    "username": "testuser",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-01-31T17:13:34.708Z",
    "profile": {
      "bio": "Pro gamer since 2020",
      "playStyle": "Aggressive",
      "timezone": "Asia/Ho_Chi_Minh",
      "lastActiveAt": "2026-01-31T17:13:41.919Z"
    }
  },
  "timestamp": "2026-01-31T17:15:18.693Z"
}
```

---

### GET `/users/:id`

Lấy thông tin public profile của user khác.

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | User ID cần xem |

```bash
curl -s http://localhost:3000/users/9e0a44d5-65a0-4ee4-810f-ed6a77db6e53 \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "username": "testuser",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-01-31T17:13:34.708Z",
    "profile": {
      "bio": "Pro gamer since 2020",
      "playStyle": "Aggressive",
      "timezone": "Asia/Ho_Chi_Minh",
      "lastActiveAt": "2026-01-31T17:13:41.919Z"
    }
  },
  "timestamp": "2026-01-31T17:13:41.921Z"
}
```

---

## 4. User Management (Admin)

### GET `/users`

Lấy danh sách tất cả users (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 20 | Số users/trang (max 100) |

```bash
curl -s "http://localhost:3000/users?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "data": [
    {
      "id": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
      "email": "test@example.com",
      "username": "testuser",
      "avatarUrl": null,
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-01-31T17:13:34.708Z",
      "profile": {
        "bio": "Pro gamer since 2020",
        "playStyle": "Aggressive",
        "timezone": "Asia/Ho_Chi_Minh",
        "lastActiveAt": "2026-02-03T08:30:00.000Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### GET `/users/search`

Tìm kiếm users theo email/username với filters (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| query | string | No | Tìm kiếm trong email và username (case-insensitive) |
| role | enum | No | Filter theo role: ADMIN, USER |
| status | enum | No | Filter theo status: ACTIVE, BANNED |
| page | number | No | Trang hiện tại (default: 1) |
| limit | number | No | Số users/trang (default: 20, max: 100) |

```bash
curl -s "http://localhost:3000/users/search?query=john&role=USER&status=ACTIVE&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "data": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "username": "john_doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "profile": {
        "bio": "Casual gamer",
        "playStyle": "Defensive",
        "timezone": "America/New_York",
        "lastActiveAt": "2026-02-03T07:00:00.000Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET `/users/:id/activities`

Xem lịch sử hoạt động của user (Admin only).

**Auth Required:** Yes (Admin)

```bash
curl -s http://localhost:3000/users/9e0a44d5-65a0-4ee4-810f-ed6a77db6e53/activities \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
[
  {
    "type": "ZONE_CREATED",
    "description": "Created zone: Looking for Valorant teammates",
    "createdAt": "2026-02-03T08:30:00.000Z",
    "relatedId": "zone-uuid",
    "relatedType": "zone"
  },
  {
    "type": "JOIN_REQUEST_APPROVED",
    "description": "Join request for \"CS:GO 5v5\" - APPROVED",
    "createdAt": "2026-02-02T15:20:00.000Z",
    "relatedId": "request-uuid",
    "relatedType": "join_request"
  },
  {
    "type": "GROUP_JOINED",
    "description": "Joined group for zone: Diamond rank squad",
    "createdAt": "2026-02-01T12:00:00.000Z",
    "relatedId": "group-uuid",
    "relatedType": "group"
  }
]
```

**Activity Types:**

- `ZONE_CREATED` - User tạo zone mới
- `JOIN_REQUEST_PENDING` - Gửi yêu cầu join zone
- `JOIN_REQUEST_APPROVED` - Request được chấp nhận
- `JOIN_REQUEST_REJECTED` - Request bị từ chối
- `GROUP_JOINED` - Join vào group

---

### PATCH `/users/:id/ban`

Ban một user (Admin only).

**Auth Required:** Yes (Admin)

```bash
curl -s -X PATCH http://localhost:3000/users/user-uuid/ban \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "success": true,
  "message": "User has been banned successfully",
  "data": {
    "id": "user-uuid",
    "username": "banned_user",
    "avatarUrl": "https://example.com/avatar.jpg",
    "profile": {
      "bio": "Former user",
      "playStyle": "Aggressive",
      "timezone": "Asia/Ho_Chi_Minh",
      "lastActiveAt": "2026-02-03T08:00:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 - Self Ban:**

```json
{
  "success": false,
  "message": "You cannot ban yourself",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

**400 - Already Banned:**

```json
{
  "success": false,
  "message": "User is already banned",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

---

### PATCH `/users/:id/unban`

Unban một user (Admin only).

**Auth Required:** Yes (Admin)

```bash
curl -s -X PATCH http://localhost:3000/users/user-uuid/unban \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "success": true,
  "message": "User has been unbanned successfully",
  "data": {
    "id": "user-uuid",
    "username": "unbanned_user",
    "avatarUrl": "https://example.com/avatar.jpg",
    "profile": {
      "bio": "Back in action",
      "playStyle": "Balanced",
      "timezone": "Asia/Ho_Chi_Minh",
      "lastActiveAt": "2026-02-03T09:00:00.000Z"
    }
  }
}
```

**Error Response (400 - Not Banned):**

```json
{
  "success": false,
  "message": "User is not banned",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

---

### PATCH `/users/:id/delete`

Xóa user (Admin only - Soft delete).

**Auth Required:** Yes (Admin)

**Note:** Đây là soft delete - user sẽ được đánh dấu BANNED và email/username được scramble để prevent reuse.

```bash
curl -s -X PATCH http://localhost:3000/users/user-uuid/delete \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "success": true,
  "message": "User has been deleted successfully",
  "data": {
    "id": "user-uuid"
  }
}
```

**Error Response (400 - Self Delete):**

```json
{
  "success": false,
  "message": "You cannot delete yourself",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

**What happens on delete:**

- User status → `BANNED`
- Email → `deleted_<userId>@deleted.com`
- Username → `deleted_<userId>`
- Data preserved for audit trail
- Email/username cannot be reused

---

## 5. Games

### POST `/games`

Tạo game mới (Admin only).

**Auth Required:** Yes (Admin)

```bash
curl -s -X POST http://localhost:3000/games \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "League of Legends",
    "iconUrl": "https://example.com/lol.png",
    "bannerUrl": "https://example.com/lol-banner.png"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Tên game |
| iconUrl | string | Yes | URL icon game |
| bannerUrl | string | Yes | URL banner game |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "name": "League of Legends",
    "iconUrl": "https://example.com/lol.png",
    "bannerUrl": "https://example.com/lol-banner.png",
    "isActive": true,
    "createdAt": "2026-01-31T17:14:07.742Z"
  },
  "timestamp": "2026-01-31T17:14:07.746Z"
}
```

**Error Response (User không phải Admin):**

```json
{
  "success": false,
  "message": "Access denied: Required role(s): ADMIN",
  "errorCode": "FORBIDDEN",
  "statusCode": 403,
  "timestamp": "2026-01-31T17:13:44.918Z",
  "path": "/games"
}
```

---

### GET `/games/mobile`

Lấy danh sách games cho user (public).

**Auth Required:** No

```bash
curl -s http://localhost:3000/games/mobile
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
      "name": "League of Legends",
      "iconUrl": "https://example.com/lol.png",
      "bannerUrl": "https://example.com/lol-banner.png",
      "_count": {
        "zones": 0
      }
    }
  ],
  "timestamp": "2026-01-31T17:26:04.427Z"
}
```

---

### GET `/games/admin`

Lấy danh sách games cho admin.

**Auth Required:** Yes (Admin)

```bash
curl -s http://localhost:3000/games/admin \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
      "name": "League of Legends",
      "isActive": true,
      "createdAt": "2026-01-31T17:14:07.742Z",
      "_count": {
        "groups": 0
      }
    }
  ],
  "timestamp": "2026-01-31T17:26:06.496Z"
}
```

---

### GET `/games/:id`

Lấy chi tiết game theo ID.

**Auth Required:** No

```bash
curl -s http://localhost:3000/games/472515e6-f4be-4c35-88bb-a8fb3a52680a
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "name": "League of Legends",
    "iconUrl": "https://example.com/lol.png",
    "bannerUrl": "https://example.com/lol-banner.png",
    "isActive": true,
    "createdAt": "2026-01-31T17:14:07.742Z",
    "zones": []
  },
  "timestamp": "2026-01-31T17:15:15.579Z"
}
```

---

## 6. User Game Profiles

### POST `/user-game-profiles`

Thêm game profile cho user hiện tại.

**Auth Required:** Yes

```bash
curl -s -X POST http://localhost:3000/user-game-profiles \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "rankLevel": "ADVANCED"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| gameId | string (UUID) | Yes | ID của game |
| rankLevel | enum | Yes | BEGINNER, INTERMEDIATE, ADVANCED, PRO |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "355b65d7-3f82-47e2-82f1-63c7a225486b",
    "userId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "gameId": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "rankLevel": "ADVANCED",
    "game": {
      "name": "League of Legends",
      "iconUrl": "https://example.com/lol.png"
    }
  },
  "timestamp": "2026-01-31T17:14:17.972Z"
}
```

---

### GET `/user-game-profiles/me`

Lấy tất cả game profiles của user hiện tại.

**Auth Required:** Yes

```bash
curl -s http://localhost:3000/user-game-profiles/me \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "355b65d7-3f82-47e2-82f1-63c7a225486b",
      "userId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
      "gameId": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
      "rankLevel": "ADVANCED",
      "game": {
        "name": "League of Legends",
        "iconUrl": "https://example.com/lol.png",
        "bannerUrl": "https://example.com/lol-banner.png"
      }
    }
  ],
  "timestamp": "2026-01-31T17:26:01.856Z"
}
```

---

### GET `/user-game-profiles/:id`

Lấy chi tiết game profile theo ID.

**Auth Required:** Yes

```bash
curl -s http://localhost:3000/user-game-profiles/355b65d7-3f82-47e2-82f1-63c7a225486b \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "355b65d7-3f82-47e2-82f1-63c7a225486b",
    "userId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "gameId": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "rankLevel": "ADVANCED",
    "game": {
      "name": "League of Legends",
      "iconUrl": "https://example.com/lol.png"
    }
  },
  "timestamp": "2026-01-31T17:26:01.856Z"
}
```

---

### PATCH `/user-game-profiles/:id`

Cập nhật rank level của game profile.

**Auth Required:** Yes

```bash
curl -s -X PATCH http://localhost:3000/user-game-profiles/355b65d7-3f82-47e2-82f1-63c7a225486b \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rankLevel": "PRO"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rankLevel | enum | Yes | BEGINNER, INTERMEDIATE, ADVANCED, PRO |

---

### DELETE `/user-game-profiles/:id`

Xóa game profile.

**Auth Required:** Yes

```bash
curl -s -X DELETE http://localhost:3000/user-game-profiles/355b65d7-3f82-47e2-82f1-63c7a225486b \
  -H "Authorization: Bearer <access_token>"
```

---

## 7. Zones

### POST `/zones`

Tạo zone mới (tối đa 4 zone/user).

**Auth Required:** Yes

```bash
curl -s -X POST http://localhost:3000/zones \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "title": "Tim dong doi rank Vang",
    "description": "Can 2 nguoi choi mid va jungle",
    "minRankLevel": "BEGINNER",
    "maxRankLevel": "INTERMEDIATE",
    "requiredPlayers": 3,
    "autoApprove": false,
    "tagIds": [],
    "contacts": [
      { "type": "DISCORD", "value": "discord_id_123" },
      { "type": "INGAME", "value": "player_name" }
    ]
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| gameId | string (UUID) | Yes | ID của game |
| title | string | Yes | Tiêu đề zone |
| description | string | Yes | Mô tả chi tiết |
| minRankLevel | enum | Yes | BEGINNER, INTERMEDIATE, ADVANCED, PRO |
| maxRankLevel | enum | Yes | BEGINNER, INTERMEDIATE, ADVANCED, PRO |
| requiredPlayers | number | Yes | Số người cần tìm |
| autoApprove | boolean | No | Tự động chấp nhận join request (mặc định: false) |
| tagIds | string[] | No | Mảng ID của tags |
| contacts | object[] | No | Mảng contact methods (xem bên dưới) |

**Contact Method Object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | enum | Yes | DISCORD, INGAME, OTHER |
| value | string | Yes | Giá trị liên hệ (vd: discord ID, in-game name) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "e9593755-8bb5-4747-a4a2-e669e457c019",
    "gameId": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
    "ownerId": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
    "title": "Tim dong doi rank Vang",
    "description": "Can 2 nguoi choi",
    "minRankLevel": "BEGINNER",
    "maxRankLevel": "INTERMEDIATE",
    "requiredPlayers": 3,
    "status": "OPEN",
    "createdAt": "2026-01-31T17:26:15.686Z",
    "tags": [],
    "contacts": [],
    "owner": {
      "id": "9e0a44d5-65a0-4ee4-810f-ed6a77db6e53",
      "username": "testuser",
      "avatarUrl": null
    },
    "game": {
      "id": "472515e6-f4be-4c35-88bb-a8fb3a52680a",
      "name": "League of Legends",
      "iconUrl": "https://example.com/lol.png"
    },
    "joinRequests": []
  },
  "timestamp": "2026-01-31T17:26:15.689Z"
}
```

**Error Response (Đã đạt giới hạn 4 zone):**

```json
{
  "success": false,
  "message": "Bạn đã đạt giới hạn tạo zone (tối đa 4 zone)",
  "errorCode": "BAD_REQUEST",
  "statusCode": 400
}
```

---

### GET `/zones`

Lấy danh sách tất cả zones (public, có pagination).

**Auth Required:** No

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 10 | Số items/trang |

```bash
curl -s "http://localhost:3000/zones?page=1&limit=10"
```

**Response:**

```json
{
  "data": [
    {
      "id": "zone-uuid",
      "gameId": "game-uuid",
      "ownerId": "user-uuid",
      "title": "Tim dong doi rank Vang",
      "description": "Can 2 nguoi choi mid va jungle",
      "minRankLevel": "BEGINNER",
      "maxRankLevel": "INTERMEDIATE",
      "requiredPlayers": 3,
      "status": "OPEN",
      "createdAt": "2026-01-31T17:26:15.686Z",
      "tags": [],
      "owner": {
        "id": "user-uuid",
        "username": "testuser"
      },
      "game": {
        "id": "game-uuid",
        "name": "League of Legends",
        "iconUrl": "https://example.com/lol.png"
      },
      "_count": {
        "joinRequests": 2
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET `/zones/search`

Tìm kiếm zones với filters và sorting.

**Auth Required:** No

**Query Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | No | Search query cho title, description, username |
| sortBy | enum | No | newest, oldest, players_asc, players_desc |
| page | number | No | Default: 1 |
| limit | number | No | Default: 20 |

---

### GET `/zones/my`

Lấy danh sách zones của user hiện tại.

**Auth Required:** Yes

```bash
curl -s http://localhost:3000/zones/my \
  -H "Authorization: Bearer <access_token>"
```

---

### GET `/zones/:id/public`

Lấy chi tiết zone (public view).

**Auth Required:** No

```bash
curl -s http://localhost:3000/zones/e9593755-8bb5-4747-a4a2-e669e457c019/public
```

---

### GET `/zones/:id/owner`

Lấy chi tiết zone dành cho chủ sở hữu (bao gồm join requests đang chờ).

**Auth Required:** Yes (Owner)

```bash
curl -s http://localhost:3000/zones/e9593755-8bb5-4747-a4a2-e669e457c019/owner \
  -H "Authorization: Bearer <access_token>"
```

---

### PATCH `/zones/:id`

Cập nhật zone (chỉ owner).

**Auth Required:** Yes

```bash
curl -s -X PATCH http://localhost:3000/zones/e9593755-8bb5-4747-a4a2-e669e457c019 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tim dong doi Diamond+",
    "status": "FULL"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Tiêu đề mới |
| description | string | No | Mô tả mới |
| minRankLevel | enum | No | Rank tối thiểu |
| maxRankLevel | enum | No | Rank tối đa |
| requiredPlayers | number | No | Số người cần tìm |
| status | enum | No | OPEN, FULL, CLOSED |
| tagIds | string[] | No | Cập nhật tags (replace all) |
| contacts | object[] | No | Cập nhật contacts (replace all, cùng format như create) |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "e9593755-8bb5-4747-a4a2-e669e457c019",
    "title": "Tim dong doi Diamond+",
    "status": "FULL",
    ...
  },
  "timestamp": "2026-01-31T17:15:11.838Z"
}
```

---

### DELETE `/zones/:id`

Xóa zone (chỉ owner).

**Auth Required:** Yes

```bash
curl -s -X DELETE http://localhost:3000/zones/e9593755-8bb5-4747-a4a2-e669e457c019 \
  -H "Authorization: Bearer <access_token>"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Zone đã được xóa thành công"
  },
  "timestamp": "2026-01-31T17:15:35.222Z"
}
```

---

## 8. Zone Tags

### GET `/tags`

Lấy danh sách tất cả tags.

**Auth Required:** No

```bash
curl -s http://localhost:3000/tags
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "name": "Rank Push"
    },
    {
      "id": "tag-uuid-2",
      "name": "Casual"
    }
  ],
  "timestamp": "2026-02-01T10:00:00.000Z"
}
```

---

### POST `/tags`

Tạo tag mới (Admin only).

**Auth Required:** Yes (Admin)

```bash
curl -s -X POST http://localhost:3000/tags \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rank Push"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Tên tag (unique) |

**Response:**

```json
{
  "id": "tag-uuid",
  "name": "Rank Push"
}
```

**Error Response (409 - Duplicate):**

```json
{
  "success": false,
  "message": "Unique constraint failed on the fields: (`name`)",
  "statusCode": 409
}
```

---

### PATCH `/tags/:id`

Cập nhật tag (Admin only).

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Tag ID |

```bash
curl -s -X PATCH http://localhost:3000/tags/tag-uuid \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Competitive"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | Tên tag mới |

**Response:**

```json
{
  "id": "tag-uuid",
  "name": "Competitive"
}
```

---

### DELETE `/tags/:id`

Xóa tag (Admin only).

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Tag ID |

```bash
curl -s -X DELETE http://localhost:3000/tags/tag-uuid \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "message": "Tag deleted successfully"
}
```

---

## 9. Admin Zone Management

### GET `/zones/admin`

Lấy danh sách tất cả zones (Admin only, bypass ownership).

**Auth Required:** Yes (Admin)

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 20 | Số items/trang (max 100) |

```bash
curl -s "http://localhost:3000/zones/admin?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "data": [
    {
      "id": "zone-uuid",
      "gameId": "game-uuid",
      "ownerId": "user-uuid",
      "title": "Tim dong doi rank Vang",
      "description": "Can 2 nguoi choi mid va jungle",
      "minRankLevel": "BEGINNER",
      "maxRankLevel": "INTERMEDIATE",
      "requiredPlayers": 3,
      "status": "OPEN",
      "createdAt": "2026-02-01T10:00:00.000Z",
      "owner": {
        "id": "user-uuid",
        "username": "testuser",
        "email": "test@example.com"
      },
      "_count": {
        "joinRequests": 2
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### DELETE `/zones/admin/:id`

Force delete zone (Admin only).

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Zone ID |

```bash
curl -s -X DELETE http://localhost:3000/zones/admin/zone-uuid \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "message": "Zone đã được xóa bởi admin"
}
```

### PATCH `/zones/admin/:id/close`

Force close zone (Admin only).

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Zone ID |

```bash
curl -s -X PATCH http://localhost:3000/zones/admin/zone-uuid/close \
  -H "Authorization: Bearer <admin_token>"
```

**Response:**

```json
{
  "message": "Zone đã được đóng bởi admin",
  "data": {
    "id": "zone-uuid",
    "status": "CLOSED",
    "owner": {
      "id": "user-uuid",
      "username": "owner_user",
      "email": "owner@example.com"
    }
  }
}
```

---

## 10. Join Requests

### POST `/zones/:id/join`

Gửi yêu cầu tham gia một zone. Nếu zone có `autoApprove = true`, request sẽ được tự động chấp nhận và group sẽ tự tạo khi đủ người.

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | ID của zone muốn tham gia |

**Response (zone thường):**

```json
{
  "message": "Yêu cầu tham gia đã được gửi"
}
```

**Response (zone autoApprove):**

```json
{
  "message": "Bạn đã được tự động chấp nhận vào zone"
}
```

---

### GET `/zones/:id/requests`

Lấy danh sách các yêu cầu tham gia của một zone (chỉ dành cho chủ sở hữu zone).

**Auth Required:** Yes (Owner)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | ID của zone |

**Response:**

```json
[
  {
    "id": "request-uuid",
    "userId": "user-uuid",
    "zoneId": "zone-uuid",
    "status": "PENDING",
    "createdAt": "2026-02-12T10:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "username": "applicant",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
]
```

---

### PATCH `/zones/:id/requests/:requestId`

Chấp nhận hoặc từ chối yêu cầu tham gia (chỉ dành cho chủ sở hữu zone).

**Auth Required:** Yes (Owner)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | ID của zone |
| requestId | string (UUID) | Yes | ID của yêu cầu tham gia |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | enum | Yes | `APPROVED` hoặc `REJECTED` |

**Response:**

```json
{
  "message": "Yêu cầu đã được phê duyệt"
}
```

---

### DELETE `/zones/:id/join`

Hủy yêu cầu tham gia đã gửi (chỉ dành cho người gửi yêu cầu).

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | ID của zone đã gửi yêu cầu |

**Response:**

```json
{
  "message": "Yêu cầu tham gia đã được hủy"
}
```

---

### GET `/users/me/join-requests`

Lấy danh sách tất cả các yêu cầu tham gia mà bản thân đã gửi.

**Auth Required:** Yes

**Response:**

```json
[
  {
    "id": "request-uuid",
    "userId": "my-user-uuid",
    "zoneId": "zone-uuid",
    "status": "PENDING",
    "createdAt": "2026-02-12T09:00:00.000Z",
    "zone": {
      "id": "zone-uuid",
      "title": "Looking for teammates",
      "status": "OPEN"
    }
  }
]
```

---

## 11. Groups

### GET `/groups`

Lấy danh sách groups mà user hiện tại là thành viên.

**Auth Required:** Yes

**Response:**

```json
[
  {
    "id": "group-uuid",
    "zoneId": "zone-uuid",
    "leaderId": "leader-uuid",
    "gameId": "game-uuid",
    "isActive": true,
    "createdAt": "2026-02-12T12:00:00.000Z",
    "zone": {
      "id": "zone-uuid",
      "title": "Looking for teammates",
      "status": "FULL"
    },
    "game": {
      "id": "game-uuid",
      "name": "Valorant",
      "iconUrl": "https://example.com/icon.jpg"
    },
    "leader": {
      "id": "leader-uuid",
      "username": "team_leader",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "_count": {
      "members": 4
    }
  }
]
```

---

### GET `/groups/:id`

Chi tiết group (chỉ thành viên mới được xem).

**Auth Required:** Yes (Member)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Response:**

```json
{
  "id": "group-uuid",
  "zoneId": "zone-uuid",
  "leaderId": "leader-uuid",
  "gameId": "game-uuid",
  "isActive": true,
  "createdAt": "2026-02-12T12:00:00.000Z",
  "zone": {
    "id": "zone-uuid",
    "title": "Looking for teammates",
    "description": "Need 3 more players for ranked",
    "status": "FULL",
    "minRankLevel": "INTERMEDIATE",
    "maxRankLevel": "PRO"
  },
  "game": {
    "id": "game-uuid",
    "name": "Valorant",
    "iconUrl": "https://example.com/icon.jpg"
  },
  "leader": {
    "id": "leader-uuid",
    "username": "team_leader",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "members": [
    {
      "groupId": "group-uuid",
      "userId": "leader-uuid",
      "role": "LEADER",
      "joinedAt": "2026-02-12T12:00:00.000Z",
      "user": {
        "id": "leader-uuid",
        "username": "team_leader",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    },
    {
      "groupId": "group-uuid",
      "userId": "member-uuid",
      "role": "MEMBER",
      "joinedAt": "2026-02-12T12:05:00.000Z",
      "user": {
        "id": "member-uuid",
        "username": "player2",
        "avatarUrl": null
      }
    }
  ]
}
```

---

### POST `/groups/:id/leave`

Rời khỏi group (chỉ member, leader phải giải tán thay vì rời).

**Auth Required:** Yes (Member)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Response:**

```json
{
  "message": "Đã rời khỏi group"
}
```

**Error (Leader cố rời):**

```json
{
  "statusCode": 400,
  "message": "Leader không thể rời group. Hãy giải tán group thay vì rời."
}
```

---

### DELETE `/groups/:id`

Giải tán group (chỉ leader). Xóa hoàn toàn **Zone** — tự động xóa sạch Group, Members và Messages liên quan nhờ cơ chế Cascade.

> ⚠️ **Lưu ý:** Hành động này sẽ **xóa vĩnh viễn** bài đăng (Zone) và toàn bộ lịch sử chat. Không thể hoàn tác.

**Auth Required:** Yes (Leader)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Response:**

```json
{
  "message": "Nhóm và bài đăng đã được xóa hoàn toàn"
}
```

---

## 12. Group Members

### GET `/groups/:id/members`

Danh sách members của group (chỉ thành viên group mới xem được).

**Auth Required:** Yes (Member)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Response:**

```json
[
  {
    "groupId": "group-uuid",
    "userId": "leader-uuid",
    "role": "LEADER",
    "joinedAt": "2026-02-12T12:00:00.000Z",
    "user": {
      "id": "leader-uuid",
      "username": "team_leader",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  },
  {
    "groupId": "group-uuid",
    "userId": "member-uuid",
    "role": "MEMBER",
    "joinedAt": "2026-02-12T12:05:00.000Z",
    "user": {
      "id": "member-uuid",
      "username": "player2",
      "avatarUrl": null
    }
  }
]
```

---

### DELETE `/groups/:id/members/:userId`

Kick member ra khỏi group (chỉ leader).

**Auth Required:** Yes (Leader)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |
| userId | string (UUID) | Yes | ID của member cần kick |

**Response:**

```json
{
  "message": "Đã kick member khỏi group"
}
```

**Error (Kick chính mình):**

```json
{
  "statusCode": 400,
  "message": "Leader không thể kick chính mình"
}
```

---

### PATCH `/groups/:id/members/:userId`

Đổi role của member (chỉ leader). Khi chuyển LEADER cho member khác, leader hiện tại tự động thành MEMBER.

**Auth Required:** Yes (Leader)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |
| userId | string (UUID) | Yes | ID của member cần đổi role |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| role | enum | Yes | `LEADER` hoặc `MEMBER` |

**Response (đổi role thường):**

```json
{
  "message": "Đã đổi role thành MEMBER"
}
```

**Response (chuyển leader):**

```json
{
  "message": "Đã chuyển quyền leader cho user"
}
```

---

## 13. Group Management (Admin)

> **Note:** Route sử dụng `/groups/admin` thay vì `/admin/groups` như plan ban đầu, giống pattern của Zone Admin.

### GET `/groups/admin`

Danh sách tất cả groups (Admin only, pagination).

**Auth Required:** Yes (Admin)

**Query Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Trang hiện tại |
| limit | number | No | 10 | Số lượng mỗi trang |

**Response:**

```json
{
  "data": [
    {
      "id": "group-uuid",
      "zoneId": "zone-uuid",
      "leaderId": "leader-uuid",
      "gameId": "game-uuid",
      "isActive": true,
      "createdAt": "2026-02-12T12:00:00.000Z",
      "zone": {
        "id": "zone-uuid",
        "title": "Looking for teammates",
        "status": "FULL"
      },
      "game": {
        "id": "game-uuid",
        "name": "Valorant",
        "iconUrl": "https://example.com/icon.jpg"
      },
      "leader": {
        "id": "leader-uuid",
        "username": "team_leader",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "_count": {
        "members": 4,
        "messages": 25
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### DELETE `/groups/admin/:id`

Force xóa nhóm (Admin). **Xóa sạch Zone** và toàn bộ dữ liệu liên quan (Group, Members, Messages).

> ⚠️ **Lưu ý:** Hành động này **không thể hoàn tác**.

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Response:**

```json
{
  "message": "Nhóm đã được admin xóa hoàn toàn khỏi hệ thống"
}
```

---

### GET `/groups/admin/:id/messages`

Xem messages của group (Admin only, pagination).

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Query Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Trang hiện tại |
| limit | number | No | 20 | Số lượng mỗi trang |

**Response:**

```json
{
  "data": [
    {
      "id": "message-uuid",
      "groupId": "group-uuid",
      "senderId": "user-uuid",
      "content": "Hello team!",
      "createdAt": "2026-02-12T13:00:00.000Z",
      "sender": {
        "id": "user-uuid",
        "username": "player1",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

---

## 14. Messages & Chat

### GET `/groups/:groupId/messages`

Lấy lịch sử tin nhắn của group. Chỉ member mới được xem.

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| groupId | string (UUID) | Yes | Group ID |

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 30 | Số tin nhắn mỗi trang (max 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "message-uuid",
        "groupId": "group-uuid",
        "senderId": "user-uuid",
        "content": "Hello team!",
        "createdAt": "2026-02-23T15:43:52.000Z",
        "sender": {
          "id": "user-uuid",
          "username": "progamer",
          "avatarUrl": "https://example.com/avatar.jpg"
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 30,
      "total": 50,
      "totalPages": 2
    }
  },
  "timestamp": "2026-02-23T15:44:00.000Z"
}
```

> **Lưu ý:** Response không bao gồm `isDeleted` vì hệ thống dùng **hard delete** — messages đã xóa sẽ không còn trong DB.

---

### DELETE `/messages/:id`

Xóa tin nhắn của chính mình (**hard delete**). Chỉ người gửi mới được xóa. Tin nhắn bị xóa vĩnh viễn khỏi database.

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Message ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Đã xóa tin nhắn"
  },
  "timestamp": "2026-02-23T15:45:00.000Z"
}
```

---

## 15. WebSocket Events (Real-time)

Kết nối tới namespace `/chat` tại địa chỉ: `ws://localhost:3000/chat`.
Token JWT được gửi qua trường `auth.token` trong handshake.

### Client Send Events

#### `joinRoom`
Tham gia vào phòng của group.
- **Payload:** `{ "groupId": "string" }`
- **Ack:** `{ "success": boolean, "message": "string" }`

#### `leaveRoom`
Rời khỏi phòng của group.
- **Payload:** `{ "groupId": "string" }`
- **Ack:** `{ "success": boolean }`

#### `sendMessage`
Gửi tin nhắn mới tới group.
- **Payload:** `{ "groupId": "string", "content": "string" }`
- **Constraint:** `content` tối đa **2000 ký tự**
- **Ack:** `{ "success": boolean }`
- **Error (vượt giới hạn):** WsException `"Tin nhắn không được vượt quá 2000 ký tự"`

#### `typing`
Thông báo trạng thái đang nhập tin nhắn.
- **Payload:** `{ "groupId": "string", "isTyping": boolean }`

### Server Emitted Events

#### `newMessage`
Gửi tới các thành viên trong room khi có tin nhắn mới.
- **Payload:** 
```json
{
  "id": "uuid",
  "content": "string",
  "createdAt": "iso-date",
  "sender": { "id": "uuid", "username": "string", "avatarUrl": "string" }
}
```

#### `userTyping`
Broadcast trạng thái đang nhập của một thành viên cho những người khác.
- **Payload:** `{ "userId": "uuid", "username": "string", "isTyping": boolean }`

#### `notification:new` (Phase 7)
Gửi tới user khi có thông báo mới. User phải đã join ít nhất 1 room (`joinRoom`) để nhận — server tự join `user:${userId}`.
- **Payload:** `{ "notification": { id, type, title, data?, isRead, createdAt }, "unreadCount": number }`
- **Notification types:** `JOIN_REQUEST`, `REQUEST_APPROVED`, `REQUEST_REJECTED`, `GROUP_FORMED`, `MEMBER_LEFT`

---

## 16. Notifications (Phase 7)

Module thông báo cho user: danh sách, đánh dấu đọc, xóa. Realtime qua WebSocket (event `notification:new` kèm `unreadCount`).

### GET `/notifications`

Lấy danh sách thông báo của user hiện tại (pagination). Trả về `items`, `total`, `unreadCount`.

**Auth Required:** Yes

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 10 | Số thông báo mỗi trang |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notification-uuid",
        "userId": "user-uuid",
        "type": "JOIN_REQUEST",
        "title": "Có request mới",
        "data": { "zoneId": "zone-uuid", "requestId": "request-uuid" },
        "isRead": false,
        "createdAt": "2026-03-01T10:00:00.000Z"
      }
    ],
    "total": 25,
    "unreadCount": 3,
    "meta": { "page": 1, "limit": 10 }
  },
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

**NotificationType enum:** `JOIN_REQUEST`, `REQUEST_APPROVED`, `REQUEST_REJECTED`, `GROUP_FORMED`, `MEMBER_LEFT`, `NEW_MESSAGE` (chưa dùng).

**Data object** (tùy type): `zoneId`, `requestId`, `groupId`, `status` (APPROVED/REJECTED) — dùng để navigate.

---

### PATCH `/notifications/:id/read`

Đánh dấu 1 thông báo đã đọc. Chỉ được đánh dấu thông báo của chính mình.

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Notification ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "notification-uuid",
    "userId": "user-uuid",
    "type": "REQUEST_APPROVED",
    "title": "Request đã được chấp nhận",
    "data": { "zoneId": "zone-uuid", "groupId": "group-uuid" },
    "isRead": true,
    "createdAt": "2026-03-01T09:00:00.000Z"
  },
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

**Error (400):** `"Thông báo không tồn tại"` — khi id không thuộc về user hoặc không tồn tại.

---

### PATCH `/notifications/read-all`

Đánh dấu tất cả thông báo của user đã đọc.

**Auth Required:** Yes

**Response:**

```json
{
  "success": true,
  "data": { "count": 15 },
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

---

### DELETE `/notifications/:id`

Xóa 1 thông báo. Chỉ được xóa thông báo của chính mình.

**Auth Required:** Yes

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Notification ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "notification-uuid",
    "userId": "user-uuid",
    "type": "GROUP_FORMED",
    "title": "Group đã tạo",
    "data": { "groupId": "group-uuid", "zoneId": "zone-uuid" },
    "isRead": true,
    "createdAt": "2026-03-01T08:00:00.000Z"
  },
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

**Error (400):** `"Thông báo không tồn tại"`.

---

### Khi nào tạo Notification (Business Logic)

| Sự kiện | Type | Người nhận | Data |
|---------|------|------------|------|
| User gửi join request | `JOIN_REQUEST` | Chủ zone (ownerId) | `{ zoneId, requestId }` |
| Owner approve request | `REQUEST_APPROVED` | Người gửi request | `{ zoneId, requestId, groupId?, status }` |
| Owner reject request | `REQUEST_REJECTED` | Người gửi request | `{ zoneId, requestId, status }` |
| Zone đủ người → tạo group | `GROUP_FORMED` | Tất cả members | `{ groupId, zoneId }` |
| Member rời group | `MEMBER_LEFT` | Leader | `{ groupId }` |
| Member bị kick | `MEMBER_LEFT` | Leader | `{ groupId }` |

---

### Realtime (WebSocket)

User nhận notification realtime qua event `notification:new` khi đã join room (gửi `joinRoom` với `groupId`). Server tự join user vào `user:${userId}`.

**Server emit:** `notification:new`

```json
{
  "notification": {
    "id": "uuid",
    "type": "JOIN_REQUEST",
    "title": "Có request mới",
    "data": { "zoneId": "zone-uuid", "requestId": "request-uuid" },
    "isRead": false,
    "createdAt": "2026-03-01T10:00:00.000Z"
  },
  "unreadCount": 4
}
```

**Lưu ý:** User chỉ nhận realtime sau khi đã mở ít nhất 1 group chat (đã emit `joinRoom`).

---

### NotificationsCleanupService

Cron job chạy mỗi ngày **3:10 AM** — xóa notifications đã đọc (`isRead: true`) và cũ hơn **90 ngày**.

---

## 17. Message Management (Admin)

### GET `/messages/admin`

Admin lấy danh sách tất cả messages trong hệ thống (pagination). Chỉ trả về messages còn tồn tại (hệ thống dùng hard delete).

**Auth Required:** Yes (Admin)

**Query Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 20 | Số lượng mỗi trang |

**Response:** Giống GET messages theo group nhưng bao gồm cả tin nhắn đã xóa.

---

### DELETE `/messages/admin/:id`

Admin xóa bất kỳ tin nhắn nào (**hard delete**). Tin nhắn bị xóa vĩnh viễn khỏi database.

**Auth Required:** Yes (Admin)

**Path Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (UUID) | Yes | Message ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Admin đã xóa tin nhắn"
  },
  "timestamp": "2026-02-23T15:46:00.000Z"
}
```

---

## 18. Error Responses

### 401 Unauthorized

Khi không có token hoặc token không hợp lệ.

```json
{
  "success": false,
  "message": "Authentication required",
  "errorCode": "UNAUTHORIZED",
  "statusCode": 401,
  "timestamp": "2026-01-31T17:15:48.390Z",
  "path": "/users/me"
}
```

### 403 Forbidden

Khi không có quyền truy cập resource.

```json
{
  "success": false,
  "message": "Access denied: Required role(s): ADMIN",
  "errorCode": "FORBIDDEN",
  "statusCode": 403,
  "timestamp": "2026-01-31T17:13:44.918Z",
  "path": "/games"
}
```

### 400 Bad Request

Khi dữ liệu gửi lên không hợp lệ.

```json
{
  "success": false,
  "message": ["bannerUrl should not be empty", "bannerUrl must be a string"],
  "errorCode": "BAD_REQUEST",
  "statusCode": 400,
  "timestamp": "2026-01-31T17:14:02.143Z",
  "path": "/games"
}
```

### 404 Not Found

Khi resource không tồn tại.

```json
{
  "success": false,
  "message": "Zone không tồn tại",
  "errorCode": "NOT_FOUND",
  "statusCode": 404,
  "timestamp": "2026-01-31T17:14:34.648Z",
  "path": "/zones/invalid-id"
}
```

---

---

## 19. Enums Reference

### RankLevel

```
BEGINNER
INTERMEDIATE
ADVANCED
PRO
```

### ZoneStatus

```
OPEN
FULL
CLOSED
```

### UserRole

```
USER
ADMIN
```

### UserStatus

```
ACTIVE
BANNED
```

### ContactMethodType

```
DISCORD
INGAME
OTHER
```

### JoinRequestStatus

```
PENDING
APPROVED
REJECTED
```

### GroupMemberRole

```
LEADER
MEMBER
```

### AuthProvider

```
LOCAL
GOOGLE
```

### NotificationType

```
JOIN_REQUEST      // Ai đó gửi request join zone
REQUEST_APPROVED  // Request được chấp nhận
REQUEST_REJECTED  // Request bị từ chối
GROUP_FORMED      // Group đã tạo
MEMBER_LEFT       // Ai đó rời group
NEW_MESSAGE       // Tin nhắn mới (chưa dùng — Phase 7 bỏ qua)
```

---

---

## 20. Modules chưa implement đầy đủ

Các modules sau chỉ có boilerplate, cần implement thêm:

- `/reports` - Báo cáo vi phạm
