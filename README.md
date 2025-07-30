# DIGITECH - Ứng dụng di động bán hàng điện tử

## Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Tính năng](#tính-năng)
3. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
4. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
5. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
6. [Cài đặt & Khởi động](#cài-đặt--khởi-động)
7. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
8. [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
9. [Chạy ứng dụng](#chạy-ứng-dụng)
10. [Kiểm thử](#kiểm-thử)
11. [Đóng góp](#đóng-góp)
12. [Giấy phép](#giấy-phép)

---

## Giới thiệu

DIGITECH là ứng dụng di động bán hàng điện tử được xây dựng trên nền tảng Flutter, cho phép người dùng duyệt sản phẩm, thêm vào giỏ hàng, đặt hàng và thanh toán trực tiếp qua điện thoại. Ứng dụng hỗ trợ cả Android và iOS, thiết kế UI/UX hiện đại, tối ưu trải nghiệm mua sắm.

---

## Tính năng

* **Đăng ký/Đăng nhập**: Email/password, OTP điện thoại.
* **Xác thực hai yếu tố (2FA)**.
* **Duyệt & Tìm kiếm sản phẩm**: Theo danh mục, từ khóa.
* **Chi tiết sản phẩm**: Hình ảnh, mô tả, đánh giá.
* **Giỏ hàng**: Thêm/xóa/sửa số lượng sản phẩm.
* **Đặt hàng & Thanh toán**: Hỗ trợ MoMo, thẻ tín dụng, ví điện tử.
* **Lịch sử đơn hàng**: Theo dõi trạng thái đơn.
* **Yêu thích (Favorites)**: Lưu sản phẩm quan tâm.
* **Thông báo đẩy (Push Notifications)**.
* **Quản lý hồ sơ người dùng**: Cập nhật thông tin, avatar.
* **Chế độ Dark/Light**.

---

## Kiến trúc tổng quan

Ứng dụng tuân thủ mô hình **MVVM** kết hợp **Provider** (hoặc **GetX**):

1. **Models**: Định nghĩa cấu trúc dữ liệu (Product, User, Order, Category).
2. **ViewModel/Provider**: Logic xử lý, gọi API, quản lý state.
3. **Views (Screens & Widgets)**: Giao diện người dùng.
4. **Services**: Lớp giao tiếp REST API, local storage (SharedPreferences).

---

## Công nghệ sử dụng

* **Ngôn ngữ**: Dart
* **Framework**: Flutter >= 3.x
* **Quản lý state**: Provider / GetX
* **HTTP & API**: `dio` hoặc `http`
* **Local Storage**: `shared_preferences`, `hive`
* **Push Notification**: Firebase Messaging / OneSignal
* **Thanh toán**: MoMo SDK / Stripe
* **Quản lý môi trường**: `flutter_dotenv`
* **Quản lý routes**: `go_router` hoặc `auto_route`

---

## Yêu cầu hệ thống

* Flutter SDK >= 3.0
* Dart SDK >= 2.18
* Xcode 13+ (iOS)
* Android Studio / Android SDK 30+
* CocoaPods (iOS)

---

## Cài đặt & Khởi động

1. **Clone repository**

   ```bash
   git clone https://github.com/your-username/digitech_mobile.git
   cd digitech_mobile
   ```
2. **Cài đặt dependencies**

   ```bash
   flutter pub get
   ```
3. **Cài đặt Pods (iOS)**

   ```bash
   cd ios && pod install && cd ..
   ```
4. **Tạo file cấu hình**

   * Copy `.env.example` thành `.env` và điền API\_KEY, baseURL, etc.

---

## Cấu trúc thư mục

```
digitech_mobile/
├─ android/              # Android project
├─ ios/                  # iOS project
├─ lib/
│  ├─ main.dart          # Entry point
│  ├─ models/            # Định nghĩa dữ liệu
│  ├─ providers/         # Business logic & state
│  ├─ services/          # API, local storage
│  ├─ views/             # Screens & Widgets
│  ├─ routes/            # Định nghĩa route
│  ├─ utils/             # Hàm tiện ích
│  └─ theme/             # Theme light & dark
├─ test/                 # Unit & widget tests
├─ .env.example          # Mẫu biến môi trường
└─ pubspec.yaml
```

---

## Cấu hình biến môi trường

Tạo file `.env` tại root với nội dung:

```
API_BASE_URL=https://api.digitech.com
API_KEY=YOUR_API_KEY_HERE
ONESIGNAL_APP_ID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
```

---

## Chạy ứng dụng

* **Android**:

  ```bash
  flutter run -d android
  ```
* **iOS** (trên macOS):

  ```bash
  flutter run -d ios
  ```
* **Web**: (nếu hỗ trợ web)

  ```bash
  flutter run -d chrome
  ```

---

## Kiểm thử

* Unit tests:

  ```bash
  flutter test test/unit
  ```
* Widget tests:

  ```bash
  flutter test test/widget
  ```
* Sử dụng `flutter test` để chạy tất cả.

---

## Đóng góp

Mọi đóng góp (issue, pull request) đều được hoan nghênh! Vui lòng xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết chi tiết.

---

## Giấy phép

Distributed under the MIT License. Xem [LICENSE](LICENSE) để biết chi tiết.
