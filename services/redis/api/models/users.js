const mysql = require('mysql2/promise');
const config = require('../config/db');

const pool = mysql.createPool(config);

module.exports = {
  // 根据邮箱查找用户
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM api_users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0];
  },

  // 创建新用户
  async create({ email, password_hash, name }) {
    const [result] = await pool.execute(
      'INSERT INTO api_users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, password_hash, name]
    );
    return {
      id: result.insertId,
      email,
      name,
      role: 'member'
    };
  },

  // 根据 ID 获取用户信息
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, email, name, role FROM api_users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0];
  }
};
