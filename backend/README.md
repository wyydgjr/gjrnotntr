# 简易电商平台 · 后端服务（Backend）

后端采用 **Node.js + Express + MySQL**，提供 RESTful API，JWT 鉴权 + RBAC 权限控制。

## 技术栈

- Node.js >= 18
- Express 4
- mysql2（连接池，Promise 风格）
- jsonwebtoken（JWT）
- bcryptjs（密码哈希）

## 目录结构

```
backend/
├── .env.example          # 环境变量示例（复制为 .env 后填写）
├── .gitignore            # 已忽略 node_modules/、dist/、*.log、.env
├── package.json
├── simple-server.js      # 极简版后端（单文件，端口 3001，答辩对照用）
├── scripts/
│   └── seed.js           # 初始化管理员/普通用户账号
└── src/
    ├── server.js         # 启动入口（随服务拉起订单超时定时任务）
    ├── app.js            # Express 应用装配（含 /api/health 健康检查）
    ├── config/
    │   └── db.js         # MySQL 连接池
    ├── middleware/
    │   ├── auth.js       # JWT 鉴权 + RBAC 中间件
    │   └── errorHandler.js
    ├── routes/
    │   ├── index.js
    │   ├── auth.routes.js
    │   ├── product.routes.js
    │   ├── order.routes.js
    │   ├── address.routes.js
    │   └── stats.routes.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── product.controller.js
    │   ├── order.controller.js
    │   ├── address.controller.js
    │   └── stats.controller.js
    ├── services/
    │   ├── orderExpireService.js  # 待支付订单超时取消业务逻辑
    │   └── orderExpireTask.js     # 定时任务调度（每 60 秒扫描一次）
    └── utils/
        ├── response.js   # 统一响应格式
        ├── asyncHandler.js # async 控制器异常转交 next()
        └── jwt.js        # token 签发/校验
```

## 快速启动

```bash
# 1. 准备数据库（需本机已安装 MySQL 8.0+）
mysql -u root -p < ../docs/database.sql

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env      # Windows 使用: copy .env.example .env
# 编辑 .env，填入正确的 DB_USER / DB_PASSWORD

# 4. 初始化账号（管理员 admin/admin123，普通用户 user/user123）
npm run seed

# 5. 启动服务
npm run dev               # 开发模式（nodemon 热更新）
# 或
npm start                 # 生产模式
```

启动成功后服务运行在 `http://localhost:3000`，控制台同时输出 `[order-expire] 定时任务已启动：每 60 秒扫描一次，支付超时阈值 30 分钟`。

接口文档：

| 文件 | 用途 |
|---|---|
| `../docs/swagger.json` | OpenAPI 3.0.3 描述，覆盖全部 38 个接口，可导入 Swagger UI / Apifox / Postman 在线调试 |
| `../docs/postman_collection.json` | Postman Collection v2.1，6 个分组，登录请求内置脚本自动回写 `{{token}}` |
| `../docs/API接口文档.md` | 人读版接口说明与请求响应示例 |

## 默认账号

| 角色 | 用户名 | 密码 | 权限 |
|---|---|---|---|
| 管理员 | admin | admin123 | 商品管理、全部订单、统计看板 |
| 普通用户 | user | user123 | 浏览商品、创建/查看自己的订单 |

## 统一响应格式

```json
{ "code": 0, "message": "success", "data": { } }
```

- `code = 0` 表示成功；非 0 表示业务错误（如 401 未登录、403 无权限、404 不存在、400 参数错误、500 服务器错误）。
- HTTP 状态码与 code 语义保持一致。
