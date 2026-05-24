const nodemailer = require('nodemailer');

/**
 * Email Service
 *
 * Hỗ trợ 2 mode:
 * 1. Production: Dùng SMTP thật (Gmail, Resend, SendGrid, ...)
 * 2. Development: Dùng Ethereal (fake SMTP, xem email tại https://ethereal.email)
 *
 * Cấu hình qua biến môi trường trong .env
 */

let transporter = null;

/**
 * Khởi tạo transporter (gọi 1 lần khi server start)
 */
const initEmailTransporter = async () => {
  if (process.env.SMTP_HOST) {
    // Production mode: dùng SMTP thật
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true cho port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`📧 Email service: SMTP (${process.env.SMTP_HOST})`);
  } else {
    // Development mode: dùng Ethereal (fake inbox)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`📧 Email service: Ethereal (dev mode)`);
    console.log(`   Preview URL: https://ethereal.email/login`);
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
  }
};

/**
 * Gửi email reset mật khẩu
 * @param {string} to - Email người nhận
 * @param {string} resetToken - Token reset password
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  if (!transporter) {
    await initEmailTransporter();
  }

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"LMS Platform" <noreply@lms.local>',
    to,
    subject: 'Đặt lại mật khẩu - LMS Platform',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Nhấn vào nút bên dưới để đặt mật khẩu mới:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #6c63ff; color: white; 
                  padding: 12px 24px; border-radius: 6px; text-decoration: none; 
                  font-weight: 600; margin: 16px 0;">
          Đặt lại mật khẩu
        </a>
        <p style="color: #666; font-size: 14px;">
          Link này sẽ hết hạn sau <strong>1 giờ</strong>.
        </p>
        <p style="color: #999; font-size: 12px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // Trong dev mode, in ra URL preview email
  if (!process.env.SMTP_HOST) {
    console.log(`📧 Preview email: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
};

module.exports = {
  initEmailTransporter,
  sendPasswordResetEmail,
};
