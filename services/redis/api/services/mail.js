const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.0379.email',
  port: 465,
  secure: true,
  auth: {
    user: 'admin@0379.email',
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerifyEmail = async (to, verifyUrl) => {
  const templatePath = path.join(__dirname, '../templates/email/verify.html');
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace('{{verify_url}}', verifyUrl);

  await transporter.sendMail({
    from: '"言语团队" <admin@0379.email>',
    to,
    subject: '邮箱验证 · RediOps API',
    html
  });
};
