import 'package:admin/utility/extensions.dart';

import '../../../models/variant_type.dart';
import 'package:flutter/material.dart';
import '../../../utility/constants.dart';
import '../../../widgets/custom_text_field.dart';

class VariantTypeSubmitForm extends StatelessWidget {
  final VariantType? variantType;

  const VariantTypeSubmitForm({super.key, this.variantType});

  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;
    context.variantTypeProvider.setDataForUpdateVariantTYpe(variantType);
    return SingleChildScrollView(
      child: Form(
        key: context.variantTypeProvider.addVariantsTypeFormKey,
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
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: context.variantTypeProvider.variantNameCtrl,
                      labelText: 'Tên biến thể',
                      onSave: (val) {},
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Nhập tên biến thể';
                        }
                        return null;
                      },
                    ),
                  ),
                  Expanded(
                    child: CustomTextField(
                      controller: context.variantTypeProvider.variantTypeCtrl,
                      labelText: 'Biến thể',
                      onSave: (val) {},
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Nhập biến thể';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              SizedBox(height: defaultPadding * 2),
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
                      if (context.variantTypeProvider.addVariantsTypeFormKey.currentState!.validate()) {
                        context.variantTypeProvider.addVariantsTypeFormKey.currentState!.save();
                        //TODO: should complete call submitVariantType
                        context.variantTypeProvider.submitVariantType();
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

// How to show the category popup
void showAddVariantsTypeForm(BuildContext context, VariantType? variantType) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        backgroundColor: bgColor,
        title: Center(child: Text('Tạo biến thể'.toUpperCase(), style: TextStyle(color: primaryColor))),
        content: VariantTypeSubmitForm(variantType: variantType),
      );
    },
  );
}
