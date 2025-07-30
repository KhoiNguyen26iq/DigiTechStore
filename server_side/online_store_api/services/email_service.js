// services/email_service.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Ưu tiên SMTP riêng → nhanh & ổn định hơn Gmail
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      this.transporter = nodemailer.createTransport({
        pool: true,                // bật pool
        maxConnections: 10,        // số connection song song
        maxMessages: 100,          // số mail/connection trước khi recycle
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        keepAlive: true,
      });
    } else {
      // Gmail + App Password (có thể chậm hơn) – vẫn bật pool
      this.transporter = nodemailer.createTransport({
        pool: true,
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        keepAlive: true,
      });
    }
  }

  async sendForgotPasswordEmail(email, verificationCode, userName = '') {
  try {
    const subject = `${process.env.APP_NAME} - Mã khôi phục mật khẩu`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Khôi phục mật khẩu</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Xin chào ${userName ? `<strong>${userName}</strong>` : 'bạn'},
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản <strong>${email}</strong>.
          </p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Mã khôi phục của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
              ${verificationCode}
            </div>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Mã có hiệu lực trong 10 phút</p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Lưu ý bảo mật:</strong><br>
              • Không chia sẻ mã này với bất kỳ ai<br>
              • Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này<br>
              • Mã sẽ tự động hết hạn sau 10 phút
            </p>
          </div>
          
          <hr style="border: none; height: 1px; background: #eee; margin: 25px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            Email này được gửi tự động từ hệ thống ${process.env.APP_NAME}.<br>
            Vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    `;

    const textContent = `
Xin chào ${userName},

Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản ${email}.

Mã khôi phục của bạn là: ${verificationCode}
(Mã có hiệu lực trong 10 phút)

Lưu ý bảo mật:
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này
- Mã sẽ tự động hết hạn sau 10 phút

---
Email này được gửi tự động từ hệ thống ${process.env.APP_NAME}.
Vui lòng không trả lời email này.
    `;

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await this.transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('❌ sendForgotPasswordEmail error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

  async sendVerificationEmail(email, code, userName = '') {
    try {
      const info = await this.transporter.sendMail({
        from: {
          name: process.env.APP_NAME || 'Your App',
          address:
            process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@example.com',
        },
        to: email,
        subject: '🔐 Xác thực địa chỉ email của bạn',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
        },
        html: `
          <div style="font-family:Segoe UI,Arial,sans-serif">
            <h2>Xác thực email</h2>
            <p>${userName ? `Xin chào ${userName}, ` : ''}mã xác thực của bạn là:</p>
            <div style="font-size:24px;font-weight:700">${code}</div>
            <p>Mã hết hạn sau 10 phút.</p>
          </div>
        `,
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = EmailService;
