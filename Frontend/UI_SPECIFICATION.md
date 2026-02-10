# GameZone - UI Specification

Dựa trên **Development Plan** và **Prisma Schema**, tài liệu này chi tiết hóa cấu trúc giao diện và trải nghiệm người dùng (UX) cho ứng dụng GameZone.

---

## 🎨 Design System (UI UX Pro Max)

- **Style:** **Cyberpunk UI / Modern Dark Mode**
  - Sử dụng các góc bo tròn vừa phải (8-12dp).
  - Hiệu ứng đổ bóng neon nhẹ cho các nút quan trọng.
  - Phân tầng giao diện bằng các dải màu Gradient tối.
- **Color Palette:** **Gaming Night**
  - **Background:** `#0F0C29` (Deep Blue/Black)
  - **Surface:** `#1B1B2F` (Dark Navy)
  - **Primary (Action):** `#E94560` (Vibrant Pink/Red)
  - **Secondary:** `#0F3460` (Royal Blue)
  - **Accent:** `#22D1EE` (Cyan)
- **Typography:**
  - **Headings:** `Rajdhani` hoặc `Orbitron` (Gaming feel).
  - **Body:** `Montserrat` hoặc `Inter` (Dễ đọc).

---

## 📱 Cấu trúc màn hình Mobile (React Native)

### 1. Nhóm Auth (Authentication)
- **Màn hình Welcome:** Video background hoặc hình ảnh game ấn tượng, nút Login/Register.
- **Login Screen:** Input Email/Username, Password. Hỗ trợ "Remember me".
- **Register Screen:** Các bước nhập thông tin cơ bản: Email, Username, Password, Confirm Password.

### 2. Nhóm Main (Bottom Tab Navigation)
- **Tab 1: Home (Lobby/Zones)**
  - Danh sách các "Zone" đang mở.
  - Bộ lọc nhanh theo Game (Horizontal Scroll).
  - Thanh tìm kiếm và nút "Create Zone" (Floating Action Button).
- **Tab 2: Discover (Games)**
  - Danh sách các Game hỗ trợ trên hệ thống.
  - Khi click vào game: Xem các Zone thuộc game đó và Rank Profile của bản thân trong game đó.
- **Tab 3: Groups (My Squads)**
  - Danh sách các nhóm đã ghép thành công.
  - Hiển thị tin nhắn mới nhất và số lượng thông báo chưa đọc.
- **Tab 4: Notifications**
  - Danh sách yêu cầu tham gia (Join Requests), thông báo ghép nhóm thành công, tin nhắn mới.
- **Tab 5: Profile**
  - Thông tin cá nhân, Avatar, Bio, PlayStyle.
  - Danh sách Game Rank Profiles.
  - Nút Settings & Logout.

### 3. Nhóm Chi tiết & Chức năng (Stack Navigation)
- **Zone Details:**
  - Thông tin chủ Zone, mô tả, yêu cầu Rank.
  - Danh sách người đang chờ/đã tham gia.
  - Nút "Request to Join".
- **Create Zone Screen:**
  - Form chọn Game, nhập Title, Description.
  - Slider chọn Min/Max Rank Level.
  - Input số lượng người cần (Required Players).
  - Tags selection (e.g., #Competitive, #Chill, #MicOn).
- **Chat Room (Real-time):**
  - Giao diện chat nhóm.
  - Thông tin thành viên trong nhóm.
  - Hiển thị Contact Method (Discord ID, In-game ID) của các thành viên.
- **Edit Profile:** Cập nhật Avatar, Bio, và quản lý Game Ranks.

---

## ✨ Trải nghiệm người dùng (UX) Đặc sắc

1.  **Hệ thống Rank Visual:** Mỗi Rank (BEGINNER -> PRO) sẽ có một Badge (huy hiệu) màu sắc riêng biệt để dễ nhận diện.
2.  **Real-time Feedback:** Khi có người gửi yêu cầu Join Zone, chủ Zone nhận được thông báo đẩy (Push) và Badge thông báo cập nhật ngay lập tức.
3.  **Quick Action:** Vuốt sang trái trên một Zone ở màn hình Home để xem nhanh yêu cầu Rank mà không cần vào chi tiết.
4.  **Empty States:** Các hình minh họa (Illustrations) phong cách gaming khi không có dữ liệu (ví dụ: "No zones found, create one!").

---

## 🛠 Tech Stack Mobile

- **Framework:** React Native.
- **Language:** TypeScript.
- **State Management:** TanStack Query + Zustand.
- **Navigation:** React Navigation.
- **Styling:** NativeWind (Tailwind CSS).
- **Real-time:** Socket.io-client.

---

## 🖥️ Web Admin Dashboard (React TS)

Dành cho quản trị viên hệ thống để kiểm soát nội dung và người dùng.

### 1. Overview (Dashboard)
- Biểu đồ thống kê: Lượng user đăng ký mới, số lượng Zone tạo theo ngày.
- Widget tóm tắt: Tổng số Report đang chờ, số lượng User bị Ban, số lượng Game hiện có.

### 2. User Management
- Danh sách toàn bộ người dùng (Table with Pagination/Search).
- Action: Ban/Unban user, thay đổi Role (Admin/User).

### 3. Game Management
- Danh sách Game hệ thống hỗ trợ.
- Chức năng: Thêm game mới (Upload Banner/Icon), chỉnh sửa thông tin game, ẩn/hiện game.

### 4. Moderation & Reports
- Quản lý các Zone đang OPEN/CLOSED.
- Danh sách báo cáo vi phạm (Target: User, Zone, Group).
- Action: Xử lý vi phạm trực tiếp từ báo cáo.

---

## 🛠 Web Tech Stack Recommendations

- **Framework:** React + Vite.
- **UI Library:** Ant Design hoặc Shadcn/UI.
- **State Management:** TanStack Query + Zustand.
