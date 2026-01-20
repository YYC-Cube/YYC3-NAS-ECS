const fs = require('fs');

const schema = {
  PORT: '3000',
  BASE_URL: 'https://api.0379.email',
  ADMIN_EMAIL: 'admin@0379.email',
  JWT_SECRET: 'your_jwt_secret_key',
  EMAIL_PASS: 'your_email_password',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_NAME: 'YYC3_API',
  DB_USER: 'yyc3_api',
  DB_PASS: 'yyc3_api_email'
};

const lines = Object.entries(schema).map(([key, value]) => `${key}=${value}`);
fs.writeFileSync('.env.example', lines.join('\n'));

console.log('✅ .env.example 已同步生成');
