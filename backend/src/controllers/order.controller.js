/**
 * 讲解一句话：下单用事务保证“扣库存 + 写订单 + 写明细”要么全部成功、要么全部回滚。
 * 答辩点：FOR UPDATE 行锁 + 条件更新防超卖；订单状态机按序流转；取消订单回滚库存；订单明细存商品快照。
 */
const pool = require('../config/db');
const { ok, fail } = require('../utils/response');
// 待支付超时自动取消：服务层复用（与手动取消同一套库存回滚口径）
const { expirePendingOrders, PAY_TIMEOUT_MINUTES } = require('../services/orderExpireService');

/**
 * 待支付剩余时间相关 SQL 表达式（统一以 orders 别名为 o）
 * pay_deadline        ：支付截止时间 = 下单时间 + 超时分钟数
 * pay_remain_seconds  ：剩余秒数（仅 pending 有意义，其它状态返回 NULL）
 */
const PAY_DEADLINE_SQL = `DATE_FORMAT(DATE_ADD(o.created_at, INTERVAL ${PAY_TIMEOUT_MINUTES} MINUTE), '%Y-%m-%d %H:%i:%s')`;
const PAY_REMAIN_SQL = `GREATEST(TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(o.created_at, INTERVAL ${PAY_TIMEOUT_MINUTES} MINUTE)), 0)`;

/** 生成业务订单号：yyyyMMddHHmmss + 6位随机数 */
function genOrderNo() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `${ts}${rand}`;
}

/**
 * 创建订单（登录用户）
 * POST /api/orders  body: { items: [{productId, quantity}], receiverName, receiverPhone, receiverAddress }
 * 事务：校验商品 → 扣库存 → 写订单 → 写明细
 */
async function create(req, res) {
  const { items, receiverName, receiverPhone, receiverAddress, remark, addressId } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return fail(res, 400, '订单商品不能为空');

  // 收货信息两种来源：address_id（地址簿，后端回填，防篡改） / 前端手填（兼容旧流程）
  let receiver = {
    name: String(receiverName || '').trim(),
    phone: String(receiverPhone || '').trim(),
    address: String(receiverAddress || '').trim(),
  };
  const addrId = addressId === undefined || addressId === null || addressId === '' ? null : Number(addressId);
  if (addrId !== null) {
    if (!Number.isInteger(addrId) || addrId <= 0) return fail(res, 400, '收货地址ID不合法');
    // 越权校验：只能使用自己名下的地址
    const [addrRows] = await pool.query(
      'SELECT id, receiver, phone, address FROM addresses WHERE id = ? AND user_id = ?',
      [addrId, req.user.id]
    );
    if (addrRows.length === 0) return fail(res, 400, '收货地址不存在或不属于当前用户');
    receiver = {
      name: addrRows[0].receiver,
      phone: addrRows[0].phone,
      address: addrRows[0].address,
    };
  }
  if (!receiver.name || !receiver.phone || !receiver.address) {
    return fail(res, 400, '收货人信息不能为空');
  }
  if (receiver.name.length > 50) return fail(res, 400, '收货人姓名不能超过 50 个字符');
  if (!/^1\d{10}$/.test(receiver.phone)) return fail(res, 400, '收货电话格式不正确');
  if (receiver.address.length > 255) return fail(res, 400, '收货地址不能超过 255 个字符');
  // 订单备注（可选，最长 255 字符）
  const remarkText = remark === undefined || remark === null ? '' : String(remark).trim();
  if (remarkText.length > 255) return fail(res, 400, '订单备注不能超过 255 个字符');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 收集商品快照
    const snapshot = [];
    let totalAmount = 0;
    for (const item of items) {
      const pid = Number(item.productId);
      const qty = Number(item.quantity);
      if (!Number.isInteger(pid) || !Number.isInteger(qty) || qty <= 0) {
        throw Object.assign(new Error('商品ID或数量不合法'), { status: 400 });
      }

      // FOR UPDATE 行锁：锁定该商品行，防止并发下单时多个请求同时读到相同库存
      const [rows] = await conn.query(
        'SELECT id, name, price, stock, status FROM products WHERE id = ? FOR UPDATE',
        [pid]
      );
      if (rows.length === 0) throw Object.assign(new Error(`商品 ${pid} 不存在`), { status: 400 });
      const p = rows[0];
      if (p.status !== 'on') throw Object.assign(new Error(`商品「${p.name}」已下架`), { status: 400 });
      if (p.stock < qty) throw Object.assign(new Error(`商品「${p.name}」库存不足`), { status: 400 });

      snapshot.push({ productId: p.id, name: p.name, price: p.price, quantity: qty });
      totalAmount += Number(p.price) * qty;
    }

    // 扣减库存（条件更新，防止并发超卖）
    for (const s of snapshot) {
      const [upd] = await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [s.quantity, s.productId, s.quantity]
      );
      if (upd.affectedRows === 0) {
        throw Object.assign(new Error(`商品「${s.name}」库存不足`), { status: 400 });
      }
    }

    // 写订单主表
    const orderNo = genOrderNo();
    const [orderRes] = await conn.query(
      `INSERT INTO orders (order_no, user_id, total_amount, status, receiver_name, receiver_phone, receiver_address, remark)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [orderNo, req.user.id, totalAmount.toFixed(2), receiver.name, receiver.phone, receiver.address, remarkText || null]
    );
    const orderId = orderRes.insertId;

    // 订单明细快照：保存下单时的商品名与单价，后续商品改价/下架不影响历史订单展示
    // 写订单明细
    for (const s of snapshot) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, s.productId, s.name, s.price, s.quantity, (s.price * s.quantity).toFixed(2)]
      );
    }

    await conn.commit();
    return ok(res, { orderId, orderNo, totalAmount: totalAmount.toFixed(2) }, '下单成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 我的订单列表（登录用户）
 * GET /api/orders/mine?status=&page=&pageSize=
 */
async function myOrders(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
  const conditions = ['o.user_id = ?'];
  const params = [req.user.id];

  if (req.query.status) {
    conditions.push('o.status = ?');
    params.push(req.query.status);
  }
  // 支持按订单号模糊搜索
  if (req.query.orderNo) {
    conditions.push('o.order_no LIKE ?');
    params.push(`%${req.query.orderNo}%`);
  }

  const whereSql = `WHERE ${conditions.join(' AND ')}`;
  const [totalRows] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);
  const [list] = await pool.query(
    `SELECT o.id, o.order_no, o.total_amount, o.status, o.receiver_name, o.receiver_phone, o.receiver_address,
            o.express_company, o.express_no, o.shipped_at, o.remark, o.created_at,
            ${PAY_DEADLINE_SQL} AS pay_deadline,
            CASE WHEN o.status = 'pending' THEN ${PAY_REMAIN_SQL} ELSE NULL END AS pay_remain_seconds
     FROM orders o ${whereSql}
     ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );

  return ok(res, { list, pagination: { page, pageSize, total: totalRows[0].total } });
}

