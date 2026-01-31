# Command Reference - Khi nào dùng lệnh nào?

Bảng tra cứu nhanh các lệnh trong PlayZone Backend và khi nào sử dụng.

---

## 🚀 Khởi động Project

| Lệnh                                 | Khi nào dùng?         | Mô tả nhanh                          |
| ------------------------------------ | --------------------- | ------------------------------------ |
| `npm run start:dev`                  | **Mỗi ngày khi code** | Chạy local, auto-reload khi sửa code |
| `npm run start`                      | **Production**        | Chạy 1 lần, không reload             |
| `npm run start:debug`                | **Khi debug**         | Có debugger attach được              |
| `docker-compose --profile dev up -d` | **Chạy full Docker**  | App + DB trong container             |
| `docker-compose up -d postgres`      | **Chỉ cần DB**        | Chạy PostgreSQL, app chạy local      |

**💡 Quy tắc:**

- Đang phát triển → `npm run start:dev` + `docker-compose up -d postgres`
- Test production build → `docker-compose --profile dev up -d`
- Server production thật → `npm run start:prod`

---

## 🗄️ Database & Prisma

| Lệnh                        | Khi nào dùng?                 | Lưu ý                                 |
| --------------------------- | ----------------------------- | ------------------------------------- |
| `npx prisma generate`       | **Sau khi sửa schema.prisma** | Tạo TypeScript types                  |
| `npx prisma migrate dev`    | **Thêm/sửa/xóa table**        | Tạo migration file, dùng cho dev      |
| `npx prisma migrate deploy` | **Production**                | Chạy migration đã có, không tạo mới   |
| `npx prisma db push`        | **Prototype nhanh**           | Sync schema ngay, không tạo migration |
| `npx prisma studio`         | **Xem/sửa data**              | Mở UI xem database                    |
| `npx prisma migrate reset`  | **Làm lại từ đầu**            | Xóa DB, chạy lại migration            |

**💡 Quy tắc:**

- Mới thêm field/table → `migrate dev`
- Đang prototype, chưa cần lưu migration → `db push`
- Production deploy → `migrate deploy`
- Xóa DB làm lại → `migrate reset`

---

## 🐳 Docker Commands

| Lệnh                                            | Khi nào dùng?              | Kết quả                      |
| ----------------------------------------------- | -------------------------- | ---------------------------- |
| `docker-compose up -d postgres`                 | **Chỉ cần database**       | Chạy PostgreSQL container    |
| `docker-compose --profile dev up -d`            | **Chạy full stack**        | App + DB containers          |
| `docker-compose --profile dev up -d --build`    | **Sau khi sửa Dockerfile** | Build lại image rồi chạy     |
| `docker-compose down`                           | **Dừng hết**               | Tắt tất cả containers        |
| `docker-compose down -v`                        | **Dừng + xóa DB**          | Tắt và xóa volume (mất data) |
| `docker-compose logs -f app`                    | **Xem lỗi app**            | Theo dõi log real-time       |
| `docker-compose logs -f postgres`               | **Xem lỗi DB**             | Theo dõi log PostgreSQL      |
| `docker-compose ps`                             | **Kiểm tra status**        | Xem container nào đang chạy  |
| `docker-compose exec postgres psql -U postgres` | **Truy cập DB trực tiếp**  | Vào PostgreSQL CLI           |

**💡 Quy tắc:**

- Mới clone project → `docker-compose up -d postgres`
- Sửa code xong test → Không cần restart Docker (vì app chạy local)
- Sửa Dockerfile → `docker-compose --profile dev up -d --build`
- DB bị lỗi → `docker-compose down -v` rồi `up -d postgres` (mất data)

---

## 🔨 Build & Deploy

| Lệnh                                  | Khi nào dùng?         | Output               |
| ------------------------------------- | --------------------- | -------------------- |
| `npm run build`                       | **Trước khi deploy**  | Tạo thư mục `dist/`  |
| `npm run start:prod`                  | **Production server** | Chạy từ `dist/main`  |
| `docker-compose --profile prod up -d` | **Production Docker** | Chạy optimized build |

**💡 Quy tắc:**

- Deploy lên server → `npm run build` rồi `npm run start:prod`
- Deploy bằng Docker → `docker-compose --profile prod up -d`

---

## 🧪 Testing & Quality

| Lệnh                    | Khi nào dùng?         | Mục đích                   |
| ----------------------- | --------------------- | -------------------------- |
| `npm run test`          | **Sau khi sửa logic** | Chạy unit tests            |
| `npm run test:watch`    | **Khi viết test**     | Auto chạy lại khi sửa test |
| `npm run test:e2e`      | **Trước khi merge**   | Test end-to-end            |
| `npm run test:cov`      | **Kiểm tra coverage** | Xem % code được test       |
| `npm run lint`          | **Trước khi commit**  | Kiểm tra code style        |
| `npm run lint -- --fix` | **Tự động sửa lỗi**   | Sửa auto-fixable issues    |
| `npm run format`        | **Trước khi commit**  | Format code với Prettier   |

