/* ==========================================================================
 * 云商优选 · 极简版后端（答辩对照用）
 * --------------------------------------------------------------------------
 * 一句话：把工程版 20 个文件、约 1200 行代码的功能，用一个文件、约 450 行写完。
 * 用途   ：答辩时把「工程版」和「极简版」两套后端并排打开，逐个接口对比讲原理。
 *
 * 运行方式：
 *   cd C:\Users\wyyd\Desktop\实训\backend
 *   node simple-server.js        ← 监听 3001 端口（工程版是 3000，两个可同时开）
 *
 * 和工程版的区别（答辩时讲这个）：
 *   工程版：routes 分层 / controller 分文件 / asyncHandler 包装 / response 工具 / service 服务层 / 连接池模块
 *   极简版：全部平铺在一个文件，路由 + 处理逻辑直接写在一起，只保留「中间件 + 统一返回 + 异常兜底」三个必要抽象
 *   结论  ：功能一模一样（接口路径、参数、返回结构完全兼容），少掉的只是「好维护」，不是「能跑通」
 * ========================================================================== */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const PORT = 3001;
const SECRET = 'simple_secret';        // JWT 签名密钥
const PAY_TIMEOUT = 30;                // 待支付超时分钟数
const MAX_ADDRESS = 20;                // 每人最多地址数
const PHONE_RE = /^1\d{10}$/;

/* ---------------------------- 1. 数据库连接池 ---------------------------- */
const db = mysql.createPool({
  host: '127.0.0.1', port: 3306, user: 'root', password: '123456',
  database: 'ecommerce', connectionLimit: 10, charset: 'utf8mb4',
  dateStrings: true,                    // 日期直接返回字符串，省掉时区转换的坑
});

/* ---------------------------- 2. 应用与中间件 ---------------------------- */
const app = express();
app.use(cors());                        // 极简版放开全部来源，双击 file:// 页面直接能调
app.use(express.json());

// 统一返回格式：{ code, message, data }，code=0 成功
const ok = (res, data = null, message = 'success') => res.json({ code: 0, message, data });
const fail = (res, status, message) => res.status(status).json({ code: status, message, data: null });

// 统一异常兜底：接口里不用写 try/catch，抛错自动变 500 或业务错误
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e.message);
  fail(res, e.status || 500, e.status ? e.message : '服务器内部错误');
});

// 业务错误：用法 throw bad(400, '库存不足')
const bad = (status, message) => Object.assign(new Error(message), { status });

// 鉴权中间件：只校验 Token，不查库（无状态鉴权）
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return fail(res, 401, '未登录，请先登录');
  try {
    req.user = jwt.verify(token, SECRET);   // { id, username, role }
    next();
  } catch (e) {
    fail(res, 401, '登录已过期或无效，请重新登录');
  }
}
// 权限中间件：必须是管理员（RBAC）
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return fail(res, 403, '无权限访问，需要管理员账号');
  next();
}

/* ==========================================================================
 * 3. 认证模块（注册 / 登录 / 个人信息 / 改昵称 / 改密码）
 * ========================================================================== */

// 注册：密码 bcrypt 加盐哈希后入库，数据库永远不存明文
app.post('/api/auth/register', wrap(async (req, res) => {
  const { username, password, nickname } = req.body || {};
  if (!username || !password) return fail(res, 400, '用户名和密码不能为空');
  if (username.length < 3 || username.length > 50) return fail(res, 400, '用户名长度需在3-50位之间');
  if (password.length < 6) return fail(res, 400, '密码长度至少6位');

  const [exist] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
  if (exist.length) return fail(res, 400, '用户名已被注册');

  const hash = bcrypt.hashSync(password, 10);   // 10 = 加盐轮数
  const [r] = await db.query(
    'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
    [username, hash, nickname || username]
  );
  ok(res, { id: r.insertId }, '注册成功');
}));

// 登录：比对哈希 → 签发 Token（载荷含 id / username / role）
app.post('/api/auth/login', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return fail(res, 400, '用户名和密码不能为空');

  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  if (!rows.length) return fail(res, 401, '用户名或密码错误');

  const user = rows[0];
  if (!bcrypt.compareSync(password, user.password)) return fail(res, 401, '用户名或密码错误');

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET, { expiresIn: '2d' }
  );
  ok(res, {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role },
  }, '登录成功');
}));

