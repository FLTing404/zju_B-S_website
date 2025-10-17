const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'photo_manager',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// 导出query方法，兼容原有的调用方式
module.exports = {
  query: async (sql, params) => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return [rows];
    } finally {
      connection.release();
    }
  },
  pool
};

