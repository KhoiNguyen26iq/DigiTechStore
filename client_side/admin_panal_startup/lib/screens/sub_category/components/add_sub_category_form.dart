import '../../../models/sub_category.dart';
import '../provider/sub_category_provider.dart';
import '../../../utility/extensions.dart';
import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:provider/provider.dart';
import '../../../models/category.dart';
import '../../../utility/constants.dart';
import '../../../widgets/custom_dropdown.dart';
import '../../../widgets/custom_text_field.dart';

class SubCategorySubmitForm extends StatelessWidget {
  final SubCategory? subCategory;

  const SubCategorySubmitForm({super.key, this.subCategory});

  @override
  Widget build(BuildContext context) {
    context.subCategoryProvider.setDataForUpdateCategory(subCategory);
    var size = MediaQuery.of(context).size;
    return SingleChildScrollView(
      child: Form(
        key: context.subCategoryProvider.addSubCategoryFormKey,
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
              Gap(defaultPadding),
              Row(
                children: [
                  Expanded(
                    child: Consumer<SubCategoryProvider>(
                      builder: (context, subCatProvider, child) {
                        return CustomDropdown(
                          initialValue: subCatProvider.selectedCategory,
                          hintText: subCatProvider.selectedCategory?.name ?? 'Chọn Phân loại',
                          items: context.dataProvider.categories,
                          displayItem: (Category? category) => category?.name ?? '',
                          onChanged: (newValue) {
                            if (newValue != null) {
                              subCatProvider.selectedCategory = newValue;
                              subCatProvider.updateUi();
                            }
                          },
                          validator: (value) {
                            if (value == null) {
                              return 'Chọn loại sản phẩm';
                            }
                            return null;
                          },
                        );
                      },
                    ),
                  ),
                  Expanded(
                    child: CustomTextField(
                      controller: context.subCategoryProvider.subCategoryNameCtrl,
                      labelText: 'Tên sản phẩm',
                      onSave: (val) {},
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Nhập tên sản phẩm';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              Gap(defaultPadding * 2),
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
                  Gap(defaultPadding),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: primaryColor,
                    ),
                    onPressed: () {
                      // Validate and save the form
                      if (context.subCategoryProvider.addSubCategoryFormKey.currentState!.validate()) {
                        context.subCategoryProvider.addSubCategoryFormKey.currentState!.save();
                        // TODO:should complete call submitSubCategory
                        context.subCategoryProvider.submitSubCategory();
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
void showAddSubCategoryForm(BuildContext context, SubCategory? subCategory) {
  showDialog(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        backgroundColor: bgColor,
        title: Center(child: Text('Tạo sản phẩm'.toUpperCase(), style: TextStyle(color: primaryColor))),
        content: SubCategorySubmitForm(subCategory: subCategory),
      );
    },
  );
}
