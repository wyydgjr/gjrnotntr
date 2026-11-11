const { fail } = require('../utils/response');

/** 404 兜底：未匹配到任何路由 */
function notFound(req, res) {
  fail(res, 404, `接口不存在: ${req.method} ${req.originalUrl}`);
}

/** 全局错误处理中间件 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // 记录错误栈到服务端日志（不返回给前端敏感信息）
  console.error('[ERROR]', err);

  // 业务层通过 err.status 标记的状态码；默认 500
  const status = err.status || 500;
  const message = status === 500 ? '服务器内部错误' : err.message;
  fail(res, status, message);
}

module.exports = { notFound, errorHandler };
