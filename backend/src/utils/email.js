const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // Standard transport configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'RoomHub <noreply@roomhub.vn>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // If default/mock, or credentials not configured, we print to console
    if (
      !process.env.EMAIL_USER ||
      process.env.EMAIL_USER.includes('mock') ||
      process.env.EMAIL_PASS.includes('mock')
    ) {
      console.log('==================================================');
      console.log(`[EMAIL SEND SIMULATION] To: ${options.to}`);
      console.log(`[EMAIL SEND SIMULATION] Subject: ${options.subject}`);
      console.log(`[EMAIL SEND SIMULATION] Content:\n${options.text}`);
      console.log('==================================================');
      return { message: 'Email simulation successful (printed to console)' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Fallback: log to console to prevent server crash
    console.log('==================================================');
    console.log(`[EMAIL FALLBACK LOG] To: ${options.to}`);
    console.log(`[EMAIL FALLBACK LOG] Subject: ${options.subject}`);
    console.log(`[EMAIL FALLBACK LOG] Content:\n${options.text}`);
    console.log('==================================================');
    return { message: 'Email sent via fallback log', error: error.message };
  }
};

module.exports = sendEmail;
