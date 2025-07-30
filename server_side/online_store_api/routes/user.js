const express = require('express');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const router = express.Router();
const SmsService = require('../services/sms_service');
const smsService = new SmsService();
const phoneVerificationCodes = new Map();
const User = require('../model/user');

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email service: dùng pool/keepAlive để gửi nhanh & ổn định
const EmailService = require('../services/email_service');
const emailService = new EmailService();
const forgotPasswordCodes = new Map();
//Sđt
function normalizeVNPhone(input) {
  if (!input) return null;
  const raw = String(input).replace(/\s+/g, '');
  const re = /^(0|\+84)[3-9]\d{8}$/;
  if (!re.test(raw)) return null;
  if (raw.startsWith('+84')) return raw;
  if (raw.startsWith('0')) return `+84${raw.substring(1)}`;
  return null;
}
// Lưu mã xác thực tạm (10 phút)
const verificationCodes = new Map();

/* ----------------------------- Users CRUD ---------------------------- */
// GỬI MÃ XÁC THỰC SĐT
router.post('/:id/send-phone-verification', asyncHandler(async (req, res) => {
+ console.log('➡️  HIT /send-phone-verification:', req.params.id, req.body);
  const userID = req.params.id;
  const phoneRaw = req.body?.phone;

  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
  }

  const user = await User.findById(userID).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.isPhoneVerified) {
    return res.status(400).json({ success: false, message: 'Số điện thoại đã được xác thực.' });
  }

  const phone = normalizeVNPhone(phoneRaw);
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Số điện thoại Việt Nam không hợp lệ.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

  // Lưu tạm theo userID
  verificationCodes.set(userID, { code, expiresAt, phone });
  phoneVerificationCodes.set(userID, { code, expiresAt, phone });

  // trả về ngay cho client (kèm code khi dev)
  res.json({
    success: true,
    message: `Mã xác thực đã được gửi tới ${phone}`,
    ...(process.env.NODE_ENV !== 'production' && { developmentCode: code }),
  });

  // gửi SMS ở background để không chặn response
  setImmediate(async () => {
    try {
      await smsService.sendSMS(phone, `Ma xac thuc: ${code} (het han sau 10 phut)`);
    } catch (e) {
      console.error('Mock/Textbelt SMS error:', e);
    }
  });
}));

router.put('/:id/verify-phone', asyncHandler(async (req, res) => {
+ console.log('➡️  HIT /verify-phone:', req.params.id, req.body);
  const userID = req.params.id;
  const { verificationCode, phone: phoneRaw } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
  }
  if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({ success: false, message: 'Mã xác thực phải gồm 6 chữ số.' });
  }

  const user = await User.findById(userID).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.isPhoneVerified) {
    return res.status(400).json({ success: false, message: 'Số điện thoại đã được xác thực.' });
  }

  const stored = verificationCodes.get(userID);
  if (!stored) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy mã xác thực. Vui lòng gửi lại mã.' });
  }
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(userID);
    phoneVerificationCodes.delete(userID);
    return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã.' });
  }
  if (stored.code !== verificationCode) {
    return res.status(400).json({ success: false, message: 'Mã xác thực không đúng.' });
  }

  // Nếu client gửi kèm phone, kiểm tra khớp với phone đã lưu khi gửi mã
  if (phoneRaw) {
    const normalized = normalizeVNPhone(phoneRaw);
    if (!normalized || normalized !== stored.phone) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không khớp với yêu cầu gửi mã.' });
    }
  }

  // Xác thực thành công → cập nhật user
  const updatedUser = await User.findByIdAndUpdate(
    userID,
    { phone: stored.phone, isPhoneVerified: true, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password');

  verificationCodes.delete(userID);

  return res.json({
    success: true,
    message: 'Xác thực số điện thoại thành công.',
    data: updatedUser,
  });
}));

router.get('/:id/phone-verification-status', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
  }
  const user = await User.findById(userID).select('phone isPhoneVerified');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({
    success: true,
    data: {
      phone: user.phone,
      isPhoneVerified: user.isPhoneVerified,
      hasVerificationCodePending: phoneVerificationCodes.has(userID),
    },
  });
}));
router.get('/', asyncHandler(async (_req, res) => {
  const users = await User.find().select('-password');
  res.json({ success: true, message: 'Users retrieved successfully.', data: users });
}));

