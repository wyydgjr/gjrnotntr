/**讲解一句话：authRequired 校验登录态（未登录/过期返回 401），adminRequired 校验管理员角色（非管理员返回 403）。
 * 答辩点：无状态鉴权——Token 校验不查数据库，扩展性好；与前端路由守卫形成前后端双端 RBAC。
 */
const { verifyToken } = require('../utils/jwt');
const { fail } = require('../utils/response');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, '未登录，请先登录');

  const payload = verifyToken(token);
  if (!payload) return fail(res, 401, '登录已过期或无效，请重新登录');

  req.user = { id: payload.id, username: payload.username, role: payload.role };
  next();
}

/**
 * RBAC 权限中间件：要求管理员角色（需在 authRequired 之后使用）
 */
function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return fail(res, 403, '无权限访问，需要管理员账号');
  }
  next();
}

module.exports = { authRequired, adminRequired };
