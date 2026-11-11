# 简易电商平台 — API 接口文档

> 基础地址：`http://localhost:3000/api`（开发环境前端通过 Vite 代理 `/api`）
> 统一响应格式：

```json
{ "code": 0, "message": "success", "data": {} }
```

- `code = 0` 成功；`code` 非 0 表示业务/HTTP 错误（401 未登录、403 无权限、400 参数错误、404 不存在、500 服务器错误）。
- 鉴权方式：`Authorization: Bearer <token>`（登录接口返回的 JWT）。
- 角色权限：`admin` 管理员；`user` 普通用户。标注 🔓 公开、👤 登录、👑 管理员。

## 1. 认证模块 `/api/auth`

### 1.1 用户注册 🔓

- **POST** `/api/auth/register`
- 请求体：

```json
{ "username": "zhangsan", "password": "123456", "nickname": "张三" }
```

- 校验：用户名 3-50 位且唯一；密码至少 6 位。
- 响应：

```json
{ "code": 0, "message": "注册成功", "data": { "id": 3 } }
```

### 1.2 用户登录 🔓

- **POST** `/api/auth/login`
- 请求体：

```json
{ "username": "admin", "password": "admin123" }
```

- 响应：

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "admin", "nickname": "管理员", "role": "admin" }
  }
}
```

### 1.3 获取个人信息 👤

- **GET** `/api/auth/profile`
- 响应：

```json
{ "code": 0, "message": "success", "data": { "id": 1, "username": "admin", "nickname": "管理员", "role": "admin", "created_at": "2026-11-02 10:00:00" } }
```

## 2. 商品模块 `/api/products`

### 2.1 商品列表 👤

- **GET** `/api/products`
- 查询参数：`keyword`（名称/描述模糊）、`category`、`status`（仅管理员有效）、`page`（默认1）、`pageSize`（默认10，最大100）
- 说明：普通用户只能看到 `status=on` 的上架商品；管理员可查看全部。
- 响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      { "id": 1, "name": "无线机械键盘", "description": "87键 三模热插拔", "price": "299.00", "stock": 50, "category": "数码外设", "image_url": null, "status": "on", "created_at": "2026-11-02 10:00:00", "updated_at": "2026-11-02 10:00:00" }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 7 }
  }
}
```

### 2.2 商品详情 👤

- **GET** `/api/products/:id`
- 响应：同列表单项；普通用户访问下架商品返回 404。

### 2.3 创建商品 👑

- **POST** `/api/products`
- 请求体：

```json
{ "name": "测试商品", "description": "描述", "price": 99.9, "stock": 10, "category": "测试", "image_url": "" }
```

- 响应：`{ "code": 0, "message": "商品创建成功", "data": { "id": 8 } }`

### 2.4 更新商品 👑

- **PUT** `/api/products/:id`
- 请求体：同创建（`status` 支持 `on`/`off`）。

### 2.5 删除商品 👑

- **DELETE** `/api/products/:id`
- 说明：若商品已被订单引用，返回 400"该商品已被订单引用，无法删除，建议改为下架"。

### 2.6 上架/下架 👑

- **PATCH** `/api/products/:id/status`
- 请求体：`{ "status": "off" }`（或 `on`）
- 响应：`{ "code": 0, "message": "商品已下架", "data": null }`

## 3. 订单模块 `/api/orders`

### 3.1 创建订单 👤

- **POST** `/api/orders`
- 请求体：

```json
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "receiverName": "张三",
  "receiverPhone": "13800000000",
  "receiverAddress": "北京市朝阳区xx路1号",
  "remark": "工作日送达"
}
```

- 业务逻辑：服务端在**事务**中校验商品上架与库存 → 扣减库存（条件更新防超卖）→ 写入订单与明细快照 → 返回订单号。
- `remark`（订单备注）为可选字段，最长 255 字符，超长返回 `400`「订单备注不能超过 255 个字符」。
- 响应：

```json
{ "code": 0, "message": "下单成功", "data": { "orderId": 1, "orderNo": "20261102103000123456", "totalAmount": "598.00" } }
```

### 3.2 我的订单列表 👤

- **GET** `/api/orders/mine?status=&orderNo=&page=&pageSize=`
- 说明：仅返回当前登录用户的订单；`status` 可选 `pending/paid/shipped/completed/cancelled`。
- 响应项含物流与备注字段：`express_company`（快递公司）、`express_no`（物流单号）、`shipped_at`（发货时间）、`remark`（备注）。
- 待支付倒计时字段（仅 `pending` 有效，`pending` 之外的订单 `pay_remain_seconds` 为 `null`）：
  - `pay_deadline`：支付截止时间，格式 `yyyy-MM-dd HH:mm:ss`（= `created_at` + 30 分钟）
  - `pay_remain_seconds`：剩余秒数，`0` 表示已到期

### 3.3 全部订单列表 👑