// 个人信息
app.get('/api/auth/profile', auth, wrap(async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, username, nickname, role, created_at FROM users WHERE id = ?', [req.user.id]
  );
  if (!rows.length) return fail(res, 404, '用户不存在');
  ok(res, rows[0]);
}));

// 改昵称（两种路径都支持）
const changeNickname = wrap(async (req, res) => {
  const nickname = String(req.body?.nickname ?? '').trim();
  if (!nickname) return fail(res, 400, '昵称不能为空');
  if (nickname.length > 50) return fail(res, 400, '昵称长度不能超过50个字符');
  await db.query('UPDATE users SET nickname = ? WHERE id = ?', [nickname, req.user.id]);
  const [rows] = await db.query(
    'SELECT id, username, nickname, role, created_at FROM users WHERE id = ?', [req.user.id]
  );
  ok(res, rows[0], '昵称修改成功');
});
app.put('/api/auth/profile', auth, changeNickname);
app.post('/api/auth/change-nickname', auth, changeNickname);

// 改密码：必须先验旧密码，新密码重新哈希
app.post('/api/auth/change-password', auth, wrap(async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return fail(res, 400, '原密码和新密码不能为空');
  if (String(newPassword).length < 6) return fail(res, 400, '新密码长度至少6位');
  if (String(newPassword) === String(oldPassword)) return fail(res, 400, '新密码不能与原密码相同');

  const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return fail(res, 404, '用户不存在');
  if (!bcrypt.compareSync(String(oldPassword), rows[0].password)) return fail(res, 400, '原密码不正确');

  await db.query('UPDATE users SET password = ? WHERE id = ?',
    [bcrypt.hashSync(String(newPassword), 10), req.user.id]);
  ok(res, null, '密码修改成功，请使用新密码重新登录');
}));

/* ==========================================================================
 * 4. 商品模块（列表 / 详情 / 分类 / 增 / 改 / 删 / 上下架）
 * ========================================================================== */

// 排序白名单：排序字段绝不直接拼用户输入，防 SQL 注入
const SORTS = {
  price_asc: 'p.price ASC, p.id DESC',
  price_desc: 'p.price DESC, p.id DESC',
  stock_asc: 'p.stock ASC, p.id DESC',
  stock_desc: 'p.stock DESC, p.id DESC',
  sales_desc: 'sales_count DESC, p.id DESC',
  newest: 'p.id DESC',
};
// 销量子查询：累计已售，剔除已取消订单
const SALES_SQL = `(SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi
  JOIN orders o2 ON o2.id = oi.order_id
  WHERE oi.product_id = p.id AND o2.status <> 'cancelled')`;

app.get('/api/products', auth, wrap(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
  const isAdmin = req.user.role === 'admin';

  const where = [];      // 条件数组 + 参数数组，两者一一对应
  const params = [];
  if (!isAdmin) { where.push('p.status = ?'); params.push('on'); }   // 普通用户只看在售
  if (req.query.keyword) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`);
  }
  if (req.query.category) { where.push('p.category = ?'); params.push(req.query.category); }
  if (isAdmin && req.query.status) { where.push('p.status = ?'); params.push(req.query.status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sortKey = SORTS[req.query.sort] ? req.query.sort : 'newest';
  const [total] = await db.query(`SELECT COUNT(*) AS total FROM products p ${whereSql}`, params);
  const [list] = await db.query(
    `SELECT p.*, ${SALES_SQL} AS sales_count FROM products p ${whereSql}
     ORDER BY ${SORTS[sortKey]} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  ok(res, { list, pagination: { page, pageSize, total: total[0].total }, sort: sortKey });
}));

