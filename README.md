# RoomHub — Nền Tảng Đăng Tin & Quản Lý Phòng Cho Thuê Đa Nền Tảng

RoomHub là một nền tảng tìm kiếm, đăng tin và quản lý phòng trọ/nhà cho thuê hoàn chỉnh, được xây dựng để kết nối trực tiếp chủ phòng và người đi thuê (ưu tiên đối tượng học sinh, sinh viên và người đi làm). Dự án hỗ trợ chạy mượt mà trên cả Web và thiết bị di động (Android & iOS).

## 🚀 Công Nghệ Sử Dụng

### 1. Backend
- **Core**: Node.js, Express.js.
- **Cơ sở dữ liệu**: MongoDB (Mongoose ODM).
- **Bảo mật**: CORS, Helmet (bảo vệ HTTP Headers), Express Rate Limiter (chống tấn công Brute-force và Spam API).
- **Xác thực**: JWT Authentication (Access Token hạn 15 phút, Refresh Token rotation hạn 7 ngày).
- **Tải ảnh**: Multer kết hợp Cloudinary (tự động fallback lưu cục bộ `/public/uploads` khi cấu hình sai hoặc không có API Key).

### 2. Frontend
- **Framework**: React Native Web & Native (Expo SDK 57).
- **Định tuyến**: Expo Router (Filesystem routing).
- **Quản lý trạng thái**: Zustand (Persist storage cho Auth Store).
- **Giao tiếp API**: Axios client với Interceptor tự động làm mới Token (Refresh Token Rotation).
- **Bản đồ**: Tích hợp Leaflet OpenStreetMap động (hiển thị tọa độ phòng trọ).
- **Icon**: Expo Vector Icons (Ionicons).

---

## 📁 Cấu Trúc Dự Án

```text
sinhvien/
├── backend/                  # Server Node.js / Express
│   ├── src/
│   │   ├── config/           # Cấu hình kết nối DB
│   │   ├── controllers/      # Logic nghiệp vụ các APIs
│   │   ├── middleware/       # Auth guard, rate limit, validate
│   │   ├── models/           # Định nghĩa 10 Mongoose Schemas
│   │   ├── routes/           # Định tuyến API endpoints
│   │   ├── scripts/          # Script seed dữ liệu mẫu
│   │   └── utils/            # JWT, email, upload helpers
│   └── tests/                # Bộ kiểm thử tự động Jest & Supertest
│
├── frontend/                 # Client React Native (Expo)
│   ├── src/
│   │   ├── app/              # Trang công khai, auth và dashboard
│   │   ├── components/       # Giao diện chung (Navbar, Footer, Layout)
│   │   ├── constants/        # Design system và theme màu sắc
│   │   ├── services/         # Axios API Client
│   │   └── store/            # Zustand auth state store
│
└── .github/                  # Cấu hình CI/CD GitHub Actions
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu hệ thống
- **Node.js** >= v18
- **MongoDB** đang chạy cục bộ (hoặc MongoDB Atlas URI)

### Bước 1: Cấu hình và chạy Backend

1. Di chuyển vào thư mục backend và cài đặt dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Tạo file `.env` tại thư mục `/backend` và cấu hình các biến sau:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/roomhub
   JWT_SECRET=supersecretkey123
   JWT_REFRESH_SECRET=refreshsecretkey123
   
   # Gửi email (Giả lập in ra console log)
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_user
   EMAIL_PASS=your_pass
   ```

3. Thực hiện **Seed dữ liệu mẫu** (1 admin, 10 landlords, 30 tenants, 150 phòng trọ cùng lịch sử giao dịch):
   ```bash
   npm run seed
   ```

4. Khởi chạy server development:
   ```bash
   npm start
   ```
   *Mặc định API Server sẽ chạy tại: `http://localhost:5000`*

5. Chạy bộ kiểm thử tự động backend (Jest):
   ```bash
   npm test
   ```

### Bước 2: Cấu hình và chạy Frontend

1. Di chuyển vào thư mục frontend và cài đặt dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

2. Khởi chạy ứng dụng bằng Expo ở chế độ Web:
   ```bash
   npm run web
   ```
   *Hoặc chạy lệnh đa nền tảng:*
   ```bash
   npx expo start
   ```
   *Bấm `w` để mở giao diện Web, bấm `a` cho Android emulator, hoặc quét QR Code để chạy trên app Expo Go điện thoại.*

---

## 🔑 Tài Khoản Thử Nghiệm (Demo Credentials)

Sau khi chạy lệnh `npm run seed`, bạn có thể dùng các tài khoản mẫu sau để kiểm thử hệ thống:

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng thử nghiệm |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@roomhub.vn` | `Admin@123456` | Khóa/Mở khóa tài khoản, Phê duyệt phòng trọ mới, Xem khiếu nại báo cáo vi phạm, Cấu hình loại phòng/tiện ích |
| **Chủ nhà (Landlord)** | `landlord01@roomhub.vn` <br>*(hoặc từ landlord02 đến landlord10)* | `Landlord@123456` | Thống kê lượt xem bài đăng, Ẩn/Hiện bài trọ, Đăng tin mới (biểu mẫu 5 bước), Chấp nhận/Từ chối xem phòng |
| **Người thuê (Tenant)** | `tenant01@roomhub.vn` <br>*(hoặc từ tenant02 đến tenant30)* | `Tenant@123456` | Tìm trọ nâng cao, Đăng ký yêu thích, Gửi yêu cầu xem phòng, Báo cáo vi phạm, Nhận thông báo thời gian thực |

---

## 🛡️ Các Tính Năng Bảo Mật & Kỹ Thuật Nổi Bật

1. **Token Rotation & Session Protection**: Access token tồn tại trong 15 phút, refresh token lưu ở cookie/storage trong 7 ngày. Khi access token hết hạn, Axios Interceptor tự động gửi request lấy cặp token mới mà không làm gián đoạn người dùng.
2. **Brute Force Lock**: Nhập sai mật khẩu liên tiếp 5 lần sẽ khóa tài khoản trong vòng 30 phút nhằm ngăn chặn dò quét mật khẩu.
3. **Map Integration**: Không sử dụng các thư viện React wrapper nặng nề, RoomHub sử dụng cơ chế nhúng CDN Leaflet.js tự động vào DOM giúp tối ưu hiệu năng hiển thị bản đồ địa lý phòng trọ ở phiên bản Web.
4. **Offline Fallback Uploader**: Khi Cloudinary chưa cấu hình hoặc bị lỗi mạng, hệ thống tự động chuyển hướng lưu trữ cục bộ tại máy chủ backend, tạo tính độc lập cao khi demo offline.
