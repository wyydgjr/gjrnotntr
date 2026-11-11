/**
 * ============================================================
 * 文件作用：JWT 令牌签发与校验工具
 * 讲解一句话：登录成功用 SECRET 签发默认 2 天有效的 Token，后续请求凭 Token 免密访问。
 * 答辩点：Token 载荷含 id/username/role，签名防篡改；校验失败返回 null 由中间件统一转 401。
 * ============================================================
 */
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'please_change_me_to_a_random_long_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2d';

/** 签发 token */
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

/** 校验 token，失败返回 null */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { signToken, verifyToken };
