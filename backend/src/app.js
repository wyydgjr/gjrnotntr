const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// CORS 配置：允许前端跨域访问
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(
  cors({
    origin(origin, callback) {
      // 允许无 Origin 的请求（如 Postman / 服务端调用）以及本地双击打开页面
      // 注意：Chrome 从本地文件打开页面时，Origin 可能是 "null"，也可能是 "file://"，两者都要放行，
      // 否则预检请求会被拒绝，页面里的所有接口调用都会失败。
      if (!origin || origin === 'null' || origin.startsWith('file') || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 请求日志（简单打印）
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'success', data: { status: 'ok', time: new Date().toISOString() } });
});

// 业务路由
app.use('/api', routes);

// 404 与全局错误处理
app.use(notFound);
app.use(errorHandler);

module.exports = app;
