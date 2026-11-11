/**
 * ============================================================
 * 文件作用：认证模块——注册 / 登录 / 获取当前用户
 * 讲解一句话：注册时密码用 bcrypt 加盐哈希后入库，登录时比对哈希并签发 JWT。
 * 答辩点：密码永不明文存储；bcrypt 自带盐值抗彩虹表；登录成功返回 token + 用户信息。
 * ============================================================
 */
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');
const { ok, fail } = require('../utils/response');

/**
 * 用户注册
 * POST /api/auth/register
 */
async function register(req, res) {
  const { username, password, nickname } = req.body || {};

  if (!username || !password) return fail(res, 400, '用户名和密码不能为空');
  if (username.length < 3 || username.length > 50) return fail(res, 400, '用户名长度需在3-50位之间');
  if (password.length < 6) return fail(res, 400, '密码长度至少6位');

  // 用户名唯一性校验
  const [exist] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (exist.length > 0) return fail(res, 400, '用户名已被注册');

  // 密码哈希（加盐 10 轮）：数据库只存哈希不存明文，即使泄露也无法直接得到密码
  const hash = bcrypt.hashSync(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
    [username, hash, nickname || username]
  );

  return ok(res, { id: result.insertId }, '注册成功');
}

/**
 * 用户登录
 * POST /api/auth/login
 */
async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return fail(res, 400, '用户名和密码不能为空');

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) return fail(res, 401, '用户名或密码错误');

  const user = rows[0];
  // bcrypt.compareSync 比对哈希：哈希不可逆，只能重新计算后比对，等价于校验密码
  const match = bcrypt.compareSync(password, user.password);
  if (!match) return fail(res, 401, '用户名或密码错误');

  const token = signToken(user);
  return ok(res, {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role },
  }, '登录成功');
}

/**
 * 获取当前登录用户信息
 * GET /api/auth/profile
 */
async function profile(req, res) {
  const [rows] = await pool.query(
    'SELECT id, username, nickname, role, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (rows.length === 0) return fail(res, 404, '用户不存在');
  return ok(res, rows[0]);
}

/**
 * 修改密码（登录用户）
 * POST /api/auth/change-password  body: { oldPassword, newPassword }
 * 安全点：必须校验旧密码（防止 token 被盗后直接改密码锁死账号）；新密码 bcrypt 重新加盐哈希，绝不复用旧哈希
 */
async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return fail(res, 400, '原密码和新密码不能为空');
  if (String(newPassword).length < 6) return fail(res, 400, '新密码长度至少6位');
  if (String(newPassword).length > 64) return fail(res, 400, '新密码长度不能超过64位');
  if (String(newPassword) === String(oldPassword)) return fail(res, 400, '新密码不能与原密码相同');

  const [rows] = await pool.query('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
  if (rows.length === 0) return fail(res, 404, '用户不存在');

  // 旧密码校验：bcrypt 比对哈希，错误统一提示，避免暴露账号是否存在
  const match = bcrypt.compareSync(String(oldPassword), rows[0].password);
  if (!match) return fail(res, 400, '原密码不正确');

  const hash = bcrypt.hashSync(String(newPassword), 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
  return ok(res, null, '密码修改成功，请使用新密码重新登录');
}

/**
 * 修改昵称（登录用户）
 * PUT /api/auth/profile  |  POST /api/auth/change-nickname  body: { nickname }
 */
async function changeNickname(req, res) {
  const nickname = String(req.body?.nickname ?? '').trim();
  if (!nickname) return fail(res, 400, '昵称不能为空');
  if (nickname.length > 50) return fail(res, 400, '昵称长度不能超过50个字符');

  // 先查存在性再更新：昵称与旧值相同时 affectedRows 可能为 0，不能据此判断用户不存在
  const [existRows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.user.id]);
  if (existRows.length === 0) return fail(res, 404, '用户不存在');

  await pool.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname, req.user.id]);

  const [rows] = await pool.query(
    'SELECT id, username, nickname, role, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  return ok(res, rows[0], '昵称修改成功');
}

module.exports = { register, login, profile, changePassword, changeNickname };
