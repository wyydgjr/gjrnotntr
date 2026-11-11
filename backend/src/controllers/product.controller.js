/**
 * ============================================================
 * 文件作用：商品模块——列表 / 详情 / 新增 / 更新 / 删除 / 上下架 / 分类
 * 讲解一句话：普通用户只能看到“上架”商品，管理员拥有完整增删改权限。
 * 答辩点：删除被订单引用的商品会触发外键约束，代码捕获后引导改为“下架”而非强删，保护历史订单。
 * ============================================================
 */
const pool = require('../config/db');
const { ok, fail } = require('../utils/response');

/** 拼接商品列表查询条件（支持关键词 / 分类 / 状态 / 分页）；统一使用表别名 p */
function buildListWhere(query, isAdmin) {
  const conditions = [];
  const params = [];

  if (!isAdmin) conditions.push('p.status = ?'), params.push('on'); // 普通用户只看上架商品

  if (query.keyword) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${query.keyword}%`, `%${query.keyword}%`);
  }
  if (query.category) {
    conditions.push('p.category = ?');
    params.push(query.category);
  }
  if (isAdmin && query.status) {
    conditions.push('p.status = ?');
    params.push(query.status);
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereSql, params };
}

/**
 * 排序参数白名单（防 SQL 注入：只允许映射到预定义表达式，绝不拼接用户原始输入）
 * price_asc / price_desc / stock_asc / stock_desc / sales_desc / newest(默认)
 */
const SORT_MAP = {
  price_asc: 'p.price ASC, p.id DESC',
  price_desc: 'p.price DESC, p.id DESC',
  stock_asc: 'p.stock ASC, p.id DESC',
  stock_desc: 'p.stock DESC, p.id DESC',
  sales_desc: 'sales_count DESC, p.id DESC',
  newest: 'p.id DESC',
};

/** 销量子查询：累计已售数量（剔除已取消订单），作为列表字段与排序依据 */
const SALES_SUB_SQL = `(SELECT COALESCE(SUM(oi.quantity), 0)
      FROM order_items oi
      JOIN orders o2 ON o2.id = oi.order_id
     WHERE oi.product_id = p.id AND o2.status <> 'cancelled')`;

/**
 * 商品列表（分页 + 筛选 + 排序）
 * GET /api/products?keyword=&category=&status=&sort=price_asc&page=1&pageSize=10
 */
async function list(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
  const isAdmin = req.user && req.user.role === 'admin';

  const { whereSql, params } = buildListWhere(req.query, isAdmin);
  const offset = (page - 1) * pageSize;
  const sortKey = SORT_MAP[req.query.sort] ? req.query.sort : 'newest';
  const orderSql = SORT_MAP[sortKey];

  const [totalRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
    params
  );
  const [list] = await pool.query(
    `SELECT p.id, p.name, p.description, p.price, p.stock, p.category, p.image_url,
            p.status, p.created_at, p.updated_at,
            ${SALES_SUB_SQL} AS sales_count
     FROM products p ${whereSql}
     ORDER BY ${orderSql}
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return ok(res, {
    list,
    pagination: { page, pageSize, total: totalRows[0].total },
    sort: sortKey,
  });
}

/**
 * 商品详情
 * GET /api/products/:id
 */
async function detail(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '商品ID不合法');

  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return fail(res, 404, '商品不存在');

  // 普通用户不可查看下架商品详情
  if (!req.user || req.user.role !== 'admin') {
    if (rows[0].status === 'off') return fail(res, 404, '商品不存在或已下架');
  }
  return ok(res, rows[0]);
}

/**
 * 创建商品（管理员）
 * POST /api/products
 */
async function create(req, res) {
  const { name, description, price, stock, category, image_url } = req.body || {};
  if (!name) return fail(res, 400, '商品名称不能为空');
  if (price == null || Number(price) < 0) return fail(res, 400, '价格必须为非负数');
  if (stock == null || Number(stock) < 0) return fail(res, 400, '库存必须为非负数');

  const [result] = await pool.query(
    `INSERT INTO products (name, description, price, stock, category, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description || '', Number(price), Number(stock), category || '其他', image_url || null]
  );
  return ok(res, { id: result.insertId }, '商品创建成功');
}

/**
 * 更新商品（管理员）
 * PUT /api/products/:id
 */
async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '商品ID不合法');
  const body = req.body || {};

  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return fail(res, 404, '商品不存在');
  const cur = rows[0];

  // 支持部分字段更新：未传入的字段沿用原值，避免只改库存时把名称/价格覆盖为空
  const next = {
    name: body.name === undefined ? cur.name : String(body.name).trim(),
    description: body.description === undefined ? cur.description : body.description,
    price: body.price === undefined ? Number(cur.price) : Number(body.price),
    stock: body.stock === undefined ? Number(cur.stock) : Number(body.stock),
    category: body.category === undefined ? cur.category : body.category,
    image_url: body.image_url === undefined ? cur.image_url : body.image_url || null,
    status: body.status === undefined ? cur.status : body.status,
  };

  if (!next.name) return fail(res, 400, '商品名称不能为空');
  if (Number.isNaN(next.price) || next.price < 0) return fail(res, 400, '价格必须为非负数');
  if (Number.isNaN(next.stock) || next.stock < 0 || !Number.isInteger(next.stock)) {
    return fail(res, 400, '库存必须为非负整数');
  }
  if (body.status !== undefined && next.status !== 'on' && next.status !== 'off') {
    return fail(res, 400, 'status 只能为 on 或 off');
  }

  await pool.query(
    `UPDATE products
     SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?, status = ?
     WHERE id = ?`,
    [
      next.name,
      next.description || '',
      next.price,
      next.stock,
      next.category || '其他',
      next.image_url,
      next.status === 'off' ? 'off' : 'on',
      id,
    ]
  );
  return ok(res, null, '商品更新成功');
}

/**
 * 删除商品（管理员）
 * DELETE /api/products/:id
 * 若商品已被订单引用，外键约束会拒绝删除，提示改为下架
 */
async function remove(req, res) {
  const id = Number(req.params.id);
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) return fail(res, 404, '商品不存在');
    return ok(res, null, '商品删除成功');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      return fail(res, 400, '该商品已被订单引用，无法删除，建议改为下架');
    }
    throw err;
  }
}

/**
 * 上架/下架切换（管理员）
 * PATCH /api/products/:id/status  body: { status: 'on' | 'off' }
 */
async function toggleStatus(req, res) {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (status !== 'on' && status !== 'off') return fail(res, 400, 'status 只能为 on 或 off');

  const [result] = await pool.query('UPDATE products SET status = ? WHERE id = ?', [status, id]);
  if (result.affectedRows === 0) return fail(res, 404, '商品不存在');
  return ok(res, null, status === 'on' ? '商品已上架' : '商品已下架');
}

/**
 * 商品分类列表（登录用户可见，供商城分类筛选）
 * GET /api/products/categories
 */
async function listCategories(_req, res) {
  // 商城分类计数只统计在售商品，避免分类数量与实际可购买商品数不一致
  const [rows] = await pool.query(
    `SELECT category, COUNT(*) AS count FROM products WHERE status = 'on'
     GROUP BY category ORDER BY count DESC`
  );
  return ok(res, rows);
}

module.exports = { list, detail, create, update, remove, toggleStatus, listCategories };
