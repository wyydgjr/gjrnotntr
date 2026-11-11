/**
 * ============================================================
 * 文件作用：异步控制器包装器
 * 讲解一句话：把 async 控制器返回的 Promise 异常统一转交 next()，
 *            交由全局错误处理中间件按统一响应格式返回。
 * 答辩点：Express 4 不会自动捕获 async 函数里 throw 的错误，
 *        若不包装，业务校验抛错会变成未处理的 Promise 拒绝，
 *        导致 Node 进程直接退出、整个后端服务不可用。
 * ============================================================
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
