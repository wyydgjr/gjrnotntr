/**
 * 统一响应格式：{ code, message, data }
 * code = 0 成功；非 0 对应 HTTP 语义（401/403/404/400/500）
 */

function ok(res, data = null, message = 'success') {
  res.json({ code: 0, message, data });
}

function fail(res, status, message = 'error') {
  res.status(status).json({ code: status, message, data: null });
}

module.exports = { ok, fail };
