class User {
  String? name;
  String? email;
  String? password;
  String? phone;
  String? gender;
  String? birthday;
  String? address;
  String? city;
  String? state;
  String? country;
  String? postalCode;
  String? profileImage;
  bool? isEmailVerified;
  bool? isPhoneVerified;
  String? sId;
  String? createdAt;
  String? updatedAt;

  User({
    this.name,
    this.email,
    this.password,
    this.phone,
    this.gender,
    this.birthday,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.profileImage,
    this.isEmailVerified,
    this.isPhoneVerified,
    this.sId,
    this.createdAt,
    this.updatedAt,
  });

  User.fromJson(Map<String, dynamic> json) {
    name = json['name'];
    email = json['email'];
    password = json['password'];
    phone = json['phone'];
    gender = json['gender'];
    birthday = json['birthday'];
    address = json['address'];
    city = json['city'];
    state = json['state'];
    country = json['country'];
    postalCode = json['postalCode'];
    profileImage = json['profileImage'];
    isEmailVerified = json['isEmailVerified'];
    isPhoneVerified = json['isPhoneVerified'];
    sId = json['_id'];
    createdAt = json['createdAt'];
    updatedAt = json['updatedAt'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['name'] = name;
    data['email'] = email;
    data['password'] = password;
    data['phone'] = phone;
    data['gender'] = gender;
    data['birthday'] = birthday;
    data['address'] = address;
    data['city'] = city;
    data['state'] = state;
    data['country'] = country;
    data['postalCode'] = postalCode;
    data['profileImage'] = profileImage;
    data['isEmailVerified'] = isEmailVerified;
    data['isPhoneVerified'] = isPhoneVerified;
    data['_id'] = sId;
    data['createdAt'] = createdAt;
    data['updatedAt'] = updatedAt;
    return data;
  }

  // Getter để format birthday
  String get formattedBirthday {
    if (birthday == null || birthday!.isEmpty) return '';
    return birthday!;
  }

  // Getter để hiển thị email thay vì name trong login
  String get loginIdentifier => email ?? '';

  // Getter để hiển thị tên đầy đủ
  String get displayName => name ?? '';
}