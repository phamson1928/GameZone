# Phase 8: Report & Moderation — Implementation Plan

**Thời gian ước tính:** Week 11-12 (10-14 ngày)

---

## Tổng quan

Phase 8 bao gồm:
1. **Report System** — Người dùng báo cáo vi phạm (User/Zone/Group)
2. **Moderation Actions** — Sử dụng các action đã có (Ban, Close Zone, Delete Group)
3. **Dashboard Module** — Module riêng cho thống kê trang Admin Dashboard

> **Đã bỏ:** Audit Logs — không triển khai trong Phase 8.

---

## Quyết định kiến trúc

### Dashboard — Module riêng

Tạo **module `dashboard`** riêng cho các thống kê Admin, vì:
- Dashboard tổng hợp nhiều resource (Users, Zones, Groups, Reports)
- Không thuộc riêng module nào
- Pattern: `GET /dashboard/stats` (prefix `dashboard`)

### Reports — Giữ trong Reports module

- `POST /reports` (user) — Tạo report
- `GET /reports` (admin) — Danh sách reports
- `PATCH /reports/:id` (admin) — Resolve report

**Report stats** gộp vào response của `GET /dashboard/stats`.

---

## 1. Schema Changes (Prisma)

### 1.1 Report model — Bổ sung (optional)

Schema hiện có đã đủ cho MVP:
```prisma
model Report {
  id         String           @id @default(uuid())
  reporterId String
  targetType ReportTargetType  // USER | ZONE | GROUP
  targetId   String
  reason     String
  status     ReportStatus     @default(OPEN)  // OPEN | RESOLVED

  reporter User @relation("ReportReporter", fields: [reporterId], references: [id])

  createdAt DateTime @default(now())
}
```

**Optional (làm sau):** Thêm `resolvedAt`, `resolvedById`, `resolutionNote` nếu cần ghi chi tiết khi resolve.

### 1.2 Report — Index

```prisma
model Report {
  // ...
  @@index([status])
  @@index([targetType, targetId])
  @@index([reporterId])
  @@index([createdAt])
}
```

---

## 2. Implementation Checklist

### 2.1 Report System

| # | Task | File(s) | Chi tiết |
|---|------|---------|----------|
| 1 | Report indexes | `prisma/schema.prisma` | Thêm @@index nếu chưa có |
| 2 | CreateReportDto | `reports/dto/create-report.dto.ts` | `targetType`, `targetId`, `reason` — validate targetId tồn tại theo targetType |
| 3 | UpdateReportDto | `reports/dto/update-report.dto.ts` | `status`, `resolutionNote` (optional) — chỉ admin |
| 4 | ReportQueryDto | `reports/dto/report-query.dto.ts` | `page`, `limit`, `status`, `targetType` |
| 5 | ReportsService.create | `reports/reports.service.ts` | Validate target tồn tại; không report chính mình (nếu USER) |
| 6 | ReportsService.findAll (Admin) | `reports/reports.service.ts` | Pagination, filter status/targetType, orderBy createdAt desc |
| 7 | ReportsService.resolve | `reports/reports.service.ts` | Chỉ RESOLVED, ghi resolvedAt nếu có field |
| 8 | ReportsController | `reports/reports.controller.ts` | POST (user), GET + PATCH (admin only) — route admin trước `:id` |

**Lưu ý route order:**
```
GET  /reports          → Admin list (RolesGuard)
POST /reports          → User create
GET  /reports/:id      → (Optional) Admin detail
PATCH /reports/:id     → Admin resolve
```

### 2.2 Moderation Actions (Đã có — Không cần thêm)

| Action | Endpoint | Status |
|--------|----------|--------|
| Ban user | `PATCH /users/:id/ban` | ✅ Đã có |
| Unban user | `PATCH /users/:id/unban` | ✅ Đã có |
| Close zone | `PATCH /zones/admin/:id/close` | ✅ Đã có |
| Delete group | `DELETE /groups/admin/:id` | ✅ Đã có |
| Delete zone | `DELETE /zones/admin/:id` | ✅ Đã có |
| Delete message | `DELETE /messages/admin/:id` | ✅ Đã có |