// 分类列表（只统计在售商品）
app.get('/api/products/categories', auth, wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT category, COUNT(*) AS count FROM products WHERE status = 'on'
     GROUP BY category ORDER BY count DESC`
  );
  ok(res, rows);
}));

// 商品详情
app.get('/api/products/:id', auth, wrap(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);
  if (!rows.length) return fail(res, 404, '商品不存在');
  if (req.user.role !== 'admin' && rows[0].status === 'off') return fail(res, 404, '商品不存在或已下架');
  ok(res, rows[0]);
}));

// 新增商品
app.post('/api/products', auth, adminOnly, wrap(async (req, res) => {
  const { name, description, price, stock, category, image_url } = req.body || {};
  if (!name) return fail(res, 400, '商品名称不能为空');
  if (price == null || Number(price) < 0) return fail(res, 400, '价格必须为非负数');
  if (stock == null || Number(stock) < 0) return fail(res, 400, '库存必须为非负数');
  const [r] = await db.query(
    'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?,?,?,?,?,?)',
    [name, description || '', Number(price), Number(stock), category || '其他', image_url || null]
  );
  ok(res, { id: r.insertId }, '商品创建成功');
}));

// 编辑商品：未传的字段沿用原值（只改库存不会把名字清空）
app.put('/api/products/:id', auth, adminOnly, wrap(async (req, res) => {
  const id = Number(req.params.id), b = req.body || {};
  const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!rows.length) return fail(res, 404, '商品不存在');
  const cur = rows[0];

  const next = {
    name: b.name === undefined ? cur.name : String(b.name).trim(),
    description: b.description === undefined ? cur.description : b.description,
    price: b.price === undefined ? Number(cur.price) : Number(b.price),
    stock: b.stock === undefined ? Number(cur.stock) : Number(b.stock),
    category: b.category === undefined ? cur.category : b.category,
    image_url: b.image_url === undefined ? cur.image_url : (b.image_url || null),
    status: b.status === undefined ? cur.status : b.status,
  };
  if (!next.name) return fail(res, 400, '商品名称不能为空');
  if (Number.isNaN(next.price) || next.price < 0) return fail(res, 400, '价格必须为非负数');
  if (Number.isNaN(next.stock) || next.stock < 0) return fail(res, 400, '库存必须为非负整数');
  if (b.status !== undefined && !['on', 'off'].includes(next.status)) return fail(res, 400, 'status 只能为 on 或 off');

  await db.query(
    'UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image_url=?, status=? WHERE id=?',
    [next.name, next.description || '', next.price, next.stock, next.category || '其他',
      next.image_url, next.status === 'off' ? 'off' : 'on', id]
  );
  ok(res, null, '商品更新成功');
}));

// 删除商品：被订单引用则拒绝（保护历史订单）
app.delete('/api/products/:id', auth, adminOnly, wrap(async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM products WHERE id = ?', [Number(req.params.id)]);
    if (!r.affectedRows) return fail(res, 404, '商品不存在');
    ok(res, null, '商品删除成功');
  } catch (e) {
    if (String(e.code).startsWith('ER_ROW_IS_REFERENCED')) {
      return fail(res, 400, '该商品已被订单引用，无法删除，建议改为下架');
    }
    throw e;
  }
}));

// 上下架
app.patch('/api/products/:id/status', auth, adminOnly, wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!['on', 'off'].includes(status)) return fail(res, 400, 'status 只能为 on 或 off');
  const [r] = await db.query('UPDATE products SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!r.affectedRows) return fail(res, 404, '商品不存在');
  ok(res, null, status === 'on' ? '商品已上架' : '商品已下架');
}));

/* ==========================================================================
 * 5. 地址簿（列表 / 新增 / 编辑 / 删除 / 设默认）
 * 核心点：所有 SQL 都带 user_id，越权访问自然查不到 → 404
 * ========================================================================== */
const ADDR_TIP = 'id, user_id, receiver, phone, address, is_default, created_at, updated_at';

app.get('/api/addresses', auth, wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT ${ADDR_TIP} FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
    [req.user.id]
  );
  ok(res, rows);
}));

// 新增地址：第一条自动为默认；传 isDefault 时先清零其它默认（事务）
app.post('/api/addresses', auth, wrap(async (req, res) => {
  const receiver = String(req.body?.receiver ?? '').trim();
  const phone = String(req.body?.phone ?? '').trim();
  const address = String(req.body?.address ?? '').trim();
  if (!receiver) return fail(res, 400, '收货人姓名不能为空');
  if (!PHONE_RE.test(phone)) return fail(res, 400, '联系电话格式不正确（11位手机号）');
  if (!address) return fail(res, 400, '收货地址不能为空');

  const [cnt] = await db.query('SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?', [req.user.id]);
  if (cnt[0].total >= MAX_ADDRESS) return fail(res, 400, `最多只能保存 ${MAX_ADDRESS} 个收货地址`);

  const wantDefault = ['1', 1, true].includes(req.body?.isDefault);
  const isDefault = cnt[0].total === 0 ? 1 : (wantDefault ? 1 : 0);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (isDefault) await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    const [r] = await conn.query(
      'INSERT INTO addresses (user_id, receiver, phone, address, is_default) VALUES (?,?,?,?,?)',
      [req.user.id, receiver, phone, address, isDefault]
    );
    await conn.commit();
    ok(res, { id: r.insertId, isDefault: !!isDefault }, '收货地址新增成功');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// 编辑地址
app.put('/api/addresses/:id', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const receiver = String(req.body?.receiver ?? '').trim();
  const phone = String(req.body?.phone ?? '').trim();
  const address = String(req.body?.address ?? '').trim();
  if (!receiver) return fail(res, 400, '收货人姓名不能为空');
  if (!PHONE_RE.test(phone)) return fail(res, 400, '联系电话格式不正确（11位手机号）');
  if (!address) return fail(res, 400, '收货地址不能为空');

  const [rows] = await db.query('SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]);
  if (!rows.length) return fail(res, 404, '收货地址不存在');

  await db.query('UPDATE addresses SET receiver=?, phone=?, address=? WHERE id=? AND user_id=?',
    [receiver, phone, address, id, req.user.id]);
  ok(res, { id, isDefault: rows[0].is_default === 1 }, '收货地址更新成功');
}));

// 删除地址：删掉默认地址后，自动把剩下最新一条提升为默认
app.delete('/api/addresses/:id', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]);
  if (!rows.length) return fail(res, 404, '收货地址不存在');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    let promoted = null;
    if (rows[0].is_default === 1) {
      const [rest] = await conn.query('SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [req.user.id]);
      if (rest.length) {
        promoted = rest[0].id;
        await conn.query('UPDATE addresses SET is_default = 1 WHERE id = ?', [promoted]);
      }
    }
    await conn.commit();
    ok(res, { id, promotedDefaultId: promoted }, '收货地址删除成功');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// 设为默认：事务内先全清零再置 1，保证唯一
app.post('/api/addresses/:id/default', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!rows.length) return fail(res, 404, '收货地址不存在');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await conn.query('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    await conn.commit();
    ok(res, { id }, '已设为默认地址');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

/* ==========================================================================
 * 6. 订单模块（答辩核心：事务 + 行锁 + 状态机）
 * ========================================================================== */

// 订单号：时间戳 + 6 位随机
function genOrderNo() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    + String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
}
// 待支付截止时间与剩余秒数（列表里给前端倒计时用）
const DEADLINE_SQL = `DATE_FORMAT(DATE_ADD(o.created_at, INTERVAL ${PAY_TIMEOUT} MINUTE), '%Y-%m-%d %H:%i:%s')`;
const REMAIN_SQL = `GREATEST(TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(o.created_at, INTERVAL ${PAY_TIMEOUT} MINUTE)),0)`;

// 下单：校验 → 扣库存 → 写订单 → 写明细，全程一个事务
app.post('/api/orders', auth, wrap(async (req, res) => {
  const { items, receiverName, receiverPhone, receiverAddress, remark, addressId } = req.body || {};
  if (!Array.isArray(items) || !items.length) return fail(res, 400, '订单商品不能为空');

  // 收货信息两种来源：优先 addressId（后端回查，防前端篡改），否则用前端手填
  let receiver = {
    name: String(receiverName || '').trim(),
    phone: String(receiverPhone || '').trim(),
    address: String(receiverAddress || '').trim(),
  };
  if (addressId !== undefined && addressId !== null && addressId !== '') {
    const [a] = await db.query(
      'SELECT receiver, phone, address FROM addresses WHERE id = ? AND user_id = ?',
      [Number(addressId), req.user.id]
    );
    if (!a.length) return fail(res, 400, '收货地址不存在或不属于当前用户');
    receiver = { name: a[0].receiver, phone: a[0].phone, address: a[0].address };
  }
  if (!receiver.name || !receiver.phone || !receiver.address) return fail(res, 400, '收货人信息不能为空');
  if (!PHONE_RE.test(receiver.phone)) return fail(res, 400, '收货电话格式不正确');
  const remarkText = String(remark ?? '').trim();
  if (remarkText.length > 255) return fail(res, 400, '订单备注不能超过 255 个字符');

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const snapshot = [];
    let total = 0;
    for (const it of items) {
      const pid = Number(it.productId), qty = Number(it.quantity);
      if (!Number.isInteger(pid) || !Number.isInteger(qty) || qty <= 0) throw bad(400, '商品ID或数量不合法');

      // FOR UPDATE：锁住这行商品，别的事务必须等，防止并发读到同样的库存
      const [rows] = await conn.query(
        'SELECT id, name, price, stock, status FROM products WHERE id = ? FOR UPDATE', [pid]
      );
      if (!rows.length) throw bad(400, `商品 ${pid} 不存在`);
      const p = rows[0];
      if (p.status !== 'on') throw bad(400, `商品「${p.name}」已下架`);
      if (p.stock < qty) throw bad(400, `商品「${p.name}」库存不足`);

      snapshot.push({ id: p.id, name: p.name, price: p.price, qty });
      total += Number(p.price) * qty;
    }

    // 扣库存：条件更新 stock >= qty，数据库层面再拦一次超卖
    for (const s of snapshot) {
      const [u] = await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [s.qty, s.id, s.qty]
      );
      if (!u.affectedRows) throw bad(400, `商品「${s.name}」库存不足`);
    }

    const orderNo = genOrderNo();
    const [o] = await conn.query(
      `INSERT INTO orders (order_no, user_id, total_amount, status, receiver_name, receiver_phone, receiver_address, remark)
       VALUES (?,?,?,'pending',?,?,?,?)`,
      [orderNo, req.user.id, total.toFixed(2), receiver.name, receiver.phone, receiver.address, remarkText || null]
    );

    // 明细存商品快照：以后商品改名改价，历史订单仍显示下单时的样子
    for (const s of snapshot) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES (?,?,?,?,?,?)`,
        [o.insertId, s.id, s.name, s.price, s.qty, (s.price * s.qty).toFixed(2)]
      );
    }

    await conn.commit();
    ok(res, { orderId: o.insertId, orderNo, totalAmount: total.toFixed(2) }, '下单成功');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// 我的订单
