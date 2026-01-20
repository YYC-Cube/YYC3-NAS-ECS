const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, `${env}.json`);

let config = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

module.exports = {
  ...config,
  env,
  isDev: env === 'development',
  isProd: env === 'production'
};