**View report history** → `GET /reports` (admin list) đã cover.

### 2.3 Dashboard Module (Statistics)

| # | Task | File(s) | Chi tiết |
|---|------|---------|----------|
| 1 | DashboardModule | `dashboard/dashboard.module.ts` | Module mới |
| 2 | DashboardController | `dashboard/dashboard.controller.ts` | `@Controller('dashboard')` |
| 3 | DashboardService.getStats | `dashboard/dashboard.service.ts` | Aggregate: User, Zone, Group, Report |
| 4 | GET /dashboard/stats | `dashboard/dashboard.controller.ts` | Admin only, trả về `{ users, zones, groups, reports }` |

**Response structure:**
```json
{
  "users": {
    "total": 1500,
    "active": 1480,
    "banned": 20,
    "newToday": 12,
    "newThisWeek": 85,
    "activeToday": 320,
    "activeThisWeek": 1100
  },
  "zones": {
    "total": 450,
    "open": 380,
    "closed": 70
  },
  "groups": {
    "total": 200,
    "active": 185,
    "dissolved": 15
  },
  "reports": {
    "total": 45,
    "open": 12,
    "resolved": 33
  }
}
```

### 2.4 Dashboard Charts

**Query params chung:** `?period=7d` | `30d` (mặc định 30d)

#### Phase 8 — MVP

| # | Endpoint | Mô tả | Data source |
|---|----------|-------|-------------|
| 1 | `GET /dashboard/charts/users` | Tăng trưởng users theo ngày | `User` group by date(createdAt) |
| 2 | `GET /dashboard/charts/zones` | Zones theo game (phân bố) | `Zone` join `Game`, group by gameId |
| 3 | `GET /dashboard/charts/activity` | Hoạt động theo giờ | `UserProfile.lastActiveAt` hoặc `Message.createdAt` (proxy) |

#### Phase 9 — Production (charts bổ sung)

| # | Endpoint | Mô tả | Data source |
|---|----------|-------|-------------|
| 4 | `GET /dashboard/charts/reports` | Xu hướng reports (open vs resolved theo ngày) | `Report` group by date(createdAt), status |
| 5 | `GET /dashboard/charts/engagement` | Zones/Groups tạo mới theo ngày | `Zone.createdAt`, `Group.createdAt` |
| 6 | `GET /dashboard/charts/top-games` | Top games (zones count, groups count) | `Zone` + `Group` group by gameId |
| 7 | `GET /dashboard/charts/peak-hours` | Giờ cao điểm (zones tạo, join requests) | `Zone.createdAt`, `ZoneJoinRequest.createdAt` |
| 8 | `GET /dashboard/charts/moderation` | Moderation workload (reports pending, avg resolution time) | `Report` — cần `resolvedAt` |

**Response format (ví dụ):**
```json
// users chart
{ "data": [{ "date": "2026-02-25", "count": 15, "cumulative": 1200 }, ...] }

// zones by game
{ "data": [{ "gameId": "uuid", "gameName": "League of Legends", "count": 85 }, ...] }

// reports chart
{ "data": [{ "date": "2026-02-25", "opened": 3, "resolved": 5 }, ...] }
```

---

## 3. Thứ tự triển khai (Recommended Order)

**Phase 8:**
```
1. Reports: DTOs + Service (create, findAll, resolve) + Controller
2. Dashboard: Module + Service + Controller (GET /dashboard/stats)
3. Dashboard charts MVP: users, zones, activity
4. (Optional) Report indexes + Report schema bổ sung (resolvedAt)
```

**Phase 9 (Production):**
```
5. Dashboard charts: reports, engagement, top-games, peak-hours, moderation
```

---

## 4. API Endpoints Summary