app.get('/api/orders/mine', auth, wrap(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
  const params = [req.user.id];
  let whereSql = 'WHERE o.user_id = ?';
  if (req.query.status) { whereSql += ' AND o.status = ?'; params.push(req.query.status); }
  if (req.query.orderNo) { whereSql += ' AND o.order_no LIKE ?'; params.push(`%${req.query.orderNo}%`); }

  const [t] = await db.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);
  const [list] = await db.query(
    `SELECT o.*, ${DEADLINE_SQL} AS pay_deadline,
       CASE WHEN o.status='pending' THEN ${REMAIN_SQL} ELSE NULL END AS pay_remain_seconds
     FROM orders o ${whereSql} ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  ok(res, { list, pagination: { page, pageSize, total: t[0].total } });
}));

// 全部订单（管理员）：archived=1 只看已归档，默认只看未归档
app.get('/api/orders', auth, adminOnly, wrap(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
  const onlyArchived = String(req.query.archived) === '1' || req.query.archived === 'true';

  const params = [onlyArchived ? 1 : 0];
  let whereSql = 'WHERE o.is_archived = ?';
  if (req.query.status) { whereSql += ' AND o.status = ?'; params.push(req.query.status); }
  if (req.query.orderNo) { whereSql += ' AND o.order_no LIKE ?'; params.push(`%${req.query.orderNo}%`); }

  const [t] = await db.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);
  const [list] = await db.query(
    `SELECT o.*, u.username AS buyer, ${DEADLINE_SQL} AS pay_deadline,
       CASE WHEN o.status='pending' THEN ${REMAIN_SQL} ELSE NULL END AS pay_remain_seconds
     FROM orders o LEFT JOIN users u ON u.id = o.user_id ${whereSql}
     ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  ok(res, { list, pagination: { page, pageSize, total: t[0].total }, archived: onlyArchived ? 1 : 0 });
}));

