/**
 * 初始化账号脚本
 * 用法：npm run seed
 * 说明：管理员 admin/admin123，普通用户 user/user123（密码均 bcrypt 加密）
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seed() {
  const accounts = [
    { username: 'admin', password: 'admin123', nickname: '管理员', role: 'admin' },
    { username: 'user', password: 'user123', nickname: '测试用户', role: 'user' },
  ];

  for (const acc of accounts) {
    const [exist] = await pool.query('SELECT id FROM users WHERE username = ?', [acc.username]);
    if (exist.length > 0) {
      console.log(`[seed] 账号 ${acc.username} 已存在，跳过`);
      continue;
    }
    const hash = bcrypt.hashSync(acc.password, 10);
    await pool.query(
      'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
      [acc.username, hash, acc.nickname, acc.role]
    );
    console.log(`[seed] 创建账号 ${acc.username}（${acc.role}）`);
  }

  console.log('[seed] 完成，默认账号：admin/admin123，user/user123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] 失败：', err.message);
  process.exit(1);
});