// Login by email (tên param trong app đang là "name" = email)
router.post('/login', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /login:', req.body);
  
  const { name, password } = req.body;
  
  if (!name || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email/số điện thoại và mật khẩu là bắt buộc.' 
    });
  }

  const identifier = name.trim();
  
  // Kiểm tra xem input là email hay số điện thoại
  const isEmail = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(identifier);
  const normalizedPhone = normalizeVNPhone(identifier);
  
  let user = null;
  
  if (isEmail) {
    // Đăng nhập bằng email
    console.log('🔍 Login attempt with email:', identifier.toLowerCase());
    user = await User.findOne({ email: identifier.toLowerCase() });
  } else if (normalizedPhone) {
    // Đăng nhập bằng số điện thoại
    console.log('🔍 Login attempt with phone:', normalizedPhone);
    user = await User.findOne({ phone: normalizedPhone });
  } else {
    // Input không hợp lệ
    return res.status(400).json({ 
      success: false, 
      message: 'Email không hợp lệ hoặc số điện thoại Việt Nam không đúng định dạng.' 
    });
  }

  // Kiểm tra user tồn tại và mật khẩu
  if (!user) {
    const errorMsg = isEmail 
      ? 'Không tìm thấy tài khoản với email này.' 
      : 'Không tìm thấy tài khoản với số điện thoại này.';
    
    return res.status(401).json({ 
      success: false, 
      message: errorMsg 
    });
  }

  if (user.password !== password) {
    return res.status(401).json({ 
      success: false, 
      message: 'Mật khẩu không đúng.' 
    });
  }

  // Đăng nhập thành công
  const data = user.toObject();
  delete data.password;
  
  console.log('✅ Login successful for:', isEmail ? `email: ${identifier}` : `phone: ${normalizedPhone}`);
  
  res.json({ 
    success: true, 
    message: 'Đăng nhập thành công.', 
    data 
  });
}));

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, password } = req.body; // name = email
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc.' });
  }

  const email = name.toLowerCase();
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  const existed = await User.findOne({ email });
  if (existed) {
    return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
  }

  const displayName = email.split('@')[0];
  const user = await User.create({ name: displayName, email, password });

  res.status(201).json({ success: true, message: 'Đăng ký tài khoản thành công.', data: null });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: 'User retrieved successfully.', data: user });
}));

router.put('/:id/profile', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const updateData = { ...req.body };
  delete updateData.email;
  delete updateData.password;

  const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({ success: true, message: 'Cập nhật thông tin thành công.', data: user });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { name, password, email } = req.body;
  if (!name || !password) {
    return res.status(400).json({ success: false, message: 'Tên và mật khẩu là bắt buộc.' });
  }

  const emailToUpdate = (email || name).toLowerCase();
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(emailToUpdate)) {
    return res.status(400).json({ success: false, message: 'Email không hợp lệ.' });
  }

  const existed = await User.findOne({ email: emailToUpdate, _id: { $ne: id } });
  if (existed) return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });

  const user = await User.findByIdAndUpdate(
    id,
    { name, email: emailToUpdate, password },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({ success: true, message: 'Cập nhật user thành công.', data: user });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const del = await User.findByIdAndDelete(req.params.id);
  if (!del) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: 'Xóa user thành công.' });
}));

/* ------------------------- Email Verification ------------------------ */
// Gửi mã xác thực – trả response NGAY, gửi email NỀN để nhanh
router.post('/:id/send-email-verification', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  console.log('[send-email-verification] id =', userID);

  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
  }

  const user = await User.findById(userID).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.isEmailVerified) {
    return res.status(400).json({ success: false, message: 'Email đã được xác thực.' });
  }
  if (!user.email) {
    return res.status(400).json({ success: false, message: 'Người dùng chưa có email.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  verificationCodes.set(userID, { code, expiresAt, email: user.email });

  // Phản hồi ngay cho app
  res.json({
    success: true,
    message: `Mã xác thực đã được gửi đến ${user.email}`,
    ...(process.env.NODE_ENV !== 'production' && { developmentCode: code }),
  });

  // Gửi email ở nền để không chặn response
  setImmediate(async () => {
    try {
      const r = await emailService.sendVerificationEmail(user.email, code, user.name || '');
      if (!r.success) {
        console.error('❌ sendVerificationEmail failed:', r.error);
      } else {
        console.log('✅ Email queued/sent:', r.messageId || '');
      }
    } catch (err) {
      console.error('❌ Error while sending email:', err);
    }
  });
}));

