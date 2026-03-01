# Zone Cleanup Cron Job — Implementation Plan

**Mục đích:** Tự động xóa zones tồn tại lâu, không còn hoạt động để giảm tải database.

---

## 1. Tổng quan

Hiện tại có 2 cron cleanup:
- **MessagesCleanupService** — 3:00 AM, 3:05 AM
- **NotificationsCleanupService** — 3:10 AM

**Thêm:** ZonesCleanupService — xóa zones cũ theo điều kiện.

---

## 2. Zone Model & Cascade

```
Zone
├── ZoneTagRelation[]     (onDelete: Cascade)
├── ZoneContactMethod[]   (onDelete: Cascade)
├── ZoneJoinRequest[]     (onDelete: Cascade)
└── Group?                (onDelete: Cascade)
    ├── GroupMember[]
    └── Message[]
```

**Xóa Zone** → Prisma cascade xóa tags, contacts, joinRequests, group (và members, messages).

---

## 3. Điều kiện xóa Zone

### 3.1 Zone CLOSED lâu ngày

| Điều kiện | Giá trị đề xuất | Lý do |
|-----------|-----------------|-------|
| `status = CLOSED` | — | Zone đã đóng, không còn tìm người |
| `createdAt` < X ngày | **90 ngày** | Đủ lâu để không còn cần |
| Có Group? | Có thể có | Nếu có group → zone đã match. Group có thể đã dissolved. |

**Lưu ý:** Zone CLOSED có thể do owner đóng hoặc admin force close. Cả hai đều "xong việc".

### 3.2 Zone OPEN không có hoạt động

| Điều kiện | Giá trị đề xuất | Lý do |
|-----------|-----------------|-------|
| `status = OPEN` | — | Chưa đủ người |
| `createdAt` < X ngày | **60 ngày** | Zone cũ, ít khả năng còn ai join |
| Không có join request mới | Optional | Có thể check `ZoneJoinRequest.createdAt` max < Y ngày |

**Đề xuất đơn giản:** Chỉ dùng `status + createdAt`. Bỏ qua "không có join request" để tránh query phức tạp.

### 3.3 Zone FULL

Zone FULL = đủ người, sẽ tạo Group. Khi có Group, Zone vẫn tồn tại (1-1 với Group).

- **Không xóa Zone FULL** nếu Group còn `isActive: true`
- **Có thể xóa Zone FULL** nếu Group đã dissolved (`isActive: false`) và zone cũ > 90 ngày

---

## 4. Chiến lược đề xuất

### Option A — Đơn giản (MVP)

Chỉ xóa **Zone CLOSED** cũ hơn **90 ngày**.

```
WHERE status = 'CLOSED' AND createdAt < (now - 90 days)
```

- Ưu: Đơn giản, ít rủi ro
- Nhược: Zone OPEN cũ vẫn tồn tại

### Option B — Đầy đủ

1. **Zone CLOSED** cũ hơn 90 ngày → xóa
2. **Zone OPEN** cũ hơn 60 ngày → xóa (owner có thể tạo zone mới nếu cần)
3. **Zone FULL** có Group dissolved + zone cũ hơn 90 ngày → xóa

---

## 5. Implementation Plan

### 5.1 File structure

```
src/zones/
├── zones.module.ts
├── zones.service.ts
├── zones.controller.ts
├── zones-cleanup.service.ts   ← NEW
└── ...
```

### 5.2 ZonesCleanupService

| Method | Cron | Điều kiện |
|--------|------|-----------|
| `purgeOldClosedZones()` | `15 3 * * *` (3:15 AM) | `status = CLOSED`, `createdAt` < 90 ngày |
| `purgeOldOpenZones()` | `20 3 * * *` (3:20 AM) | `status = OPEN`, `createdAt` < 60 ngày (optional) |
| `purgeOldFullZonesWithDissolvedGroup()` | `25 3 * * *` (3:25 AM) | `status = FULL`, group `isActive = false`, zone > 90 ngày (optional) |

**Thứ tự trong ngày:** Sau Messages (3:00, 3:05) và Notifications (3:10).

### 5.3 Prisma query (ví dụ)

```typescript
// Purge CLOSED zones older than 90 days
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

await this.prisma.zone.deleteMany({
  where: {
    status: 'CLOSED',
    createdAt: { lt: ninetyDaysAgo },
  },
});
```

### 5.4 ZonesModule

- Import `ScheduleModule` (hoặc dùng global từ MessagesModule)
- Add `ZonesCleanupService` vào providers

---

## 6. Config (Environment)

Đề xuất dùng env để dễ chỉnh:

```
ZONE_CLEANUP_CLOSED_DAYS=90
ZONE_CLEANUP_OPEN_DAYS=60
ZONE_CLEANUP_ENABLED=true
```

---

## 7. Lưu ý

1. **Batch size:** Nếu có hàng nghìn zones, có thể dùng `deleteMany` với `take` hoặc chunk để tránh lock lâu.
2. **Logging:** Log số lượng xóa mỗi lần chạy.
3. **Owner notification:** Không gửi thông báo khi zone bị auto-delete (zone cũ, owner có thể đã quên).
4. **Soft delete:** Plan này dùng **hard delete** (giống messages, notifications). Không soft delete zone.

---

## 8. Thứ tự Cron trong ngày

| Thời gian | Service | Job |
|-----------|---------|-----|
| 3:00 AM | MessagesCleanupService | purge-old-messages |
| 3:05 AM | MessagesCleanupService | purge-dissolved-group-messages |
| 3:10 AM | NotificationsCleanupService | purge-old-notifications |
| **3:15 AM** | **ZonesCleanupService** | **purge-old-closed-zones** |
| **3:20 AM** | **ZonesCleanupService** | **purge-old-open-zones** (optional) |

---

## 9. Checklist

- [ ] Tạo `zones-cleanup.service.ts`
- [ ] Thêm 1–2 cron jobs (CLOSED bắt buộc, OPEN optional)
- [ ] Import ScheduleModule vào ZonesModule (nếu chưa có global)
- [ ] Thêm env vars (optional)
- [ ] Cập nhật DEVELOPMENT_PLAN.md / Known Issues nếu cần
