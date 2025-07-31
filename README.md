---
title: "DigiTechStore"
description: "README cho dự án DigiTechStore"
---

## 📖 Mục lục

* [Tổng quan](#tổng-quan)
* [Tính năng chính](#tính-năng-chính)
* [Công nghệ & Kiến trúc](#công-nghệ--kiến-trúc)
* [Yêu cầu](#yêu-cầu)
* [Cài đặt & Chạy thử](#cài-đặt--chạy-thử)
* [Cấu trúc dự án](#cấu-trúc-dự-án)
* [Biến môi trường](#biến-môi-trường)
* [Ảnh màn hình](#ảnh-màn-hình)
* [Kiểm thử](#kiểm-thử)
* [Đóng góp](#đóng-góp)
* [Giấy phép](#giấy-phép)

---

## 📝 Tổng quan

DigiTechStore là ứng dụng di động bán hàng điện tử, hỗ trợ:

* Truy cập nhanh vào danh mục sản phẩm, tìm kiếm nâng cao.
* Quản lý giỏ hàng, đặt hàng và thanh toán tích hợp MoMo/Stripe.
* Xem lịch sử đơn hàng và trạng thái giao hàng thời gian thực.
* Thông báo đẩy về khuyến mãi, trạng thái đơn.
* Chế độ người dùng/Quản trị viên với các quyền riêng biệt.

Ứng dụng xây dựng trên Flutter, tương thích Android & iOS với trải nghiệm mượt mà.

---

## 🚀 Tính năng chính

| Phân hệ              | Tính năng                                                          |
| -------------------- | ------------------------------------------------------------------ |
| **Xác thực**         | Đăng ký/Đăng nhập (Email/OTP), 2FA, Quên mật khẩu                  |
| **Sản phẩm**         | Duyệt theo danh mục, Tìm kiếm, Bộ lọc, Đánh giá, Yêu thích         |
| **Giỏ hàng**         | Thêm/Xóa/Sửa số lượng, Cập nhật tức thì                            |
| **Thanh toán**       | Tích hợp MoMo SDK, Stripe, Xác nhận qua OTP                        |
| **Đơn hàng**         | Xem chi tiết, Theo dõi trạng thái, Lịch sử, Hủy đơn                |
| **Thông báo**        | Push Notifications (Firebase / OneSignal)                          |
| **Hồ sơ người dùng** | Cập nhật thông tin cá nhân, Ảnh đại diện, Đổi mật khẩu             |
| **Giao diện**        | Chế độ sáng/tối tự động, Responsive trên nhiều kích thước màn hình |

---

## 🛠️ Công nghệ & Kiến trúc

* **Ngôn ngữ & Framework**: Dart, Flutter (>=3.x)
* **State Management**: Provider / GetX
* **HTTP & API**: Dio
* **Local Storage**: Hive, Shared Preferences
* **Authentication**: Firebase Auth, JWT
* **Push Notification**: Firebase Messaging, OneSignal
* **Payment**: MoMo SDK, Stripe API
* **Tạo route**: GoRouter
* **Quản lý môi trường**: flutter\_dotenv

Ứng dụng tuân thủ pattern **MVVM**:

1. **Model**: Định nghĩa cấu trúc dữ liệu (User, Product, Order, Category).
2. **ViewModel/Provider**: Xử lý logic, gọi API, quản lý state.
3. **View (Widget)**: Hiển thị UI, lắng nghe state từ ViewModel.
4. **Service**: Interface đến API, xử lý local storage, push notification.

---

## 📋 Yêu cầu

* Flutter SDK >= **3.0**
* Dart SDK >= **2.18**
* Android Studio / Xcode (phiên bản mới nhất)
* Node.js & npm (nếu backend đi kèm)
* CocoaPods (macOS cho iOS)

---

## 🏁 Cài đặt & Chạy thử

```bash
# Clone repo
git clone https://github.com/KhoiNguyen26iq/DigiTechStore.git
cd DigiTechStore

# Cài đặt dependencies Flutter
flutter pub get

# Khởi tạo iOS pods (nếu trên macOS)
cd ios && pod install && cd ..

# Sao chép file env
cp .env.example .env
# Điền biến trong .env (API_URL, KEYS,...)

# Chạy app Android
e flutter run -d android

# Chạy app iOS
e flutter run -d ios
```

---

## 📂 Cấu trúc dự án

Dưới đây là cấu trúc thư mục chính của repository **DigiTechStore**, phản ánh tổ chức rõ ràng giữa frontend Flutter và backend Node.js:

```
DigiTechStore/                     # Root repository
├─ .vscode/                        # Cấu hình VSCode (settings, extensions)
├─ client_side/                    # Mã nguồn ứng dụng Flutter
│   └─ flutter_ecommerce_start/    # Flutter project
│      ├─ android/                 # Android native project
│      ├─ ios/                     # iOS native project
│      ├─ lib/                     # Mã nguồn Dart chính
│      │  ├─ main.dart             # Entry point của ứng dụng
│      │  ├─ models/               # Định nghĩa các lớp dữ liệu (Product, User, Order,...)
│      │  ├─ providers/            # ViewModel / Provider / GetX
│      │  ├─ services/             # Giao tiếp API, local storage, notification
│      │  ├─ views/                # Screens & Widgets
│      │  ├─ routes/               # Cấu hình điều hướng (GoRouter)
│      │  ├─ utils/                # Các hàm tiện ích, extensions
│      │  └─ theme/                # Theme light & dark, styling
│      ├─ assets/                  # Hình ảnh, icons, fonts, animations
│      ├─ test/                    # Unit & Widget tests
│      ├─ pubspec.yaml             # Khai báo dependencies của Flutter
│      └─ .env.example             # Mẫu biến môi trường (API keys, URLs)
├─ server_side/                    # Mã nguồn backend Node.js + Express
│   └─ online_store_api/           # Project RESTful API
│      ├─ controllers/             # Xử lý logic cho các route
│      ├─ routes/                  # Định nghĩa endpoint (users, products, orders,...)
│      ├─ models/                  # Schema Mongoose (MongoDB)
│      ├─ utils/                   # Middleware, helpers, cấu hình chung
│      ├─ .env.example             # Mẫu biến môi trường cho backend
│      ├─ index.js                 # Entry point khởi tạo server
│      ├─ package.json             # Khai báo dependencies Node.js
│      └─ README.md                # Hướng dẫn backend riêng (nếu có)
├─ .gitignore                      # Quy định file/thư mục không track bởi Git
├─ README.md                       # Tài liệu hướng dẫn tổng quan dự án
└─ .DS_Store                       # Metadata macOS (nên thêm vào .gitignore)
```

## 🔧 Biến môi trường

Các biến trong file `.env`:

```
API_BASE_URL=https://api.digitechstore.com
API_KEY=YOUR_API_KEY
ONESIGNAL_APP_ID=XXXX-XXXX
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
```

---

## 📸 Ảnh màn hình

---

## ✅ Kiểm thử

* **Unit Tests**:

  ```bash
  flutter test test/unit
  ```
* **Widget Tests**:

  ```bash
  flutter test test/widget
  ```
* **Integration Tests** (nếu có):

  ```bash
  flutter drive --target=test_driver/app.dart
  ```

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo branch `feature/your-feature`
3. Commit và push lên branch của bạn
4. Tạo Pull Request trên GitHub

Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết quy tắc code style, commit message.

---

## 📄 Giấy phép

Distributed under the **MIT License**. Xem chi tiết trong [LICENSE](LICENSE).
