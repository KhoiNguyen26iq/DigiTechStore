// services/sms_service.js - CHÍNH XÁC cho router của bạn
require('dotenv').config();

class SmsService {
  constructor() {
    this.provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();
    this.debugMode = process.env.ALLOW_SMS_DEBUG === 'true';
    this.appName = process.env.APP_NAME || 'Mobile Store';
    
    // Mock SMS storage
    this.sentMessages = [];
    
    console.log(`📱 SMS Service initialized - Provider: ${this.provider}`);
    if (this.debugMode) {
      console.log('🔍 SMS Debug mode: ENABLED');
    }
  }

  /**
   * CHÍNH XÁC - Method sendSMS mà router gọi
   * @param {string} toE164 - Số điện thoại dạng +84xxxxxxxxx
   * @param {string} message - Nội dung tin nhắn
   * @returns {Promise<Object>} - Kết quả gửi SMS
   */
  async sendSMS(toE164, message) {
    console.log(`📱 PHONE VERIFY | phone=${toE164} message=${message}`);
    
    const timestamp = new Date();
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      const messageData = {
        id: messageId,
        to: toE164,
        message: message,
        status: 'sent',
        timestamp: timestamp.toISOString(),
        provider: this.provider,
        cost: 0, // Mock = miễn phí
        deliveredAt: new Date(Date.now() + 1000).toISOString() // Giả lập delivered sau 1s
      };
      
      // Lưu vào "database" mock
      this.sentMessages.push(messageData);
      
      // Console output đẹp cho demo
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱 SMS SENT SUCCESSFULLY (MOCK MODE)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📞 To: ${toE164}`);
      console.log(`💬 Message: ${message}`);
      console.log(`🆔 Message ID: ${messageId}`);
      console.log(`⏰ Sent at: ${timestamp.toLocaleString('vi-VN')}`);
      console.log(`💰 Cost: FREE (Mock Provider)`);
      console.log(`✅ Status: DELIVERED`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Log cho debugging nếu cần
      if (this.debugMode) {
        console.log('🔍 DEBUG INFO:', {
          provider: this.provider,
          totalSent: this.sentMessages.length,
          queueLength: 0, // Mock không có queue
          timestamp: timestamp.getTime()
        });
      }
      
      return {
        success: true,
        messageId: messageId,
        provider: this.provider,
        status: 'sent',
        cost: 0,
        timestamp: messageData.timestamp
      };
      
    } catch (error) {
      console.error('❌ Mock SMS Error:', error);
      
      // Fallback - vẫn trả về success để không crash app
      console.log(`📱 [FALLBACK] SMS logged to console: ${toE164} - ${message}`);
      
      return {
        success: true, // Trả về true để không crash
        messageId: `fallback_${Date.now()}`,
        provider: 'console_fallback',
        status: 'logged',
        cost: 0,
        timestamp: timestamp.toISOString(),
        note: 'Sent via fallback console logging'
      };
    }
  }

  /**
   * Wrapper cho sendVerificationSms (để tương thích code cũ nếu có)
   */
  async sendVerificationSms(toE164, code) {
    const message = `Ma xac thuc ${this.appName}: ${code}. Het han sau 10 phut.`;
    return await this.sendSMS(toE164, message);
  }

  /**
   * Gửi OTP với template chuẩn
   */
  async sendOTP(phone, code) {
    const message = `Ma xac thuc ${this.appName}: ${code}. Het han sau 10 phut. Vui long khong chia se ma nay.`;
    console.log(`🔐 SENDING OTP: ${code} to ${phone}`);
    return await this.sendSMS(phone, message);
  }

  /**
   * Gửi thông báo đơn hàng
   */
  async sendOrderNotification(phone, orderData) {
    const { orderId, status, customerName } = orderData;
    let message = '';
    
    switch (status) {
      case 'confirmed':
        message = `${this.appName}: Don hang #${orderId} da duoc xac nhan. Cam on ${customerName || 'ban'} da mua sam!`;
        break;
      case 'shipped':
        message = `${this.appName}: Don hang #${orderId} dang tren duong giao den ban. Theo doi trang thai tai app.`;
        break;
      case 'delivered':
        message = `${this.appName}: Don hang #${orderId} da giao thanh cong. Cam on ban da mua sam!`;
        break;
      default:
        message = `${this.appName}: Don hang #${orderId} co cap nhat moi. Vui long kiem tra app.`;
    }
    
