/**
 * ============================================================
 * 文件作用：待支付订单超时检查定时任务（随服务启动，功能1 调度层）
 * 讲解一句话：用 setInterval 每分钟触发一次超时扫描，服务启动 5 秒后先跑一次，保证历史遗留超时单被清理。
 * 答辩点：定时器 unref() 不阻塞进程退出；异常在任务内部捕获，单次失败不会导致进程崩溃或任务中断。
 * ============================================================
 */
const { expirePendingOrders, PAY_TIMEOUT_MINUTES } = require('./orderExpireService');

/** 扫描间隔（毫秒），默认 60 秒，可用 ORDER_EXPIRE_INTERVAL_MS 覆盖 */
const INTERVAL_MS = Number(process.env.ORDER_EXPIRE_INTERVAL_MS) || 60 * 1000;

let timer = null;
let firstRunTimer = null;

async function runOnce() {
  try {
    const r = await expirePendingOrders();
    if (r.cancelledCount > 0) {
      console.log(
        `[order-expire] 自动取消 ${r.cancelledCount} 笔超时待支付订单，订单ID：${r.cancelledOrderIds.join(', ')}`
      );
    }
  } catch (err) {
    console.error('[order-expire] 定时检查执行异常：', err.message);
  }
}

/**
 * 启动定时任务
 * @param {number} intervalMs 扫描间隔（毫秒）
 */
function startOrderExpireTask(intervalMs = INTERVAL_MS) {
  if (timer) return timer;

  // 启动后延迟 5 秒执行一次，避开服务刚启动时的初始化压力
  firstRunTimer = setTimeout(runOnce, 5000);
  if (firstRunTimer.unref) firstRunTimer.unref();

  timer = setInterval(runOnce, intervalMs);
  if (timer.unref) timer.unref();

  console.log(
    `[order-expire] 定时任务已启动：每 ${Math.round(intervalMs / 1000)} 秒扫描一次，支付超时阈值 ${PAY_TIMEOUT_MINUTES} 分钟`
  );
  return timer;
}

/** 停止定时任务（测试或优雅退出时使用） */
function stopOrderExpireTask() {
  if (firstRunTimer) {
    clearTimeout(firstRunTimer);
    firstRunTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

module.exports = { startOrderExpireTask, stopOrderExpireTask, runOnce };