// Xác thực mã
router.put('/:id/verify-email', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  const { verificationCode } = req.body;
  console.log('[verify-email] id =', userID, 'code =', verificationCode);

  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
  }
  if (!/^\d{6}$/.test(verificationCode || '')) {
    return res.status(400).json({ success: false, message: 'Mã xác thực phải có 6 chữ số.' });
  }

  const user = await User.findById(userID).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.isEmailVerified) {
    return res.status(400).json({ success: false, message: 'Email đã được xác thực.' });
  }

  const stored = verificationCodes.get(userID);
  if (!stored) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy mã xác thực. Vui lòng yêu cầu gửi lại mã.' });
  }
  console.log('✅ users route loaded from:', __filename);
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(userID);
    return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã.' });
  }
  if (stored.code !== verificationCode) {
    return res.status(400).json({ success: false, message: 'Mã xác thực không đúng.' });
  }

  const updated = await User.findByIdAndUpdate(
    userID,
    { isEmailVerified: true, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select('-password');

  verificationCodes.delete(userID);
  res.json({ success: true, message: 'Xác thực email thành công.', data: updated });
}));

// Kiểm tra trạng thái xác thực (đã fix lỗi biến user chưa được khai báo)
router.get('/:id/email-verification-status', asyncHandler(async (req, res) => {
  const userID = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userID)) {
    return res.status(400).json({ success: false, message: 'User ID không hợp lệ.' });
  }
  const user = await User.findById(userID).select('email isEmailVerified');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({
    success: true,
    data: {
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      hasVerificationCodePending: verificationCodes.has(userID),
    },
  });
}));

router.put('/:id/change-password', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /change-password:', req.params.id, req.body);
  
  const userID = req.params.id;
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!mongoose.Types.ObjectId.isValid(userID)) {
    console.log('❌ Invalid user ID:', userID);
    return res.status(400).json({ 
      success: false, 
      message: 'User ID không hợp lệ.' 
    });
  }

  if (!currentPassword || !newPassword) {
    console.log('❌ Missing password fields');
    return res.status(400).json({ 
      success: false, 
      message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc.' 
    });
  }

  if (newPassword.length < 6) {
    console.log('❌ New password too short');
    return res.status(400).json({ 
      success: false, 
      message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' 
    });
  }

  if (currentPassword === newPassword) {
    console.log('❌ Same password');
    return res.status(400).json({ 
      success: false, 
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' 
    });
  }

  try {
    console.log('🔍 Finding user:', userID);
    
    // Tìm user và kiểm tra mật khẩu hiện tại
    const user = await User.findById(userID);
    if (!user) {
      console.log('❌ User not found:', userID);
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng.' 
      });
    }

    console.log('✅ User found, checking current password');

    // Kiểm tra mật khẩu hiện tại có đúng không
    if (user.password !== currentPassword) {
      console.log('❌ Current password incorrect');
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu hiện tại không đúng.' 
      });
    }

    console.log('✅ Current password correct, updating...');

    // Cập nhật mật khẩu mới
    const updatedUser = await User.findByIdAndUpdate(
      userID,
      { 
        password: newPassword,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Password changed successfully for user:', userID);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công.',
      data: updatedUser
    });

  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đổi mật khẩu.',
      error: error.message
    });
  }
}));

/* -------------------- Cleanup mã hết hạn mỗi 5 phút ------------------- */
function cleanExpiredPhoneCodes() {
  const now = Date.now();
  for (const [uid, v] of phoneVerificationCodes.entries()) {
    if (now > v.expiresAt) phoneVerificationCodes.delete(uid);
  }
}
setInterval(cleanExpiredPhoneCodes, 5 * 60 * 1000);