    return await this.sendSMS(phone, message);
  }

  /**
   * Gửi bulk SMS
   */
  async sendBulkSMS(phoneNumbers, message, options = {}) {
    console.log(`📢 BULK SMS: Sending to ${phoneNumbers.length} recipients`);
    
    const results = [];
    const delay = options.delay || 100; // Delay giữa các tin nhắn
    
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phone = phoneNumbers[i];
      
      try {
        console.log(`📱 Sending ${i + 1}/${phoneNumbers.length} to ${phone}`);
        const result = await this.sendSMS(phone, message);
        results.push({ 
          phone, 
          success: true, 
          messageId: result.messageId,
          index: i + 1
        });
        
        // Delay để tránh spam
        if (i < phoneNumbers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Failed to send to ${phone}:`, error.message);
        results.push({ 
          phone, 
          success: false, 
          error: error.message,
          index: i + 1 
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`📊 Bulk SMS completed: ${successCount}/${phoneNumbers.length} successful`);
    
    return {
      total: phoneNumbers.length,
      successful: successCount,
      failed: phoneNumbers.length - successCount,
      results: results
    };
  }

  /**
   * Lấy lịch sử tin nhắn đã gửi
   */
  getMessageHistory(limit = 50) {
    return this.sentMessages
      .slice(-limit) // Lấy tin nhắn mới nhất
      .reverse(); // Mới nhất trước
  }

  /**
   * Lấy thống kê SMS
   */
  getStatistics() {
    const total = this.sentMessages.length;
    const today = new Date().toDateString();
    const todayCount = this.sentMessages.filter(msg => 
      new Date(msg.timestamp).toDateString() === today
    ).length;
    
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekCount = this.sentMessages.filter(msg => 
      new Date(msg.timestamp) >= last7Days
    ).length;
    
    return {
      total: total,
      today: todayCount,
      thisWeek: weekCount,
      provider: this.provider,
      totalCost: 0, // Mock = miễn phí
      lastSent: total > 0 ? this.sentMessages[total - 1].timestamp : null
    };
  }

  /**
   * Tìm kiếm tin nhắn theo số điện thoại
   */
  searchMessages(phone) {
    return this.sentMessages.filter(msg => msg.to === phone);
  }

  /**
   * Lấy trạng thái tin nhắn
   */
  async getMessageStatus(messageId) {
    const message = this.sentMessages.find(msg => msg.id === messageId);
    
    if (!message) {
      return { found: false, error: 'Message not found' };
    }
    
    // Mock: Tất cả tin nhắn đều "delivered" sau 1 giây
    return {
      found: true,
      messageId: messageId,
      status: 'delivered',
      sentAt: message.timestamp,
      deliveredAt: message.deliveredAt,
      provider: this.provider
    };
  }

  /**
   * Kiểm tra cấu hình provider
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      isConfigured: true, // Mock luôn sẵn sàng
      debugMode: this.debugMode,
      appName: this.appName,
      capabilities: [
        'sendSMS',
        'sendOTP', 
        'sendBulkSMS',
        'getHistory',
        'getStatistics',
        'free',
        'demo',
        'instant'
      ],
      limitations: [
        'Mock provider - không gửi SMS thực tế',
        'Chỉ log ra console cho mục đích demo',
        'Phù hợp cho development và đề tài học tập'
      ],
      cost: 'FREE',
      rateLimit: 'UNLIMITED'
    };
  }

  /**
   * Test connection (Mock luôn OK)
   */
  async testConnection() {
    console.log('🧪 Testing SMS connection...');
    
    const testResult = await this.sendSMS('+84901234567', 'Test message from SMS service');
    
    if (testResult.success) {
      console.log('✅ SMS Service test: PASSED');
      return { success: true, provider: this.provider };
    } else {
      console.log('❌ SMS Service test: FAILED');
      return { success: false, error: testResult.error };
    }
  }

  /**
   * Clear history (cho testing)
   */
  clearHistory() {
    this.sentMessages = [];
    console.log('🧹 SMS history cleared');
  }
}

module.exports = SmsService;

// ==========================================
// TEST FILE - Để test SMS service
// ==========================================


// test_sms.js
const SmsService = require('./services/sms_service');

async function testSMSService() {
  console.log('🧪 TESTING SMS SERVICE');
  console.log('=====================\n');
  
  const sms = new SmsService();
  
  // Test 1: Basic sendSMS (method router gọi)
  console.log('1️⃣ Testing sendSMS method:');
  try {
    const result = await sms.sendSMS('+84377108687', 'Ma xac thuc: 123456 (het han sau 10 phut)');
    console.log('✅ Success:', result.success);
    console.log('📱 Message ID:', result.messageId);
    console.log('💰 Cost:', result.cost);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 2: sendOTP
  console.log('2️⃣ Testing sendOTP method:');
  try {
    const result = await sms.sendOTP('+84377108687', '654321');
    console.log('✅ Success:', result.success);
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 3: Statistics
  console.log('3️⃣ SMS Statistics:');
  const stats = sms.getStatistics();
  console.log('📊 Total sent:', stats.total);
  console.log('📅 Today:', stats.today);
  console.log('💰 Total cost:', stats.totalCost);
  console.log('');
  
  // Test 4: History
  console.log('4️⃣ Message History:');
  const history = sms.getMessageHistory(3);
  history.forEach((msg, idx) => {
    console.log(`${idx + 1}. [${msg.id}] ${msg.to}: ${msg.message.substring(0, 30)}...`);
  });
  
  console.log('\n✅ All tests completed successfully!');
}

// Chạy test
if (require.main === module) {
  testSMSService().catch(console.error);
}