/**
 * 全部订单列表（管理员）
 * GET /api/orders?status=&orderNo=&archived=&page=&pageSize=
 * 归档说明：默认只返回未归档订单（is_archived = 0）；传 archived=1 时只返回已归档订单。
 * 归档仅做列表隐藏（软删除），订单数据本身完整保留，可随时取消归档恢复。
 */
async function allOrders(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
  const conditions = [];
  const params = [];

  // 归档过滤：archived=1 看已归档；其余情况（默认/0）只看未归档
  const onlyArchived = String(req.query.archived) === '1' || req.query.archived === 'true';
  conditions.push('o.is_archived = ?');
  params.push(onlyArchived ? 1 : 0);

  if (req.query.status) {
    conditions.push('o.status = ?');
    params.push(req.query.status);
  }
  if (req.query.orderNo) {
    conditions.push('o.order_no LIKE ?');
    params.push(`%${req.query.orderNo}%`);
  }
  const whereSql = `WHERE ${conditions.join(' AND ')}`;

  const [totalRows] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);
  const [list] = await pool.query(
    `SELECT o.id, o.order_no, o.user_id, u.username AS buyer, o.total_amount, o.status,
            o.receiver_name, o.receiver_phone, o.receiver_address,
            o.express_company, o.express_no, o.shipped_at, o.remark,
            o.created_at, o.is_archived,
            ${PAY_DEADLINE_SQL} AS pay_deadline,
            CASE WHEN o.status = 'pending' THEN ${PAY_REMAIN_SQL} ELSE NULL END AS pay_remain_seconds
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ${whereSql}
     ORDER BY o.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );

  return ok(res, { list, pagination: { page, pageSize, total: totalRows[0].total }, archived: onlyArchived ? 1 : 0 });
}

/**
 * 归档订单（管理员，软删除）
 * POST /api/orders/:id/archive
 * 规则：仅 completed / cancelled 允许归档；数据保留，仅从默认列表隐藏
 */
async function archive(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '订单ID不合法');

  const [rows] = await pool.query('SELECT id, order_no, status, is_archived FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return fail(res, 404, '订单不存在');

  const order = rows[0];
  if (Number(order.is_archived) === 1) return fail(res, 400, '该订单已归档，无需重复归档');
  if (!['completed', 'cancelled'].includes(order.status)) {
    return fail(res, 400, '仅已完成或已取消的订单可归档，当前订单状态为 ' + order.status);
  }

  await pool.query('UPDATE orders SET is_archived = 1 WHERE id = ?', [id]);
  return ok(res, { id, is_archived: 1 }, '订单已归档，数据保留可追溯');
}

/**
 * 取消归档（管理员）
 * POST /api/orders/:id/unarchive
 */
async function unarchive(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '订单ID不合法');

  const [rows] = await pool.query('SELECT id, is_archived FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return fail(res, 404, '订单不存在');
  if (Number(rows[0].is_archived) === 0) return fail(res, 400, '该订单未归档，无需取消归档');

  await pool.query('UPDATE orders SET is_archived = 0 WHERE id = ?', [id]);
  return ok(res, { id, is_archived: 0 }, '订单已取消归档');
}

/**
 * 订单详情（本人或管理员）
 * GET /api/orders/:id
 */
async function detail(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '订单ID不合法');

  const [orders] = await pool.query(
    `SELECT o.*,
            ${PAY_DEADLINE_SQL} AS pay_deadline,
            CASE WHEN o.status = 'pending' THEN ${PAY_REMAIN_SQL} ELSE NULL END AS pay_remain_seconds
     FROM orders o WHERE o.id = ?`,
    [id]
  );
  if (orders.length === 0) return fail(res, 404, '订单不存在');

  const order = orders[0];
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && order.user_id !== req.user.id) return fail(res, 403, '无权查看他人订单');

  const [items] = await pool.query(
    'SELECT id, product_id, product_name, price, quantity, subtotal FROM order_items WHERE order_id = ?',
    [id]
  );
  return ok(res, { ...order, items });
}

/**
 * 取消订单（本人，仅限待支付状态；回滚库存）
 * POST /api/orders/:id/cancel
 */
async function cancel(req, res) {
  const id = Number(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) throw Object.assign(new Error('订单不存在'), { status: 404 });

    const order = rows[0];
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && order.user_id !== req.user.id) {
      throw Object.assign(new Error('无权操作他人订单'), { status: 403 });
    }
    if (order.status !== 'pending') {
      throw Object.assign(new Error('仅待支付订单可取消'), { status: 400 });
    }

    // 回滚库存
    const [items] = await conn.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [id]
    );
    for (const it of items) {
      await conn.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [it.quantity, it.product_id]
      );
    }

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [id]);
    await conn.commit();
    return ok(res, null, '订单已取消');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 支付订单（本人，仅限待支付状态）：pending → paid
 * POST /api/orders/:id/pay
 */
async function payOrder(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '订单ID不合法');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT *, (created_at <= DATE_SUB(NOW(), INTERVAL ${PAY_TIMEOUT_MINUTES} MINUTE)) AS is_expired
       FROM orders WHERE id = ? FOR UPDATE`,
      [id]
    );
    if (rows.length === 0) throw Object.assign(new Error('订单不存在'), { status: 404 });

    const order = rows[0];
    if (order.user_id !== req.user.id) {
      throw Object.assign(new Error('无权操作他人订单'), { status: 403 });
    }
    if (order.status !== 'pending') {
      throw Object.assign(new Error('仅待支付订单可支付'), { status: 400 });
    }

    // 已超时的待支付订单：当场取消并回滚库存，避免定时任务未跑到时被"复活支付"
    if (Number(order.is_expired) === 1) {
      const [items] = await conn.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );
      for (const it of items) {
        await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [
          it.quantity,
          it.product_id,
        ]);
      }
      await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'", [id]);
      await conn.commit();
      return fail(res, 400, `订单已超过 ${PAY_TIMEOUT_MINUTES} 分钟未支付，已自动取消并释放库存`);
    }

    await conn.query("UPDATE orders SET status = 'paid' WHERE id = ?", [id]);
    await conn.commit();
    return ok(res, { id, status: 'paid' }, '支付成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 确认收货（本人，仅限已发货状态）：shipped → completed
 * POST /api/orders/:id/confirm
 */
async function confirmOrder(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '订单ID不合法');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) throw Object.assign(new Error('订单不存在'), { status: 404 });

    const order = rows[0];
    if (order.user_id !== req.user.id) {
      throw Object.assign(new Error('无权操作他人订单'), { status: 403 });
    }
    if (order.status !== 'shipped') {
      throw Object.assign(new Error('仅已发货订单可确认收货'), { status: 400 });
    }

    await conn.query("UPDATE orders SET status = 'completed' WHERE id = ?", [id]);
    await conn.commit();
    return ok(res, { id, status: 'completed' }, '确认收货成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 更新订单状态（管理员）：pending→paid→shipped→completed
 * POST /api/orders/:id/status  body: { status, expressCompany?, expressNo? }
 * 说明：流转到 shipped 时可同时写入快递公司/物流单号，并记录发货时间 shipped_at = NOW()。
 *      物流单号为选填（兼容原有仅传 status 的调用），前端发货弹窗强制必填。
 */
async function updateStatus(req, res) {
  const id = Number(req.params.id);
  const { status, expressCompany, expressNo } = req.body || {};

  const allowed = ['paid', 'shipped', 'completed'];
  if (!allowed.includes(status)) {
    return fail(res, 400, `status 只能为 ${allowed.join(' / ')}`);
  }

  const company = expressCompany === undefined || expressCompany === null ? '' : String(expressCompany).trim();
  const expressCode = expressNo === undefined || expressNo === null ? '' : String(expressNo).trim();
  if (company.length > 50) return fail(res, 400, '快递公司名称不能超过 50 个字符');
  if (expressCode.length > 64) return fail(res, 400, '物流单号不能超过 64 个字符');
  if (expressCode && !/^[A-Za-z0-9-]{5,64}$/.test(expressCode)) {
    return fail(res, 400, '物流单号格式不正确（5-64 位数字/字母/短横线）');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id]);
    if (rows.length === 0) throw Object.assign(new Error('订单不存在'), { status: 404 });

    const order = rows[0];
    // 简单状态机校验：只能按 待支付→已支付→已发货→已完成 顺序流转
    const flow = { pending: 0, paid: 1, shipped: 2, completed: 3, cancelled: -1 };
    if (flow[status] !== flow[order.status] + 1) {
      throw Object.assign(new Error(`订单状态不允许从 ${order.status} 流转到 ${status}`), {
        status: 400,
      });
    }

    let sql = 'UPDATE orders SET status = ?';
    const sqlParams = [status];
    if (status === 'shipped') {
      // 发货：记录发货时间，并写入物流信息（有则写，无则保留原值）
      sql += ', shipped_at = NOW()';
      if (company) {
        sql += ', express_company = ?';
        sqlParams.push(company);
      }
      if (expressCode) {
        sql += ', express_no = ?';
        sqlParams.push(expressCode);
      }
    }
    sql += ' WHERE id = ?';
    sqlParams.push(id);

    await conn.query(sql, sqlParams);
    await conn.commit();
    return ok(
      res,
      { id, status, express_company: company || order.express_company, express_no: expressCode || order.express_no },
      status === 'shipped' ? '发货成功，物流信息已记录' : '订单状态更新成功'
    );
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 手动触发待支付超时检查（管理员，便于答辩演示定时任务效果）
 * POST /api/orders/expire-check  body: { timeoutMinutes? }
 * 返回：本次扫描的候选条数、实际取消条数、被取消的订单ID列表
 */
async function expireCheck(req, res) {
  const { timeoutMinutes } = req.body || {};
  const minutes = Number(timeoutMinutes);
  const result = await expirePendingOrders(Number.isFinite(minutes) && minutes > 0 ? { timeoutMinutes: minutes } : {});
  return ok(res, result, `本次自动取消 ${result.cancelledCount} 笔超时待支付订单`);
}

/**
 * 保存订单备注（本人或管理员）
 * POST /api/orders/:id/remark  body: { remark }
 */
async function updateRemark(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return fail(res, 400, '订单ID不合法');

  const { remark } = req.body || {};
  const raw = remark === undefined || remark === null ? '' : String(remark).trim();
  if (raw.length > 255) return fail(res, 400, '订单备注不能超过 255 个字符');

  const [rows] = await pool.query('SELECT id, user_id FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return fail(res, 404, '订单不存在');
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
    return fail(res, 403, '无权操作他人订单');
  }

  const value = raw === '' ? null : raw;
  await pool.query('UPDATE orders SET remark = ? WHERE id = ?', [value, id]);
  return ok(res, { id, remark: value }, value ? '订单备注已保存' : '订单备注已清空');
}

module.exports = {
  create, myOrders, allOrders, detail, cancel, payOrder, confirmOrder, updateStatus,
  archive, unarchive, expireCheck, updateRemark,
};
