/**
 * ============================================================
 * 文件作用：待支付订单超时自动取消服务（功能1 核心逻辑）
 * 讲解一句话：把「超过 N 分钟仍未支付」的 pending 订单逐笔放进事务，加 FOR UPDATE 行锁复核状态，
 *            确认仍是 pending 才回滚库存并置为 cancelled，保证与手动取消口径一致、绝不重复回滚。
 * 答辩点：
 *  1) 两次状态校验：先粗筛候选列表，再在事务内 FOR UPDATE 复核，避免「扫描后用户刚好支付」造成误取消；
 *  2) 库存回滚口径与 order.controller.js 的 cancel 完全一致（按 order_items 逐条加回 products.stock）；
 *  3) 逐笔独立事务：单笔失败不影响其它订单，异常回滚后继续处理下一笔；
 *  4) 幂等：UPDATE 带 status = 'pending' 条件，重复执行不会二次取消，也不会二次加库存。
 * ============================================================
 */
const pool = require('../config/db');

/** 支付超时时间（分钟），默认 30，可通过环境变量 ORDER_PAY_TIMEOUT_MINUTES 覆盖 */
const PAY_TIMEOUT_MINUTES = Number(process.env.ORDER_PAY_TIMEOUT_MINUTES) || 30;

/**
 * 取消单笔待支付订单并回滚库存（事务 + FOR UPDATE）
 * @returns {Promise<boolean>} true=本次确实取消；false=状态已变（已支付/已取消），跳过
 */
async function cancelOneIfPending(orderId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 行锁复核：只有仍然是 pending 的订单才处理，防止与支付/手动取消并发冲突
    const [rows] = await conn.query('SELECT id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (rows.length === 0 || rows[0].status !== 'pending') {
      await conn.commit();
      return false;
    }

    // 回滚库存（与手动取消口径一致）
    const [items] = await conn.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );
    for (const it of items) {
      await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
        it.quantity,
        it.product_id,
      ]);
    }

    // 幂等保护：带 status = 'pending' 条件，重复执行不会二次取消
    const [upd] = await conn.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
      [orderId]
    );
    await conn.commit();
    return upd.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 扫描并取消所有超时的待支付订单
 * @param {{ timeoutMinutes?: number }} options
 * @returns {Promise<{ cancelledCount: number, cancelledOrderIds: number[], scannedCount: number,
 *                     timeoutMinutes: number, checkedAt: string }>}
 */
async function expirePendingOrders(options = {}) {
  const timeoutMinutes = Number(options.timeoutMinutes) || PAY_TIMEOUT_MINUTES;

  // 粗筛候选：状态为待支付且下单时间早于「当前时间 - 超时分钟数」
  const [candidates] = await pool.query(
    `SELECT id FROM orders
     WHERE status = 'pending' AND created_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY id ASC`,
    [timeoutMinutes]
  );

  const cancelledOrderIds = [];
  for (const row of candidates) {
    try {
      const done = await cancelOneIfPending(row.id);
      if (done) cancelledOrderIds.push(row.id);
    } catch (err) {
      // 单笔失败不影响其它订单，记录后继续
      console.error(`[order-expire] 订单 ${row.id} 自动取消失败：`, err.message);
    }
  }

  return {
    cancelledCount: cancelledOrderIds.length,
    cancelledOrderIds,
    scannedCount: candidates.length,
    timeoutMinutes,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { PAY_TIMEOUT_MINUTES, expirePendingOrders, cancelOneIfPending };
