# Common Module - Hướng dẫn sử dụng

Folder `common` chứa các utilities dùng chung trong toàn bộ dự án PlayZone Backend.

## Mục lục

- [1. Decorators](#1-decorators)
  - [@Public()](#public)
  - [@CurrentUser()](#currentuser)
  - [@Roles()](#roles)
- [2. Guards](#2-guards)
  - [JwtAuthGuard](#jwtauthguard)
  - [RolesGuard](#rolesguard)
- [3. DTOs](#3-dtos)
  - [PaginationDto](#paginationdto)
  - [ApiResponseDto](#apiresponsedto)
- [4. Interfaces](#4-interfaces)
- [5. Filters](#5-filters)
- [6. Interceptors](#6-interceptors)
- [7. Import nhanh](#7-import-nhanh)

---

## 1. Decorators

### @Public()

Đánh dấu route **không cần authentication**. Mặc định tất cả routes đều yêu cầu JWT token.

**File:** `src/common/decorators/public.decorator.ts`

**Cách dùng:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators';

@Controller('products')
export class ProductsController {
  // Route này KHÔNG cần đăng nhập
  @Public()
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Route này CẦN đăng nhập (mặc định)
  @Get('my-purchases')
  getMyPurchases() {
    return this.productsService.getMyPurchases();
  }
}
```

**Áp dụng cho cả Controller:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators';

@Public() // Tất cả routes trong controller này đều public
@Controller('public')
export class PublicController {
  @Get('info')
  getInfo() {
    return { version: '1.0.0' };
  }

  @Get('status')
  getStatus() {
    return { status: 'healthy' };
  }
}
```

---

### @CurrentUser()

Lấy thông tin user hiện tại từ JWT token đã được xác thực.

**File:** `src/common/decorators/current-user.decorator.ts`

**Cách dùng cơ bản - Lấy toàn bộ user info:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators';
import type { JwtPayload } from '../common/interfaces';

@Controller('users')
export class UsersController {
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    console.log(user);
    // Output: { sub: 'uuid-123', email: 'user@example.com', role: 'USER' }

    return this.usersService.findById(user.sub);
  }
}
```

**Lấy field cụ thể:**

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CurrentUser } from '../common/decorators';

@Controller('posts')
export class PostsController {
  // Lấy user ID
  @Get('my-posts')
  getMyPosts(@CurrentUser('sub') userId: string) {
    return this.postsService.findByUserId(userId);
  }

  // Lấy email
  @Get('my-email')
  getMyEmail(@CurrentUser('email') email: string) {
    return { email };
  }

  // Lấy role
  @Get('my-role')
  getMyRole(@CurrentUser('role') role: string) {
    return { role };
  }

  // Kết hợp với Body
  @Post()
  createPost(
    @CurrentUser('sub') userId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(userId, createPostDto);
  }
}
```

**JwtPayload structure:**

```typescript
interface JwtPayload {
  sub: string; // User ID (UUID)
  email: string; // User email
  role: string; // 'USER' | 'ADMIN'
  iat?: number; // Issued at (timestamp)
  exp?: number; // Expiration (timestamp)
}
```

---

### @Roles()

Giới hạn quyền truy cập route theo role của user. **Phải dùng kèm với RolesGuard.**

**File:** `src/common/decorators/roles.decorator.ts`

**Cách dùng:**

```typescript
import { Controller, Get, Delete, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@Controller('admin')
@UseGuards(RolesGuard) // Bắt buộc phải có
export class AdminController {
  // Chỉ ADMIN mới truy cập được
  @Roles('ADMIN')
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // Chỉ ADMIN mới xóa được user
  @Roles('ADMIN')
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
```

**Nhiều roles:**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@Controller('reports')
@UseGuards(RolesGuard)
export class ReportsController {
  // Cả ADMIN và MODERATOR đều truy cập được
  @Roles('ADMIN', 'MODERATOR')
  @Get()
  getAllReports() {
    return this.reportsService.findAll();
  }
}
```

**Áp dụng cho cả Controller:**

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN') // Tất cả routes trong controller này chỉ ADMIN truy cập được
export class AdminController {
  @Get('users')
  getUsers() {
    /* ... */
  }

  @Get('stats')
  getStats() {
    /* ... */
  }

  @Post('broadcast')
  broadcast() {
    /* ... */
  }
}
```

---

## 2. Guards

### JwtAuthGuard

Guard xác thực JWT token. **Đã được đăng ký global** trong `AppModule`, không cần import thủ công.

**File:** `src/common/guards/jwt-auth.guard.ts`

**Hành vi mặc định:**

- Tất cả routes đều yêu cầu JWT token trong header `Authorization: Bearer <token>`
- Nếu không có token hoặc token không hợp lệ → trả về `401 Unauthorized`
- Dùng `@Public()` để bypass authentication

**Sử dụng thủ công (nếu cần):**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';

@Controller('secure')
export class SecureController {
  @UseGuards(JwtAuthGuard)
  @Get('data')
  getSecureData() {
    return { secret: 'data' };
  }
}
```

**Error responses:**

```json
// Token không có
{
  "statusCode": 401,
  "message": "Authentication required",
  "error": "Unauthorized"
}

// Token hết hạn
{
  "statusCode": 401,
  "message": "Access token has expired",
  "error": "Unauthorized"
}

// Token không hợp lệ
{
  "statusCode": 401,
  "message": "Invalid access token",
  "error": "Unauthorized"
}
```

---

### RolesGuard

Guard kiểm tra role của user. **Phải dùng kèm với @Roles() decorator.**

**File:** `src/common/guards/roles.guard.ts`

**Cách dùng:**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('admin')
@UseGuards(RolesGuard) // Đặt ở controller level
export class AdminController {
  @Roles('ADMIN')
  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }
}
```

**Hoặc đặt ở route level:**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('mixed')
export class MixedController {
  // Route này ai cũng truy cập được (đã login)
  @Get('public-data')
  getPublicData() {
    return { data: 'public' };
  }

  // Route này chỉ ADMIN
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin-data')
  getAdminData() {
    return { data: 'admin only' };
  }
}
```

**Error response khi không đủ quyền:**

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## 3. DTOs

### PaginationDto

DTO chuẩn cho query params phân trang.

**File:** `src/common/dto/pagination.dto.ts`

**Cách dùng trong Controller:**

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { PaginationDto } from '../common/dto';

@Controller('products')
export class ProductsController {
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    const { page, limit } = pagination;
    // page mặc định = 1
    // limit mặc định = 10, tối đa = 100

    return this.productsService.findAll(page, limit);
  }
}
```

**Cách dùng trong Service:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
```

**Query params:**

```
GET /products?page=2&limit=20
```

**PaginationDto structure:**

```typescript
class PaginationDto {
  page?: number; // Mặc định: 1, Tối thiểu: 1
  limit?: number; // Mặc định: 10, Tối thiểu: 1, Tối đa: 100
}
```

---

### ApiResponseDto

DTO wrapper cho API response chuẩn. Được tự động áp dụng bởi `TransformResponseInterceptor`.

**File:** `src/common/dto/api-response.dto.ts`

**Response format:**

```typescript
// Success response
{
  "success": true,
  "data": { /* your data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Error response (từ GlobalExceptionFilter)
{
  "success": false,
  "message": "Error message",
  "error": "Error type",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Không cần wrap thủ công**, chỉ cần return data:

```typescript
@Get('users')
findAll() {
  return this.usersService.findAll();
  // Tự động wrap thành { success: true, data: [...], timestamp: '...' }
}
```

---

## 4. Interfaces

**File:** `src/common/interfaces/request.interface.ts`

### JwtPayload

```typescript
import type { JwtPayload } from '../common/interfaces';

// Sử dụng
function processUser(payload: JwtPayload) {
  console.log(payload.sub); // User ID
  console.log(payload.email); // User email
  console.log(payload.role); // User role
}
```

### RequestWithUser

Extended Express Request với user info:

```typescript
import type { RequestWithUser } from '../common/interfaces';

// Sử dụng trong middleware hoặc guard
function myMiddleware(req: RequestWithUser, res: Response, next: NextFunction) {
  if (req.user) {
    console.log('User ID:', req.user.sub);
  }
  next();
}
```

---

## 5. Filters

### GlobalExceptionFilter

Xử lý tất cả exceptions và format error response.

**File:** `src/common/filters/global-exception.filter.ts`

**Đã được đăng ký global trong `main.ts`**, không cần cấu hình thêm.

**Error response format:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users"
}
```

**Validation errors:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

---

## 6. Interceptors

### TransformResponseInterceptor

Tự động wrap response data vào format chuẩn.

**File:** `src/common/interceptors/transform-response.interceptor.ts`

**Đã được đăng ký global trong `main.ts`**, không cần cấu hình thêm.

**Trước khi wrap:**

```typescript
@Get('user')
getUser() {
  return { id: 1, name: 'John' };
}
```

**Sau khi wrap:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 7. Import nhanh

Tất cả utilities đều export qua `index.ts`, có thể import gọn:

```typescript
// Decorators
import { Public, CurrentUser, Roles } from '../common/decorators';

// Guards
import { JwtAuthGuard, RolesGuard } from '../common/guards';

// DTOs
import { PaginationDto, ApiResponseDto } from '../common/dto';

// Interfaces (dùng import type để tối ưu)
import type { JwtPayload, RequestWithUser } from '../common/interfaces';

// Filters
import { GlobalExceptionFilter } from '../common/filters';

// Interceptors
import { TransformResponseInterceptor } from '../common/interceptors';
```

**Hoặc import tất cả từ common:**

```typescript
import {
  Public,
  CurrentUser,
  Roles,
  JwtAuthGuard,
  RolesGuard,
  PaginationDto,
} from '../common';
```

---

## Ví dụ tổng hợp

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public, CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { PaginationDto } from '../common/dto';
import type { JwtPayload } from '../common/interfaces';

@ApiTags('Zones')
@Controller('zones')
export class ZonesController {
  // Public route - ai cũng xem được
  @Public()
  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.zonesService.findAll(pagination);
  }

  // Protected route - cần đăng nhập
  @ApiBearerAuth()
  @Post()
  create(
    @CurrentUser('sub') userId: string,
    @Body() createZoneDto: CreateZoneDto,
  ) {
    return this.zonesService.create(userId, createZoneDto);
  }

  // Protected route - lấy full user info
  @ApiBearerAuth()
  @Get('my-zones')
  getMyZones(@CurrentUser() user: JwtPayload) {
    return this.zonesService.findByOwner(user.sub);
  }

  // Admin only route
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  forceDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.forceDelete(id);
  }
}
```