setInterval(() => {
  const now = Date.now();
  for (const [uid, v] of verificationCodes.entries()) {
    if (now > v.expiresAt) {
      verificationCodes.delete(uid);
      console.log(`🧹 Cleaned expired verification code for user: ${uid}`);
    }
  }
}, 5 * 60 * 1000);
// Gửi mã forgot password qua email
router.post('/forgot-password/email', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /forgot-password/email:', req.body);
  
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email là bắt buộc.'
    });
  }

  const emailLower = email.toLowerCase();
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(emailLower)) {
    return res.status(400).json({
      success: false,
      message: 'Email không hợp lệ.'
    });
  }

  // Tìm user theo email
  const user = await User.findOne({ email: emailLower });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy tài khoản với email này.'
    });
  }

  // Tạo mã 6 số ngẫu nhiên
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

  // Lưu mã theo email
  forgotPasswordCodes.set(emailLower, { 
    code, 
    expiresAt, 
    userId: user._id.toString(),
    type: 'email'
  });

  // Trả response ngay
  res.json({
    success: true,
    message: 'Mã khôi phục đã được gửi đến email của bạn.',
    ...(process.env.NODE_ENV !== 'production' && { developmentCode: code }),
  });

  // Gửi email ở background
  setImmediate(async () => {
    try {
      const result = await emailService.sendForgotPasswordEmail(emailLower, code, user.name || '');
      if (result.success) {
        console.log('✅ Forgot password email sent to:', emailLower);
      } else {
        console.error('❌ Failed to send forgot password email:', result.error);
      }
    } catch (error) {
      console.error('❌ Error sending forgot password email:', error);
    }
  });
}));

// Gửi mã forgot password qua phone
router.post('/forgot-password/phone', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /forgot-password/phone:', req.body);
  
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại là bắt buộc.'
    });
  }

  const normalizedPhone = normalizeVNPhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại Việt Nam không hợp lệ.'
    });
  }

  // Tìm user theo phone
  const user = await User.findOne({ phone: normalizedPhone });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy tài khoản với số điện thoại này.'
    });
  }

  // Tạo mã 6 số ngẫu nhiên
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

  // Lưu mã theo phone
  forgotPasswordCodes.set(normalizedPhone, { 
    code, 
    expiresAt, 
    userId: user._id.toString(),
    type: 'phone'
  });

  // Trả response ngay
  res.json({
    success: true,
    message: 'Mã khôi phục đã được gửi đến số điện thoại của bạn.',
    ...(process.env.NODE_ENV !== 'production' && { developmentCode: code }),
  });

  // Gửi SMS ở background
  setImmediate(async () => {
    try {
      await smsService.sendSMS(normalizedPhone, `Ma khoi phuc mat khau: ${code} (het han sau 10 phut)`);
      console.log('✅ Forgot password SMS sent to:', normalizedPhone);
    } catch (error) {
      console.error('❌ Error sending forgot password SMS:', error);
    }
  });
}));

// Reset password với email
router.post('/reset-password/email', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /reset-password/email:', req.body);
  
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, mã xác thực và mật khẩu mới là bắt buộc.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
    });
  }

  const emailLower = email.toLowerCase();
  
  // Kiểm tra mã stored
  const stored = forgotPasswordCodes.get(emailLower);
  if (!stored || stored.type !== 'email') {
    return res.status(400).json({
      success: false,
      message: 'Không tìm thấy mã xác thực. Vui lòng yêu cầu gửi lại mã.'
    });
  }

  if (Date.now() > stored.expiresAt) {
    forgotPasswordCodes.delete(emailLower);
    return res.status(400).json({
      success: false,
      message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã.'
    });
  }

  if (stored.code !== code) {
    return res.status(400).json({
      success: false,
      message: 'Mã xác thực không đúng.'
    });
  }

  // Tìm và cập nhật user
  const user = await User.findById(stored.userId);
  if (!user) {
    forgotPasswordCodes.delete(emailLower);
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy người dùng.'
    });
  }

  // Cập nhật mật khẩu
  await User.findByIdAndUpdate(
    stored.userId,
    { 
      password: newPassword,
      updatedAt: new Date()
    },
    { runValidators: true }
  );

  // Xóa mã đã sử dụng
  forgotPasswordCodes.delete(emailLower);

  res.json({
    success: true,
    message: 'Đặt lại mật khẩu thành công!'
  });
}));

