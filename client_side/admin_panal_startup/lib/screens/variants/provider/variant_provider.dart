import 'dart:developer';

import '../../../models/variant_type.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import '../../../core/data/data_provider.dart';
import '../../../models/api_response.dart';
import '../../../models/variant.dart';
import '../../../services/http_services.dart';
import '../../../utility/snack_bar_helper.dart';

class VariantsProvider extends ChangeNotifier {
  HttpService service = HttpService();
  final DataProvider _dataProvider;
  final addVariantsFormKey = GlobalKey<FormState>();
  TextEditingController variantCtrl = TextEditingController();
  VariantType? selectedVariantType;
  Variant? variantForUpdate;




  VariantsProvider(this._dataProvider);


  //TODO: should complete addVariant
  addVariant() async{
    try {
      Map<String ,dynamic> variant = {
        'name': variantCtrl.text,
        'variantTypeId' : selectedVariantType?.sId
      };

      final response = await service.addItem(endpointUrl: 'variants', itemData: variant);
      if (response.isOk){
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true){
          clearFields();
          SnackBarHelper.showSuccessSnackBar('${apiResponse.message}');
          _dataProvider.getAllVariants();
          log('Tạo thành công!');
        } else {
          SnackBarHelper.showErrorSnackBar('thêm thất bại!: ${apiResponse.message}');
        }
      }else{
        SnackBarHelper.showErrorSnackBar('Error ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e){
      print(e);
      SnackBarHelper.showErrorSnackBar('Đã có lỗi xảy ra!: $e');
      rethrow;
    }
  }

  //TODO: should complete updateVariant
  updateVariant() async{
    try{
      Map<String ,dynamic> variant = {
        'name': variantCtrl.text,
        'variantTypeId': selectedVariantType?.sId
      };

      final response = await service.updateItem(endpointUrl: 'variants', itemData:variant , itemId: variantForUpdate?.sId ?? '' );
      if (response.isOk){
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true){
          clearFields();
          SnackBarHelper.showSuccessSnackBar('${apiResponse.message}');
          _dataProvider.getAllVariants();
          log('Sửa thành công!');
        } else {
          SnackBarHelper.showErrorSnackBar('thêm thất bại!: ${apiResponse.message}');
        }
      }else{
        SnackBarHelper.showErrorSnackBar('Error ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e){
      print(e);
      SnackBarHelper.showErrorSnackBar('Đã có lỗi xảy ra!: $e');
      rethrow;
    }
  }

  //TODO: should complete submitVariant
  submitVariant(){
    if (variantForUpdate != null){
      updateVariant();
    }else{
      addVariant();
    }
  }

  //TODO: should complete deleteVariant
  deleteVariant(Variant variant) async {
    try {
      Response response = await service.deleteItem(endpointUrl: 'Variants', itemId: variant.sId ?? '');

      if (response.isOk) {
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true) {
          SnackBarHelper.showSuccessSnackBar('Xoá thành công!');
          _dataProvider.getAllVariants();

        }
      } else {
        SnackBarHelper.showErrorSnackBar('Error ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e) {
      print(e);
      rethrow;
    }
  }

  setDataForUpdateVariant(Variant? variant) {
    if (variant != null) {
      variantForUpdate = variant;
      variantCtrl.text = variant.name ?? '';
      selectedVariantType =
          _dataProvider.variantTypes.firstWhereOrNull((element) => element.sId == variant.variantTypeId?.sId);
    } else {
      clearFields();
    }
  }

  clearFields() {
    variantCtrl.clear();
    selectedVariantType = null;
    variantForUpdate = null;
  }

  void updateUI() {
    notifyListeners();
  }
}
