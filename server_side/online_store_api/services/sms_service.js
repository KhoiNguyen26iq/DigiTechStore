// services/sms_service.js - FINAL VERSION cho đề tài
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
   * Gửi SMS - Method chính được router gọi
   * @param {string} toE164 - Số điện thoại dạng +84xxxxxxxxx
   * @param {string} message - Nội dung tin nhắn
   */
  async sendSMS(toE164, message) {
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
      console.error('❌ Mock SMS Error (This should not happen):', error);
      
      // Even mock should not fail, but just in case
      return {
        success: false,
        error: error.message,
        provider: this.provider,
        messageId: null,
        timestamp: timestamp.toISOString()
      };
    }
  }

  /**
   * Gửi OTP với template chuẩn
   * @param {string} phone - Số điện thoại
   * @param {string} code - Mã OTP 6 số
   */
  async sendOTP(phone, code) {
    const message = `Ma xac thuc ${this.appName}: ${code}. Het han sau 10 phut. Vui long khong chia se ma nay.`;
    
    console.log(`🔐 SENDING OTP: ${code} to ${phone}`);
    return await this.sendSMS(phone, message);
  }

  /**
   * Gửi thông báo xác thực thành công
   */
  async sendVerificationSuccess(phone, feature = 'tai khoan') {
    const message = `${this.appName}: Xac thuc ${feature} thanh cong! Cam on ban da su dung dich vu cua chung toi.`;
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
   * Gửi SMS marketing/khuyến mãi
   */
  async sendPromotionSMS(phone, promotionData) {
    const { title, discount, validUntil } = promotionData;
    const message = `${this.appName}: ${title}! Giam ${discount}% - Chi co den ${validUntil}. Mua ngay tai app!`;
    return await this.sendSMS(phone, message);
  }

  /**
   * Gửi bulk SMS (cho nhiều số cùng lúc)
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
        
        // Delay để tránh spam (thực tế cần thiết với provider thật)
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