- **GET** `/api/orders?status=&orderNo=&archived=&page=&pageSize=`
- 响应项含 `buyer`（下单用户名）与 `is_archived`（1=已归档 / 0=未归档）。
- 同时返回 `express_company` / `express_no` / `shipped_at` / `remark` 以及待支付倒计时字段 `pay_deadline`、`pay_remain_seconds`（口径同 3.2）。
- 归档筛选：不传 `archived` 或 `archived=0` 时只返回未归档订单；`archived=1` 时只返回已归档订单。

### 3.4 订单详情 👤（本人或管理员）

- **GET** `/api/orders/:id`
- 响应：订单主信息 + `items` 明细数组。

### 3.5 取消订单 👤（本人，仅待支付）

- **POST** `/api/orders/:id/cancel`
- 业务逻辑：事务内回滚库存，订单状态置为 `cancelled`。

### 3.6 更新订单状态 👑

- **POST** `/api/orders/:id/status`
- 请求体：`{ "status": "shipped", "expressCompany": "顺丰速运", "expressNo": "SF1234567890" }`
  - `status` 可选 `paid` / `shipped` / `completed`
  - `expressCompany` / `expressNo` 仅在流转到 `shipped` 时使用；`expressNo` 为选填（兼容旧调用），格式要求 5-64 位字母/数字/短横线，前端发货弹窗强制必填
- 状态机校验：`pending→paid→shipped→completed`，不可跳转或回退。
- 发货时自动写入 `shipped_at = NOW()`，并保存 `express_company` / `express_no`。
- 响应：`{ "code": 0, "message": "发货成功，物流信息已记录", "data": { "id": 12, "status": "shipped", "express_company": "顺丰速运", "express_no": "SF1234567890" } }`

### 3.7 归档订单 👑（软删除）

- **POST** `/api/orders/:id/archive`
- 说明：仅 `completed` / `cancelled` 状态可归档，其他状态返回 `400` 并说明原因；已归档订单重复归档返回 `400`「该订单已归档，无需重复归档」。
- 业务逻辑：仅将 `is_archived` 置为 `1`，订单主表与明细数据完整保留，默认列表不再展示，可随时取消归档恢复。
- 响应：`{ "code": 0, "message": "订单已归档，数据保留可追溯", "data": { "id": 79, "is_archived": 1 } }`

### 3.8 取消归档 👑

- **POST** `/api/orders/:id/unarchive`
- 说明：将已归档订单的 `is_archived` 置回 `0`，订单重新出现在默认列表中；未归档订单调用返回 `400`「该订单未归档，无需取消归档」。
- 响应：`{ "code": 0, "message": "订单已取消归档", "data": { "id": 79, "is_archived": 0 } }`

### 3.9 待支付超时检查 👑（手动触发）

- **POST** `/api/orders/expire-check`
- 请求体（可选）：`{ "timeoutMinutes": 30 }`，不传则使用默认超时 30 分钟
- 说明：扫描所有「`pending` 且下单时间早于 `NOW() - 30 分钟`」的订单，逐笔在事务内 `FOR UPDATE` 复核后置为 `cancelled` 并回滚库存；定时任务每分钟自动执行同一逻辑，本接口用于答辩演示与人工补跑。
- 业务口径与手动取消完全一致（按 `order_items` 逐条回加 `products.stock`），`UPDATE ... WHERE status='pending'` 保证幂等，不会重复回滚。
- 响应：`{ "code": 0, "message": "本次自动取消 1 笔超时待支付订单", "data": { "cancelledCount": 1, "cancelledOrderIds": [80], "scannedCount": 1, "timeoutMinutes": 30, "checkedAt": "2026-11-09T03:40:00.000Z" } }`

### 3.10 保存订单备注 👤（本人或管理员）

- **POST** `/api/orders/:id/remark`
- 请求体：`{ "remark": "工作日送达" }`，传空字符串表示清空备注，最长 255 字符
- 权限：订单本人或管理员，其它用户返回 `403`「无权操作他人订单」
- 响应：`{ "code": 0, "message": "订单备注已保存", "data": { "id": 80, "remark": "工作日送达" } }`

## 4. 统计模块 `/api/stats`（全部 👑）

### 4.1 统计总览

- **GET** `/api/stats/overview`
- 响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "totalSales": "598.00",
    "totalOrders": 1,
    "totalUsers": 2,
    "totalProducts": 7,
    "lowStockProducts": 1
  }
}
```

### 4.2 商品分类占比

- **GET** `/api/stats/category`
- 响应：

```json
{ "code": 0, "message": "success", "data": [ { "category": "数码外设", "count": 3 }, { "category": "服饰", "count": 2 } ] }
```

### 4.3 近7天销售趋势

- **GET** `/api/stats/trend`
- 响应：

```json
{ "code": 0, "message": "success", "data": [ { "date": "2026-10-31", "amount": "598.00" } ] }
```

## 5. 错误码速查

| HTTP | code | 场景 |
|---|---|---|
| 400 | 400 | 参数不合法、库存不足、状态流转非法等 |
| 401 | 401 | 未登录 / token 失效 |
| 403 | 403 | 无权限（非管理员访问管理接口、查看他人订单） |
| 404 | 404 | 资源不存在、接口不存在 |
| 500 | 500 | 服务器内部错误（不向前端暴露细节） |
