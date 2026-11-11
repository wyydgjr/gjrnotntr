# 简易电商平台 · 前端（Frontend）

前端采用 **Vue3 + Vite + Element Plus + Pinia + Axios + ECharts**，SPA 单页应用，按角色（管理员 / 普通用户）渲染不同菜单与页面。

## 技术栈

- Vue 3（Composition API + `<script setup>`）
- Vite 5
- Vue Router 4（路由守卫控制登录与角色权限）
- Pinia（登录态 / 用户信息状态管理）
- Element Plus + icons（UI 组件库）
- Axios（统一请求封装，拦截器注入 JWT、统一错误提示）
- ECharts（统计看板图表）

## 目录结构

```
frontend/
├── .env                  # VITE_API_BASE 接口地址（打包单文件后指向后端完整地址）
├── .env.example          # 开发模式模板，/api 走 Vite 代理
├── .gitignore            # 已忽略 node_modules/、dist/、*.log、.env
├── index.html
├── package.json
├── vite.config.js        # 含 /api 代理到后端 3000
└── src/
    ├── main.js           # 应用入口（挂载 Element Plus / Pinia / Router）
    ├── App.vue
    ├── api/
    │   ├── request.js    # axios 实例 + 拦截器
    │   └── index.js      # 业务 API 封装
    ├── router/
    │   └── index.js      # 路由 + 登录/角色守卫
    ├── stores/
    │   ├── user.js       # 登录态 Pinia store
    │   └── cart.js       # 购物车 store（localStorage 持久化，刷新/切页不丢）
    ├── layout/
    │   └── MainLayout.vue # 侧边栏 + 顶栏布局
    └── views/
        ├── Login.vue
        ├── Register.vue
        ├── Dashboard.vue      # 管理员统计看板
        ├── Shop.vue           # 普通用户商品浏览
        ├── product/
        │   ├── ProductList.vue # 管理员商品管理
        │   └── ProductDetail.vue # 商品详情 + 加入购物车
        ├── order/
        │   ├── OrderManage.vue # 管理员全部订单 + 状态流转
        │   └── MyOrders.vue    # 普通用户我的订单
        ├── address/
        │   └── AddressList.vue # 收货地址簿（增删改 + 设默认）
        ├── settings/
        │   └── Settings.vue    # 个人设置（改昵称 / 改密码）
        └── NotFound.vue
```

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`。

> 前提：后端已启动（`backend` 目录 `npm run dev`，端口 3000），数据库已初始化并执行 `npm run seed`。

## 默认账号

| 角色 | 用户名 | 密码 | 可见菜单 |
|---|---|---|---|
| 管理员 | admin | admin123 | 统计看板、商品管理、订单管理 |
| 普通用户 | user | user123 | 商品商城、我的订单 |

## 构建生产版本

```bash
npm run build        # 产物在 dist/（vite-plugin-singlefile 打包为单文件 index.html）
npm run preview      # 本地预览构建产物
```

> 打包产物为单文件 `dist/index.html`，可直接双击从 `file://` 打开；此时无 Vite 代理，需保证 `frontend/.env` 中 `VITE_API_BASE=http://localhost:3000/api` 且后端已启动。
