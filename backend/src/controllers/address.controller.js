/**
 * ============================================================
 * 文件作用：收货地址簿模块——列表 / 新增 / 编辑 / 删除 / 设为默认（答辩重点文件）
 * 讲解一句话：地址簿是 orders 收货信息的“数据来源”，下单时后端按 address_id 回填并校验归属，避免前端传入虚假收货信息。
 * 答辩点：① 全部接口按 req.user.id 过滤，越权访问他人地址返回 404/400；
 *         ② 默认地址唯一性用事务内「先清零再置 1」保证，避免并发出现两个默认；
 *         ③ 删除默认地址后自动把最新的一条提升为默认，保证列表始终有可用默认项。
 * ============================================================
 */
const pool = require('../config/db');
const { ok, fail } = require('../utils/response');

const MAX_ADDRESSES = 20; // 单用户地址数量上限，防止恶意刷上限
const PHONE_RE = /^1\d{10}$/;

/** 校验并规整请求体中的地址字段 */
function normalizeBody(body) {
  return {
    receiver: String(body.receiver ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
    address: String(body.address ?? '').trim(),
  };
}

/** 统一校验，返回错误文案（null 表示通过） */
function validate(fields) {
  if (!fields.receiver) return '收货人姓名不能为空';
  if (fields.receiver.length > 50) return '收货人姓名不能超过 50 个字符';
  if (!fields.phone) return '联系电话不能为空';
  if (!PHONE_RE.test(fields.phone)) return '联系电话格式不正确（11位手机号）';
  if (!fields.address) return '收货地址不能为空';
  if (fields.address.length > 255) return '收货地址不能超过 255 个字符';
  return null;
}

/** 地址字段统一查询列表（is_default 优先，其次按创建时间倒序） */
const LIST_COLUMNS = 'id, user_id, receiver, phone, address, is_default, created_at, updated_at';

/**
 * 我的收货地址列表
 * GET /api/addresses
 */
async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM addresses WHERE user_id = ?
     ORDER BY is_default DESC, id DESC`,
    [req.user.id]
  );
  return ok(res, rows);
}

/**
 * 新增收货地址
 * POST /api/addresses  body: { receiver, phone, address, isDefault }
 * 规则：第一条地址自动成为默认地址；isDefault=true 时清空其它默认
 */
async function create(req, res) {
  const fields = normalizeBody(req.body || {});
  const msg = validate(fields);
  if (msg) return fail(res, 400, msg);

  const wantDefault = req.body?.isDefault === true || req.body?.isDefault === 1 || req.body?.isDefault === '1';

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?',
    [req.user.id]
  );
  if (countRows[0].total >= MAX_ADDRESSES) {
    return fail(res, 400, `最多只能保存 ${MAX_ADDRESSES} 个收货地址`);
  }
  // 首条地址强制为默认，保证下单默认地址可用
  const isDefault = countRows[0].total === 0 ? true : wantDefault;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (isDefault) {
      // 先清零：同一用户仅保留一个默认地址
      await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    const [result] = await conn.query(
      `INSERT INTO addresses (user_id, receiver, phone, address, is_default)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, fields.receiver, fields.phone, fields.address, isDefault ? 1 : 0]
    );
    await conn.commit();
    return ok(res, { id: result.insertId, isDefault }, '收货地址新增成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 编辑收货地址（仅本人）
 * PUT /api/addresses/:id
 */
async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, '地址ID不合法');

  const fields = normalizeBody(req.body || {});
  const msg = validate(fields);
  if (msg) return fail(res, 400, msg);

  // 归属校验：WHERE 同时限定 user_id，他人地址查不到 → 404
  const [rows] = await pool.query(
    'SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );
  if (rows.length === 0) return fail(res, 404, '收货地址不存在');
  const current = rows[0];

  const hasDefaultFlag = req.body?.isDefault !== undefined;
  const wantDefault =
    req.body?.isDefault === true || req.body?.isDefault === 1 || req.body?.isDefault === '1';
  // 若该地址已是默认，编辑时不允许取消默认（避免出现“无默认地址”的空档）
  const isDefault = current.is_default === 1 ? 1 : hasDefaultFlag && wantDefault ? 1 : 0;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (isDefault === 1) {
      await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id <> ?', [
        req.user.id,
        id,
      ]);
    }
    await conn.query(
      `UPDATE addresses SET receiver = ?, phone = ?, address = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [fields.receiver, fields.phone, fields.address, isDefault, id, req.user.id]
    );
    await conn.commit();
    return ok(res, { id, isDefault: isDefault === 1 }, '收货地址更新成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 删除收货地址（仅本人）
 * DELETE /api/addresses/:id
 * 若删除的是默认地址，自动把剩余最新一条提升为默认
 */
async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, '地址ID不合法');

  const [rows] = await pool.query(
    'SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );
  if (rows.length === 0) return fail(res, 404, '收货地址不存在');
  const wasDefault = rows[0].is_default === 1;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    let promotedId = null;
    if (wasDefault) {
      const [rest] = await conn.query(
        'SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [req.user.id]
      );
      if (rest.length > 0) {
        promotedId = rest[0].id;
        await conn.query('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [
          promotedId,
          req.user.id,
        ]);
      }
    }
    await conn.commit();
    return ok(res, { id, promotedDefaultId: promotedId }, '收货地址删除成功');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 设为默认地址
 * POST /api/addresses/:id/default
 */
async function setDefault(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, '地址ID不合法');

  const [rows] = await pool.query(
    'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );
  if (rows.length === 0) return fail(res, 404, '收货地址不存在');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 先在事务内清零，再置 1：保证同一用户任何时刻最多一个默认地址
    await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await conn.query('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [
      id,
      req.user.id,
    ]);
    await conn.commit();
    return ok(res, { id }, '已设为默认地址');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { list, create, update, remove, setDefault };