// 超时检查（挂个定时器也行，答辩演示手动点也行）
app.post('/api/orders/expire-check', auth, adminOnly, wrap(async (req, res) => {
  const minutes = Number(req.body?.timeoutMinutes) > 0 ? Number(req.body.timeoutMinutes) : PAY_TIMEOUT;
  const result = await expirePendingOrders(minutes);
  ok(res, result, `本次自动取消 ${result.cancelledCount} 笔超时待支付订单`);
}));

// 订单详情（本人或管理员）
app.get('/api/orders/:id', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.query(
    `SELECT o.*, ${DEADLINE_SQL} AS pay_deadline,
       CASE WHEN o.status='pending' THEN ${REMAIN_SQL} ELSE NULL END AS pay_remain_seconds
     FROM orders o WHERE o.id = ?`, [id]
  );
  if (!rows.length) return fail(res, 404, '订单不存在');
  const order = rows[0];
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) return fail(res, 403, '无权查看他人订单');

  const [items] = await db.query(
    'SELECT id, product_id, product_name, price, quantity, subtotal FROM order_items WHERE order_id = ?', [id]
  );
  ok(res, { ...order, items });
}));

// 支付：pending → paid；顺手拦住「已超时但定时任务还没扫到」的订单
app.post('/api/orders/:id/pay', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT *, (created_at <= DATE_SUB(NOW(), INTERVAL ${PAY_TIMEOUT} MINUTE)) AS is_expired
       FROM orders WHERE id = ? FOR UPDATE`, [id]
    );
    if (!rows.length) throw bad(404, '订单不存在');
    const order = rows[0];
    if (order.user_id !== req.user.id) throw bad(403, '无权操作他人订单');
    if (order.status !== 'pending') throw bad(400, '仅待支付订单可支付');

    if (Number(order.is_expired) === 1) {
      await rollbackStock(conn, id);    // 超时单：当场取消并还库存
      await conn.query("UPDATE orders SET status='cancelled' WHERE id=? AND status='pending'", [id]);
      await conn.commit();
      return fail(res, 400, `订单已超过 ${PAY_TIMEOUT} 分钟未支付，已自动取消并释放库存`);
    }
    await conn.query("UPDATE orders SET status='paid' WHERE id=?", [id]);
    await conn.commit();
    ok(res, { id, status: 'paid' }, '支付成功');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// 取消订单：只有待支付能取消，取消要把库存加回去
app.post('/api/orders/:id/cancel', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw bad(404, '订单不存在');
    const order = rows[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) throw bad(403, '无权操作他人订单');
    if (order.status !== 'pending') throw bad(400, '仅待支付订单可取消');

    await rollbackStock(conn, id);
    await conn.query("UPDATE orders SET status='cancelled' WHERE id=?", [id]);
    await conn.commit();
    ok(res, null, '订单已取消');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// 确认收货：shipped → completed
app.post('/api/orders/:id/confirm', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (!rows.length) return fail(res, 404, '订单不存在');
  if (rows[0].user_id !== req.user.id) return fail(res, 403, '无权操作他人订单');
  if (rows[0].status !== 'shipped') return fail(res, 400, '仅已发货订单可确认收货');

  await db.query("UPDATE orders SET status='completed' WHERE id=?", [id]);
  ok(res, { id, status: 'completed' }, '确认收货成功');
}));

// 管理员改状态 / 发货：状态机只允许一格一格往前推
app.post('/api/orders/:id/status', auth, adminOnly, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const { status, expressCompany, expressNo } = req.body || {};
  if (!['paid', 'shipped', 'completed'].includes(status)) {
    return fail(res, 400, 'status 只能为 paid / shipped / completed');
  }
  const company = String(expressCompany ?? '').trim();
  const code = String(expressNo ?? '').trim();
  if (code && !/^[A-Za-z0-9-]{5,64}$/.test(code)) {
    return fail(res, 400, '物流单号格式不正确（5-64 位数字/字母/短横线）');
  }

  const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (!rows.length) return fail(res, 404, '订单不存在');

  const flow = { pending: 0, paid: 1, shipped: 2, completed: 3, cancelled: -1 };
  if (flow[status] !== flow[rows[0].status] + 1) {
    return fail(res, 400, `订单状态不允许从 ${rows[0].status} 流转到 ${status}`);
  }

  if (status === 'shipped') {
    await db.query(
      'UPDATE orders SET status=?, shipped_at=NOW(), express_company=?, express_no=? WHERE id=?',
      [status, company || rows[0].express_company, code || rows[0].express_no, id]
    );
  } else {
    await db.query('UPDATE orders SET status=? WHERE id=?', [status, id]);
  }
  ok(res, { id, status }, status === 'shipped' ? '发货成功，物流信息已记录' : '订单状态更新成功');
}));

// 备注
app.post('/api/orders/:id/remark', auth, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const raw = String(req.body?.remark ?? '').trim();
  if (raw.length > 255) return fail(res, 400, '订单备注不能超过 255 个字符');

  const [rows] = await db.query('SELECT id, user_id FROM orders WHERE id = ?', [id]);
  if (!rows.length) return fail(res, 404, '订单不存在');
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) return fail(res, 403, '无权操作他人订单');

  await db.query('UPDATE orders SET remark = ? WHERE id = ?', [raw || null, id]);
  ok(res, { id, remark: raw || null }, raw ? '订单备注已保存' : '订单备注已清空');
}));

// 归档 / 取消归档（软删除：只从列表隐藏，数据留着）
app.post('/api/orders/:id/archive', auth, adminOnly, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT status, is_archived FROM orders WHERE id = ?', [id]);
  if (!rows.length) return fail(res, 404, '订单不存在');
  if (Number(rows[0].is_archived) === 1) return fail(res, 400, '该订单已归档，无需重复归档');
  if (!['completed', 'cancelled'].includes(rows[0].status)) {
    return fail(res, 400, `仅已完成或已取消的订单可归档，当前订单状态为 ${rows[0].status}`);
  }
  await db.query('UPDATE orders SET is_archived = 1 WHERE id = ?', [id]);
  ok(res, { id, is_archived: 1 }, '订单已归档，数据保留可追溯');
}));

app.post('/api/orders/:id/unarchive', auth, adminOnly, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT is_archived FROM orders WHERE id = ?', [id]);
  if (!rows.length) return fail(res, 404, '订单不存在');
  if (Number(rows[0].is_archived) === 0) return fail(res, 400, '该订单未归档，无需取消归档');
  await db.query('UPDATE orders SET is_archived = 0 WHERE id = ?', [id]);
  ok(res, { id, is_archived: 0 }, '订单已取消归档');
}));

/* ------------------- 库存回滚 + 超时取消（被上面两个接口复用） ------------------- */
async function rollbackStock(conn, orderId) {
  const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
  for (const it of items) {
    await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
  }
}

async function expirePendingOrders(timeoutMinutes = PAY_TIMEOUT) {
  const [rows] = await db.query(
    `SELECT id FROM orders WHERE status='pending'
       AND created_at <= DATE_SUB(NOW(), INTERVAL ? MINUTE) LIMIT 200`, [timeoutMinutes]
  );
  const cancelled = [];
  for (const r of rows) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [lock] = await conn.query("SELECT status FROM orders WHERE id = ? FOR UPDATE", [r.id]);
      if (lock.length && lock[0].status === 'pending') {
        await rollbackStock(conn, r.id);
        await conn.query("UPDATE orders SET status='cancelled' WHERE id=?", [r.id]);
        cancelled.push(r.id);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      console.error('超时取消失败', r.id, e.message);
    } finally {
      conn.release();
    }
  }
  return { scannedCount: rows.length, cancelledCount: cancelled.length, cancelledOrderIds: cancelled, timeoutMinutes };
}

// 定时任务：每 60 秒扫一次超时未支付订单（和工程版同口径）
setInterval(() => {
  expirePendingOrders().then((r) => {
    if (r.cancelledCount) console.log(`[超时取消] ${r.cancelledCount} 笔`);
  }).catch((e) => console.error(e.message));
}, 60000);

/* ==========================================================================
 * 7. 统计模块（7 个看板接口，全是 SQL 聚合）
 * ========================================================================== */
const VALID = "status IN ('paid','shipped','completed')";   // 有效订单口径

app.get('/api/stats/overview', auth, adminOnly, wrap(async (req, res) => {
  const [[s]] = await db.query(`SELECT COALESCE(SUM(total_amount),0) AS totalSales FROM orders WHERE ${VALID}`);
  const [[v]] = await db.query(`SELECT COUNT(*) AS total FROM orders WHERE ${VALID}`);
  const [[o]] = await db.query('SELECT COUNT(*) AS total FROM orders');
  const [[u]] = await db.query('SELECT COUNT(*) AS total FROM users');
  const [[p]] = await db.query('SELECT COUNT(*) AS total FROM products');
  const [[l]] = await db.query("SELECT COUNT(*) AS total FROM products WHERE stock <= 10 AND status='on'");

  const totalSales = Number(s.totalSales), validOrders = Number(v.total);
  ok(res, {
    totalSales: totalSales.toFixed(2),
    totalOrders: o.total,
    validOrders,
    avgOrder: validOrders > 0 ? (totalSales / validOrders).toFixed(2) : '0.00',
    totalUsers: u.total,
    totalProducts: p.total,
    lowStockProducts: l.total,
  });
}));

app.get('/api/stats/category', auth, adminOnly, wrap(async (req, res) => {
  const [rows] = await db.query('SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY count DESC');
  ok(res, rows);
}));

app.get('/api/stats/trend', auth, adminOnly, wrap(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 30);
  const [rows] = await db.query(
    `SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount),0) AS amount
     FROM orders WHERE ${VALID} AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at) ORDER BY date`, [days - 1]
  );
  ok(res, rows);
}));

app.get('/api/stats/orders-trend', auth, adminOnly, wrap(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 30);
  const [rows] = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM orders
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(created_at) ORDER BY date`, [days - 1]
  );
  ok(res, rows);
}));

