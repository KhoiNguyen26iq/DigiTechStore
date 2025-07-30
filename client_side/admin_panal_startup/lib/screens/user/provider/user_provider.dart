import 'dart:developer';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import '../../../core/data/data_provider.dart';
import '../../../models/api_response.dart';
import '../../../models/user.dart';
import '../../../services/http_services.dart';
import '../../../utility/snack_bar_helper.dart';

class UserProvider extends ChangeNotifier {
  HttpService service = HttpService();
  final DataProvider _dataProvider;

  final addUserFormKey = GlobalKey<FormState>();
  TextEditingController userNameCtrl = TextEditingController(); // Sẽ chứa email
  TextEditingController userCtrl = TextEditingController(); // Password

  User? userForUpdate;

  UserProvider(this._dataProvider);

  // Hàm kiểm tra định dạng email
  bool isValidEmail(String email) {
    final emailRegExp = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    return emailRegExp.hasMatch(email);
  }

  // Thêm user mới
  void addUser() async {
    try {
      String email = userNameCtrl.text.trim(); // Lấy email từ TextField
      String password = userCtrl.text.trim(); // Lấy password từ TextField

      // Kiểm tra định dạng email
      if (!isValidEmail(email)) {
        SnackBarHelper.showErrorSnackBar('Email không hợp lệ. Vui lòng nhập đúng định dạng email!');
        return;
      }

      // Kiểm tra độ dài password
      if (password.length < 6) {
        SnackBarHelper.showErrorSnackBar('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }

      Map<String, dynamic> user = {
        'name': email, // Gửi email qua field name để tương thích với API
        'password': password,
      };

      final response = await service.addItem(endpointUrl: 'users/register', itemData: user);
      
      if (response.isOk) {
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true) {
          clearFields();
          SnackBarHelper.showSuccessSnackBar('${apiResponse.message}');
          _dataProvider.getAllUser();
          log('Thêm user thành công!');
        } else {
          SnackBarHelper.showErrorSnackBar('Thêm thất bại: ${apiResponse.message}');
        }
      } else {
        SnackBarHelper.showErrorSnackBar('Lỗi: ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e) {
      print('Add user error: $e');
      SnackBarHelper.showErrorSnackBar('Đã có lỗi xảy ra: $e');
      rethrow;
    }
  }

  // Cập nhật user
  void updateUser() async {
    try {
      String email = userNameCtrl.text.trim(); // Lấy email từ TextField
      String password = userCtrl.text.trim(); // Lấy password từ TextField

      // Kiểm tra định dạng email
      if (!isValidEmail(email)) {
        SnackBarHelper.showErrorSnackBar('Email không hợp lệ. Vui lòng nhập đúng định dạng email!');
        return;
      }

      // Kiểm tra độ dài password
      if (password.length < 6) {
        SnackBarHelper.showErrorSnackBar('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }

      Map<String, dynamic> user = {
        'name': email.split('@')[0], // Tên hiển thị từ phần trước @ của email
        'email': email,
        'password': password,
      };

      final response = await service.updateItem(
        endpointUrl: 'users', 
        itemData: user, 
        itemId: userForUpdate?.sId ?? ''
      );
      
      if (response.isOk) {
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true) {
          clearFields();
          SnackBarHelper.showSuccessSnackBar('${apiResponse.message}');
          _dataProvider.getAllUser();
          log('Cập nhật user thành công!');
        } else {
          SnackBarHelper.showErrorSnackBar('Cập nhật thất bại: ${apiResponse.message}');
        }
      } else {
        SnackBarHelper.showErrorSnackBar('Lỗi: ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e) {
      print('Update user error: $e');
      SnackBarHelper.showErrorSnackBar('Đã có lỗi xảy ra: $e');
    }
  }

  // Submit user (thêm mới hoặc cập nhật)
  submitUser() {
    if (userForUpdate != null) {
      updateUser();
    } else {
      addUser();
    }
  }

  // Xóa user
  deleteUser(User user) async {
    try {
      Response response = await service.deleteItem(endpointUrl: 'users', itemId: user.sId ?? '');

      if (response.isOk) {
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true) {
          SnackBarHelper.showSuccessSnackBar('Xóa thành công!');
          _dataProvider.getAllUser();
        } else {
          SnackBarHelper.showErrorSnackBar('Xóa thất bại: ${apiResponse.message}');
        }
      } else {
        SnackBarHelper.showErrorSnackBar('Error ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e) {
      print('Delete user error: $e');
      SnackBarHelper.showErrorSnackBar('Đã có lỗi xảy ra: $e');
      rethrow;
    }
  }

  // Set data cho update user
  setDataForUpdateUser(User? user) {
    if (user != null) {
      userForUpdate = user;
      userNameCtrl.text = user.email ?? ''; // Hiển thị email thay vì name
      userCtrl.text = user.password ?? '';
    } else {
      clearFields();
    }
  }

  // Clear tất cả fields
  clearFields() {
    userNameCtrl.clear();
    userCtrl.clear();
    userForUpdate = null;
  }
}