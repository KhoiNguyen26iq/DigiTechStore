import 'dart:convert';
import 'package:get/get_connect.dart';
import 'package:get/get.dart';
import '../utility/constants.dart';

class HttpService {
  final String baseUrl = MAIN_URL;
  final GetConnect _connect = GetConnect();

  Future<Response> getItems({required String endpointUrl}) async {
    try {
      return await _connect.get('$baseUrl/$endpointUrl');
    } catch (e) {
      return Response(body: json.encode({'error': e.toString()}), statusCode: 500);
    }
  }

  Future<Response> addItem({required String endpointUrl, required dynamic itemData}) async {
    try {
      final response = await _connect.post('$baseUrl/$endpointUrl', itemData);
      print(response.body);
      return response;
    } catch (e) {
      print('Error: $e');
      return Response(body: json.encode({'message': e.toString()}), statusCode: 500);
    }
  }

  Future<Response> updateItem({
    required String endpointUrl, 
    required String itemId, 
    required dynamic itemData
  }) async {
    try {
      return await _connect.put('$baseUrl/$endpointUrl/$itemId', itemData);
    } catch (e) {
      return Response(body: json.encode({'message': e.toString()}), statusCode: 500);
    }
  }

  // Thêm method put đơn giản cho EditProfileScreen
  Future<Response> put(String url, dynamic data, {Map<String, String>? headers}) async {
    try {
      return await _connect.put(url, data, headers: headers);
    } catch (e) {
      return Response(body: json.encode({'message': e.toString()}), statusCode: 500);
    }
  }

  Future<Response> deleteItem({required String endpointUrl, required String itemId}) async {
    try {
      return await _connect.delete('$baseUrl/$endpointUrl/$itemId');
    } catch (e) {
      return Response(body: json.encode({'message': e.toString()}), statusCode: 500);
    }
  }
}