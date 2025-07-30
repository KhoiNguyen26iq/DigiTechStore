const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    default: null
  },
  gender: {
    type: String,
    enum: ['Nam', 'Nữ', 'Khác'],
    default: 'Nam'
  },
  birthday: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  state: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: 'Việt Nam'
  },
  postalCode: {
    type: String,
    default: null
  },
  profileImage: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // ===== OAUTH FIELDS - THÊM MỚI =====
  googleId: {
    type: String,
    sparse: true, // Cho phép null và unique khi có giá trị
    default: null
  },
  facebookId: {
    type: String,
    sparse: true, // Cho phép null và unique khi có giá trị
    default: null
  },
  profilePicture: {
    type: String,
    default: null // URL ảnh đại diện từ Google/Facebook
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local' // local = đăng ký thông thường
  },
  // ===== KẾT THÚC OAUTH FIELDS =====
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware để tự động cập nhật updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Index để tìm kiếm nhanh OAuth
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;