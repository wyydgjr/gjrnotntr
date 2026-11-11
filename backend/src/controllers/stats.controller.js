/**
 * ============================================================
 * 文件作用：统计模块——看板各类聚合查询
 * 讲解一句话：所有统计指标都在数据库层用 SQL 聚合完成，前端只负责用 ECharts 渲染。
 * 答辩点：销售额只统计已付款及以上状态（有效订单口径）；低库存阈值 stock<=10；近 N 天趋势用 DATE_SUB。
 * ============================================================
 */
const pool = require('../config/db');
const { ok } = require('../utils/response');

/**
 * 统计总览（管理员）
 * GET /api/stats/overview
 * 统计口径：销售额取 paid/shipped/completed 状态订单
 */
async function overview(_req, res) {
  const [[sales]] = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS totalSales
     FROM orders WHERE status IN ('paid','shipped','completed')`
  );
  const [[valid]] = await pool.query(
    `SELECT COUNT(*) AS total FROM orders WHERE status IN ('paid','shipped','completed')`
  );
  const [[orderCount]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
  const [[userCount]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[productCount]] = await pool.query('SELECT COUNT(*) AS total FROM products');
  const [[lowStock]] = await pool.query(
    'SELECT COUNT(*) AS total FROM products WHERE stock <= 10 AND status = \'on\''
  );

  const totalSales = Number(sales.totalSales);
  const validOrders = Number(valid.total);
  return ok(res, {
    totalSales: totalSales.toFixed(2),
    totalOrders: orderCount.total,
    validOrders,
    avgOrder: validOrders > 0 ? (totalSales / validOrders).toFixed(2) : '0.00',
    totalUsers: userCount.total,
    totalProducts: productCount.total,
    lowStockProducts: lowStock.total,
  });
}

/**
 * 商品分类占比（管理员）
 * GET /api/stats/category
 */
async function categoryRatio(_req, res) {
  const [rows] = await pool.query(
    `SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY count DESC`
  );
  return ok(res, rows);
}

/**
 * 近7天销售额趋势（管理员）
 * GET /api/stats/trend
 */
async function salesTrend(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 30);
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount), 0) AS amount
     FROM orders
     WHERE status IN ('paid','shipped','completed')
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [days - 1]
  );
  return ok(res, rows);
}

/**
 * 近7天订单量趋势（管理员）
 * GET /api/stats/orders-trend
 */
async function ordersTrend(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 30);
  const [rows] = await pool.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count
     FROM orders
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
    [days - 1]
  );
  return ok(res, rows);
}

/**
 * 订单状态分布（管理员）
 * GET /api/stats/status-distribution
 */
async function statusDistribution(_req, res) {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC`
  );
  return ok(res, rows);
}

/**
 * 畅销商品 Top5（管理员，有效订单口径）
 * GET /api/stats/top-products
 */
async function topProducts(_req, res) {
  const [rows] = await pool.query(
    `SELECT oi.product_id AS id,
            COALESCE(p.name, oi.product_name) AS name,
            COALESCE(p.category, '其他') AS category,
            COALESCE(p.image_url, '') AS image_url,
            SUM(oi.quantity) AS sold,
            SUM(oi.subtotal) AS amount
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     LEFT JOIN orders o ON o.id = oi.order_id
     WHERE o.status IN ('paid','shipped','completed')
     GROUP BY oi.product_id, p.name, p.category, p.image_url, oi.product_name
     ORDER BY sold DESC, amount DESC
     LIMIT 5`
  );
  return ok(res, rows.map((r) => ({
    ...r,
    sold: Number(r.sold),
    amount: Number(r.amount).toFixed(2),
  })));
}

/**
 * 低库存商品明细（管理员，库存≤10 且在售）
 * GET /api/stats/low-stock
 */
async function lowStockList(_req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, category, price, stock, status
     FROM products
     WHERE stock <= 10 AND status = 'on'
     ORDER BY stock ASC
     LIMIT 50`
  );
  return ok(res, rows);
}

module.exports = {
  overview, categoryRatio, salesTrend, ordersTrend, lowStockList,
  statusDistribution, topProducts,
};