app.get('/api/stats/status-distribution', auth, adminOnly, wrap(async (req, res) => {
  const [rows] = await db.query('SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC');
  ok(res, rows);
}));

app.get('/api/stats/top-products', auth, adminOnly, wrap(async (req, res) => {
  const [rows] = await db.query(
    `SELECT oi.product_id AS id, COALESCE(p.name, oi.product_name) AS name,
            COALESCE(p.category,'其他') AS category, COALESCE(p.image_url,'') AS image_url,
            SUM(oi.quantity) AS sold, SUM(oi.subtotal) AS amount
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.${VALID}
     GROUP BY oi.product_id, p.name, p.category, p.image_url, oi.product_name
     ORDER BY sold DESC, amount DESC LIMIT 5`
  );
  ok(res, rows.map((r) => ({ ...r, sold: Number(r.sold), amount: Number(r.amount).toFixed(2) })));
}));

app.get('/api/stats/low-stock', auth, adminOnly, wrap(async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, name, category, price, stock, status FROM products WHERE stock <= 10 AND status='on' ORDER BY stock ASC LIMIT 50"
  );
  ok(res, rows);
}));

/* ---------------------------- 8. 兜底与启动 ---------------------------- */
app.get('/api/health', (req, res) => ok(res, { status: 'ok', mode: 'simple' }));
app.use((req, res) => fail(res, 404, `接口不存在：${req.method} ${req.originalUrl}`));

app.listen(PORT, () => {
  console.log('=========================================');
  console.log(`  极简版后端已启动：http://localhost:${PORT}`);
  console.log('  用 node simple-server.js 启动（工程版是 3000）');
  console.log('  默认账号 admin/admin123、user/user123');
  console.log('=========================================');
});
