/**
 * 讲解一句话：加载环境变量、引入装配好的 app、监听 3000 端口。
 * 答辩点：异常兜底处理，避免单次请求异常导致整个服务退出。
 */
require('dotenv').config();
const app = require('./app');
// 待支付订单超时自动取消定时任务（功能1）
const { startOrderExpireTask } = require('./services/orderExpireTask');

const PORT = process.env.PORT || 3000;

// 最后一道防线：兜底记录未被捕获的异常，保证服务不因单次异常退出
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
});

app.listen(PORT, () => {
  console.log(`[ecommerce-backend] server running at http://localhost:${PORT}`);
  // 随服务启动超时检查定时器：每分钟扫描一次，自动取消超时未支付订单并回滚库存
  startOrderExpireTask();
});
