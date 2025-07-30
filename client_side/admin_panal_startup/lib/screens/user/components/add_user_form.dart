import 'package:admin/utility/extensions.dart';
import '../../../models/user.dart';
import 'package:flutter/material.dart';
import '../../../utility/constants.dart';
import '../../../widgets/custom_text_field.dart';

class UserSubmitForm extends StatelessWidget {
  final User? user;

  const UserSubmitForm({super.key, this.user});

  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;
    context.userProvider.setDataForUpdateUser(user);
    
    return SingleChildScrollView(
      child: Form(
        key: context.userProvider.addUserFormKey,
        child: Container(
          padding: EdgeInsets.all(defaultPadding),
          width: size.width * 0.5,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(height: defaultPadding),
              
              // Email field
              CustomTextField(
                controller: context.userProvider.userNameCtrl,
                labelText: 'Email',
                inputType: TextInputType.emailAddress,
                onSave: (val) {},
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Hãy nhập email';
                  }
                  // Kiểm tra format email
                  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                  if (!emailRegex.hasMatch(value)) {
                    return 'Email không hợp lệ';
                  }
                  return null;
                },
              ),
              
              SizedBox(height: defaultPadding),
              
              // Password field
              CustomTextField(
                controller: context.userProvider.userCtrl,
                labelText: 'Mật khẩu',
                onSave: (val) {},
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Hãy nhập mật khẩu';
                  }
                  if (value.length < 6) {
                    return 'Mật khẩu phải có ít nhất 6 ký tự';
                  }
                  return null;
                },
              ),
              
              SizedBox(height: defaultPadding * 2),
              
              // Action buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: secondaryColor,
                    ),
                    onPressed: () {
                      Navigator.of(context).pop(); // Close the popup
                    },
                    child: Text('Huỷ'),
                  ),
                  SizedBox(width: defaultPadding),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: primaryColor,
                    ),
                    onPressed: () {
                      // Validate and save the form
                      if (context.userProvider.addUserFormKey.currentState!.validate()) {
                        context.userProvider.addUserFormKey.currentState!.save();
                        context.userProvider.submitUser();
                        Navigator.of(context).pop();
                      }
                    },
                    child: Text('Xác nhận'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// How to show the user popup
void showAddUserForm(BuildContext context, User? user) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        backgroundColor: bgColor,
        title: Center(
          child: Text(
            (user != null ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản').toUpperCase(), 
            style: TextStyle(color: primaryColor)
          )
        ),
        content: UserSubmitForm(user: user),
      );
    },
  );
}