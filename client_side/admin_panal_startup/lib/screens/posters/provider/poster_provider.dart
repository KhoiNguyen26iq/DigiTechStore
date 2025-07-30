import 'dart:developer';
import 'dart:io';
import '../../../models/api_response.dart';
import '../../../services/http_services.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/foundation.dart' hide Category;
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/data/data_provider.dart';
import '../../../models/poster.dart';
import '../../../utility/snack_bar_helper.dart';

class PosterProvider extends ChangeNotifier {
  HttpService service = HttpService();
  final DataProvider _dataProvider;
  final addPosterFormKey = GlobalKey<FormState>();
  TextEditingController posterNameCtrl = TextEditingController();
  Poster? posterForUpdate;


  File? selectedImage;
  XFile? imgXFile;


  PosterProvider(this._dataProvider);

  //TODO: should complete addPoster
  addPoster() async {
    try {
      if (selectedImage == null) {
        SnackBarHelper.showErrorSnackBar('Chọn ảnh!');
        return;
      }
      // In log giá trị của posterNameCtrl.text để kiểm tra
      print('Poster Name: ${posterNameCtrl.text}');
      Map<String, dynamic> formDataMap = {
        'posterName': posterNameCtrl.text,
        'image': 'no_data',
      };
      final FormData form = await createFormData(imgXFile: imgXFile, formData: formDataMap);

      final response = await service.addItem(endpointUrl: 'posters', itemData: form);
      if (response.isOk) {
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true) {
          SnackBarHelper.showSuccessSnackBar('${apiResponse.message}');
          _dataProvider.getAllPosters();
          log('Thêm thành công!');
          clearFields();
        } else {
          SnackBarHelper.showErrorSnackBar('thêm thất bại!: ${apiResponse.message}');
        }
      } else {
        SnackBarHelper.showErrorSnackBar('Error ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e) {
      print(e);
      SnackBarHelper.showErrorSnackBar('Đã có lỗi xảy ra!: $e');
      rethrow;
    }
  }


  //TODO: should complete updatePoster
  updatePoster() async{
    try{
      Map<String ,dynamic> formDataMap = {
        'posterName': posterNameCtrl.text,
        'image': posterForUpdate?.imageUrl?? '',
      };
      final FormData form = await createFormData(imgXFile: imgXFile, formData: formDataMap);

      final response = await service.updateItem(endpointUrl: 'posters', itemData:form , itemId: posterForUpdate?.sId ?? '' );
      if (response.isOk){
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true){
          clearFields();
          SnackBarHelper.showSuccessSnackBar('${apiResponse.message}');
          _dataProvider.getAllCategory();
          log('Sửa thành công!');
        } else {
          SnackBarHelper.showErrorSnackBar('Thêm thất bại!: ${apiResponse.message}');
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


  //TODO: should complete submitPoster
  submitPoster(){
    if (posterForUpdate != null){
      updatePoster();
    }else{
      addPoster();
    }
  }


  void pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      selectedImage = File(image.path);
      imgXFile = image;
      notifyListeners();
    }
  }


  //TODO: should complete deletePoster
  deletePoster(Poster poster) async {
    try {
      Response response = await service.deleteItem(endpointUrl: 'posters', itemId: poster.sId ?? '');

      if (response.isOk) {
        ApiResponse apiResponse = ApiResponse.fromJson(response.body, null);
        if (apiResponse.success == true) {
          SnackBarHelper.showSuccessSnackBar('Xoá thành công!');
          _dataProvider.getAllPosters();

        }
      } else {
        SnackBarHelper.showErrorSnackBar('Error ${response.body?['message'] ?? response.statusText}');
      }
    } catch (e) {
      print(e);
      rethrow;
    }
  }



  setDataForUpdatePoster(Poster? poster) {
    if (poster != null) {
      clearFields();
      posterForUpdate = poster;
      posterNameCtrl.text = poster.posterName ?? '';
    } else {
      clearFields();
    }
  }

  Future<FormData> createFormData({required XFile? imgXFile, required Map<String, dynamic> formData}) async {
    if (imgXFile != null) {
      MultipartFile multipartFile;
      if (kIsWeb) {
        String fileName = imgXFile.name;
        Uint8List byteImg = await imgXFile.readAsBytes();
        multipartFile = MultipartFile(byteImg, filename: fileName);
      } else {
        String fileName = imgXFile.path.split('/').last;
        multipartFile = MultipartFile(imgXFile.path, filename: fileName);
      }
      formData['img'] = multipartFile;
    }
    final FormData form = FormData(formData);
    return form;
  }

  clearFields() {
    posterNameCtrl.clear();
    selectedImage = null;
    imgXFile = null;
    posterForUpdate = null;
  }
}