**💡 Quy tắc:**

- Sửa xong 1 feature → `npm run test`
- Chuẩn bị commit → `npm run lint` và `npm run format`
- Trước khi merge PR → `npm run test:e2e`

---

## 📦 Package Management

| Lệnh                       | Khi nào dùng?           | Ví dụ                          |
| -------------------------- | ----------------------- | ------------------------------ |
| `npm install`              | **Mới clone project**   | Cài tất cả dependencies        |
| `npm install <package>`    | **Thêm thư viện mới**   | `npm install bcrypt`           |
| `npm install -D <package>` | **Thêm dev dependency** | `npm install -D @types/node`   |
| `npm uninstall <package>`  | **Xóa thư viện**        | `npm uninstall unused-package` |
| `npm update`               | **Cập nhật packages**   | Update lên version mới nhất    |
| `npm audit`                | **Kiểm tra bảo mật**    | Xem vulnerabilities            |
| `npm audit fix`            | **Sửa lỗi bảo mật**     | Tự động fix nếu được           |

**💡 Quy tắc:**

- Mới clone → `npm install`
- Thêm thư viện production → `npm install <package>`
- Thêm thư viện dev (types, testing) → `npm install -D <package>`

---

## 🔄 Git Workflow

| Lệnh                              | Khi nào dùng?             |
| --------------------------------- | ------------------------- |
| `git add .`                       | **Sau khi sửa code**      |
| `git commit -m "feat: add login"` | **Sau khi add**           |
| `git push origin main`            | **Sau khi commit**        |
| `git pull origin main`            | **Trước khi code mới**    |
| `git checkout -b feature/xyz`     | **Bắt đầu feature mới**   |
| `git merge main`                  | **Merge main vào branch** |

---

## 🎯 Workflow Scenarios

### Scenario 1: Bắt đầu ngày làm việc

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Cài dependencies nếu có thay đổi
npm install

# 3. Khởi động DB
docker-compose up -d postgres

# 4. Chạy app
npm run start:dev

# 5. Mở Swagger test
# http://localhost:3000/api/docs
```

### Scenario 2: Thêm tính năng mới (cần thêm DB table)

```bash
# 1. Sửa schema.prisma

# 2. Generate types
npx prisma generate

# 3. Tạo migration
npx prisma migrate dev --name add_user_profile

# 4. Code tính năng

# 5. Test
npm run test

# 6. Lint & format
npm run lint
npm run format

# 7. Commit
git add .
git commit -m "feat: add user profile"
```

### Scenario 3: Sửa nhanh không cần migration

```bash
# 1. Sửa code

# 2. Test nhanh
npm run test

# 3. Commit
git add .
git commit -m "fix: correct validation message"
```

### Scenario 4: Deploy Production

```bash
# 1. Test local
npm run test:e2e

# 2. Build
npm run build

# 3. Chạy production
npm run start:prod

# Hoặc dùng Docker
docker-compose --profile prod up -d
```

### Scenario 5: DB bị lỗi, cần làm lại

```bash
# 1. Dừng và xóa DB
docker-compose down -v

# 2. Khởi động lại DB
docker-compose up -d postgres

# 3. Chạy migration
npx prisma migrate dev

# 4. (Optional) Seed data nếu có
# npx prisma db seed
```

### Scenario 6: Thêm thư viện mới

```bash
# 1. Cài thư viện
npm install @nestjs/config

# 2. Nếu cần types
npm install -D @types/express

# 3. Test vẫn chạy được
npm run build

# 4. Commit
git add package.json package-lock.json
git commit -m "chore: add @nestjs/config"
```

---

## ⚡ Cheat Sheet - Lệnh thường dùng nhất

```bash
# Hàng ngày
git pull origin main
docker-compose up -d postgres
npm run start:dev

# Sau khi sửa schema.prisma
npx prisma generate
npx prisma migrate dev

# Trước khi commit
npm run lint
npm run format
npm run test

# Production
npm run build
npm run start:prod
```

---

## ❓ FAQ - Câu hỏi thường gặp

**Q: `migrate dev` vs `db push` khác gì?**
A: `migrate dev` tạo file migration (dùng cho production), `db push` sync ngay không tạo file (chỉ dùng cho dev).

**Q: Tại sao `npm run start:dev` không cần `build`?**
A: Vì `start:dev` dùng ts-node chạy trực tiếp TypeScript, không cần compile ra JavaScript.

**Q: Khi nào cần `docker-compose down -v`?**
A: Khi DB bị lỗi, hoặc muốn xóa hết data test làm lại từ đầu.

**Q: `npm install` vs `npm ci` khác gì?**
A: `npm install` cài theo package.json (có thể update version), `npm ci` cài chính xác theo package-lock.json (dùng cho CI/CD).

**Q: Tại sao đôi khi phải chạy `npx prisma generate`?**
A: Khi sửa schema.prisma, cần generate lại để TypeScript biết về các thay đổi.