### Phase 8 (Reports + Dashboard MVP)

| Method | Path | Auth | Role | Mô tả |
|--------|------|------|------|-------|
| POST | `/reports` | JWT | USER | Tạo report |
| GET | `/reports` | JWT | ADMIN | Danh sách reports (pagination, filter) |
| GET | `/reports/:id` | JWT | ADMIN | Chi tiết report (optional) |
| PATCH | `/reports/:id` | JWT | ADMIN | Resolve report |
| GET | `/dashboard/stats` | JWT | ADMIN | Thống kê tổng quan |
| GET | `/dashboard/charts/users` | JWT | ADMIN | Chart tăng trưởng users |
| GET | `/dashboard/charts/zones` | JWT | ADMIN | Chart zones theo game |
| GET | `/dashboard/charts/activity` | JWT | ADMIN | Chart hoạt động theo giờ |

### Phase 9 (Dashboard Production)

| Method | Path | Auth | Role | Mô tả |
|--------|------|------|------|-------|
| GET | `/dashboard/charts/reports` | JWT | ADMIN | Xu hướng reports (open/resolved) |
| GET | `/dashboard/charts/engagement` | JWT | ADMIN | Zones/Groups tạo mới theo ngày |
| GET | `/dashboard/charts/top-games` | JWT | ADMIN | Top games (zones, groups count) |
| GET | `/dashboard/charts/peak-hours` | JWT | ADMIN | Giờ cao điểm |
| GET | `/dashboard/charts/moderation` | JWT | ADMIN | Moderation workload (cần resolvedAt) |

---

## 5. Validation Rules

### CreateReportDto
- `targetType`: enum USER | ZONE | GROUP
- `targetId`: UUID, tồn tại trong DB theo targetType
- `reason`: string, min 10, max 500 ký tự
- Business: Không report chính mình (nếu targetType=USER và targetId=reporterId)

### Resolve Report
- Chỉ chuyển status OPEN → RESOLVED
- `resolutionNote`: optional, max 500 ký tự

---

## 6. Error Cases

| Case | HTTP | Message |
|------|------|---------|
| Target không tồn tại | 404 | "User/Zone/Group không tồn tại" |
| Report chính mình (USER) | 400 | "Không thể báo cáo chính mình" |
| Report đã resolved | 400 | "Report đã được xử lý" |

---

## 7. Files to Create/Modify

### Create (Phase 8)
- `src/dashboard/dashboard.module.ts`
- `src/dashboard/dashboard.controller.ts`
- `src/dashboard/dashboard.service.ts`
- `src/dashboard/dto/chart-query.dto.ts` (period: 7d | 30d)
- `src/reports/dto/report-query.dto.ts`
- `src/reports/dto/create-report.dto.ts` (implement)
- `src/reports/dto/report-response.dto.ts` (optional)

### Create (Phase 9 — Charts bổ sung)
- Extend `DashboardService` với các method: `getReportsChart`, `getEngagementChart`, `getTopGamesChart`, `getPeakHoursChart`, `getModerationChart`

### Modify
- `prisma/schema.prisma` — Report indexes (nếu cần)
- `src/reports/reports.service.ts` — Full implementation
- `src/reports/reports.controller.ts` — Route order, RolesGuard
- `src/app.module.ts` — Import DashboardModule
- `src/reports/reports.module.ts` — Import PrismaModule

---

## 8. Testing Suggestions

- Unit: ReportsService (create validation, resolve)
- E2E: POST /reports → 201, GET /reports (admin) → 200
- E2E: PATCH /reports/:id (resolve) → 200
- E2E: GET /dashboard/stats → 200 (admin)

---

## 9. Folder Structure (sau Phase 8)

```
src/
├── common/
├── prisma/
├── auth/
├── users/
├── games/
├── zones/
├── groups/
├── messages/
├── notifications/
├── reports/
├── dashboard/          ← NEW: Module riêng cho thống kê Admin
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts
└── gateways/
```
