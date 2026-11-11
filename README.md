# 云商优选 — 简易电商后台管理系统

前后端分离的全栈练习项目，选题对应实训单里的「D 简易电商后台」：管理员管商品和订单、看数据统计；普通用户逛商品、加购物车、下单、查自己的订单。

后端 Express + MySQL 出 RESTful 接口，JWT 做登录态，管理员和普通用户靠 RBAC 分别鉴权；前端 Vue3 + Element Plus，一套代码里用路由守卫分出两套视图。

仓库的 master 分支上是另一个项目，本项目代码在 `shixun` 分支。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | Vue 3、Vite、Element Plus、Pinia、Axios、ECharts |
| 后端 | Node.js、Express、mysql2 连接池、jsonwebtoken、bcryptjs |
| 数据库 | MySQL 8.0，5 张表（users / products / orders / order_items / addresses） |

## 目录结构

```
实训/
├── backend/              后端源码，端口 3000
│   ├── src/              app、路由、控制器、中间件、工具函数
│   ├── scripts/seed.js   建默认账号与演示数据
│   └── simple-server.js  极简版单文件服务，端口 3001，答辩对照用
├── frontend/             前端源码，vite dev 默认 5173
│   └── src/              views、api、stores、layout、router
├── docs/                 数据库设计、接口文档、部署说明、实训报告
└── 极简版前端.html        原生 JS 版页面，配合 3001 端口对照演示
```

## 本地跑起来

前提是本机装了 MySQL 8.0 和 Node 18 以上。

1. 建库建表

```bash
mysql -u root -p < docs/database.sql
```

2. 起后端

```bash
cd backend
copy .env.example .env      # macOS/Linux 下用 cp
# 编辑 .env，把 DB_USER / DB_PASSWORD 改成自己本机的 MySQL 账号
npm install
npm run seed                # 生成 admin/admin123、user/user123 和演示商品
npm run dev                 # 健康检查 http://localhost:3000/api/health
```

3. 起前端

```bash
cd frontend
npm install
npm run dev                 # 浏览器打开 http://localhost:5173
```

前端要走 5173 的 dev server，直接双击打开构建产物会白屏，history 路由和接口跨域都过不去。

## 默认账号

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 管理员 | admin | admin123 |
| 普通用户 | user | user123 |

## 接口文档

- `docs/swagger.json` — OpenAPI 3.0.3，31 个路径 38 个操作，导入 Swagger UI 或 Apifox 可以直接调
- `docs/postman_collection.json` — Collection v2.1，7 个分组 48 个请求，登录请求会把 token 自动写回变量，整包跑得通
- `docs/API接口文档.md` — 人读版，带请求响应示例

## 其他文档

| 文件 | 内容 |
| --- | --- |
| docs/数据库设计文档.md | ER 图加 5 张表的字段、约束、索引，附状态机与超卖处理说明 |
| docs/部署说明.md | 本地三步启动、常见问题排查、pm2 + Nginx 生产部署 |
| docs/实训报告.md | 按实训单模板写的报告正文 |
| docs/database.sql | 建库建表脚本，可直接导入 |
| 答辩代码导读.md | 答辩时按模块讲代码的顺序提示 |

## 几个约定

- 后端所有接口统一返回 `{ code, message, data }`，成功时 `code` 为 0
- 鉴权走 `Authorization: Bearer <token>`，中间件解析后挂在 `req.user` 上
- 订单状态按 pending → paid → shipped → completed 流转，取消会回滚库存
- 端口：后端 3000、极简版后端 3001、前端 5173
