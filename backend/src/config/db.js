/**
 * ============================================================
 * 文件作用：MySQL 连接池配置（全局唯一数据库出口）
 * 讲解一句话：用连接池复用数据库连接，避免每个请求都新建连接的开销。
 * 答辩点：connectionLimit:10 限制并发连接；dateStrings 让日期以字符串返回，避免时区转换坑。
 * ============================================================
 */
const mysql = require('mysql2/promise');

// 创建 MySQL 连接池，全局复用
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'ecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true, // 日期以字符串返回，避免时区转换问题
});

module.exports = pool;