// Reset password với phone
router.post('/reset-password/phone', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /reset-password/phone:', req.body);
  
  const { phone, code, newPassword } = req.body;

  if (!phone || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại, mã xác thực và mật khẩu mới là bắt buộc.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
    });
  }

  const normalizedPhone = normalizeVNPhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại Việt Nam không hợp lệ.'
    });
  }
  
  // Kiểm tra mã stored
  const stored = forgotPasswordCodes.get(normalizedPhone);
  if (!stored || stored.type !== 'phone') {
    return res.status(400).json({
      success: false,
      message: 'Không tìm thấy mã xác thực. Vui lòng yêu cầu gửi lại mã.'
    });
  }

  if (Date.now() > stored.expiresAt) {
    forgotPasswordCodes.delete(normalizedPhone);
    return res.status(400).json({
      success: false,
      message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại mã.'
    });
  }

  if (stored.code !== code) {
    return res.status(400).json({
      success: false,
      message: 'Mã xác thực không đúng.'
    });
  }

  // Tìm và cập nhật user
  const user = await User.findById(stored.userId);
  if (!user) {
    forgotPasswordCodes.delete(normalizedPhone);
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy người dùng.'
    });
  }

  // Cập nhật mật khẩu
  await User.findByIdAndUpdate(
    stored.userId,
    { 
      password: newPassword,
      updatedAt: new Date()
    },
    { runValidators: true }
  );

  // Xóa mã đã sử dụng
  forgotPasswordCodes.delete(normalizedPhone);

  res.json({
    success: true,
    message: 'Đặt lại mật khẩu thành công!'
  });
}));

// Cleanup forgot password codes mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of forgotPasswordCodes.entries()) {
    if (now > value.expiresAt) {
      forgotPasswordCodes.delete(key);
      console.log(`🧹 Cleaned expired forgot password code for: ${key}`);
    }
  }
}, 5 * 60 * 1000);


// Login với Google
router.post('/auth/google', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /auth/google:', req.body);
  
  const { idToken } = req.body;
  
  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Google ID token is required'
    });
  }

  try {
    // Xác thực Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;
    const emailVerified = payload.email_verified;

    console.log('✅ Google auth payload:', { googleId, email, name, emailVerified });

    // Tìm user đã tồn tại
    let user = await User.findOne({ 
      $or: [
        { googleId: googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // User đã tồn tại - cập nhật thông tin Google nếu chưa có
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = picture;
        if (emailVerified && !user.isEmailVerified) {
          user.isEmailVerified = true;
        }
        await user.save();
      }
    } else {
      // Tạo user mới
      user = await User.create({
        name: name,
        email: email.toLowerCase(),
        googleId: googleId,
        profilePicture: picture,
        isEmailVerified: emailVerified || false,
        password: Math.random().toString(36), // Random password
        authProvider: 'google',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: userData
    });

  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Google token không hợp lệ'
    });
  }
}));

// Login với Facebook
router.post('/auth/facebook', asyncHandler(async (req, res) => {
  console.log('➡️  HIT /auth/facebook:', req.body);
  
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Facebook access token is required'
    });
  }

  try {
    // Xác thực Facebook token
    const fbResponse = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture.type(large)'
      }
    });

    const fbData = fbResponse.data;
    const facebookId = fbData.id;
    const email = fbData.email;
    const name = fbData.name;
    const picture = fbData.picture?.data?.url;

    console.log('✅ Facebook auth data:', { facebookId, email, name });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Không thể lấy email từ Facebook. Vui lòng cấp quyền email.'
      });
    }

    // Tìm user đã tồn tại
    let user = await User.findOne({ 
      $or: [
        { facebookId: facebookId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // User đã tồn tại - cập nhật thông tin Facebook nếu chưa có
      if (!user.facebookId) {
        user.facebookId = facebookId;
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // Tạo user mới
      user = await User.create({
        name: name,
        email: email.toLowerCase(),
        facebookId: facebookId,
        profilePicture: picture,
        isEmailVerified: true, // Facebook emails are usually verified
        password: Math.random().toString(36), // Random password
        authProvider: 'facebook',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      message: 'Đăng nhập Facebook thành công',
      data: userData
    });

  } catch (error) {
    console.error('❌ Facebook auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Facebook token không hợp lệ hoặc đã hết hạn'
    });
  }
}));





module.exports = router;
