# VeStore — 品质生活电商平台

[![CI](https://github.com/wyyd/ve/actions/workflows/ci.yml/badge.svg)](https://github.com/wyyd/ve/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 全栈 Vue 3 电商管理平台，包含前台商城 + 后台管理系统。

## ✨ 功能概览

### 前台商城
- 商品浏览、搜索、分类筛选
- 购物车（本地 + 服务端同步）
- 收藏夹、优惠券领取
- 订单创建、支付、物流追踪
- 售后工单、发票管理
- 地址管理、在线客服

### 后台管理
- 仪表盘（数据概览、收入图表）
- 用户管理、商品管理、分类管理
- 订单管理、评价管理
- 轮播管理、优惠券管理
- 属性模板、采购单、供应商
- 审计日志、系统设置

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + Composition API |
| 构建 | Vite 8 |
| 路由 | Vue Router 4 (懒加载) |
| 状态管理 | Pinia 3 |
| HTTP | Axios (拦截器 + Token 刷新 + 请求去重) |
| 校验 | Vee-Validate + Zod |
| 国际化 | Vue I18n 11 (中/英) |
| 测试 | Vitest + Playwright |
| Mock | json-server (本地) + Express (Vercel Serverless) |
| CI/CD | GitHub Actions |
| 部署 | Vercel |

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发环境（Mock API + Vite 热更新）
npm run dev

# 仅启动 Mock API 服务器
npm run mock

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

开发环境默认运行在 `http://localhost:5173`，API 代理到 `http://localhost:3001`。

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | Admin123 |
| 普通用户 | testuser | Test1234 |

## 📁 项目结构

```
ve/
├── api/                # Vercel Serverless API
│   └── index.js        # 生产环境 API 入口
├── e2e/                # E2E 测试
│   └── app.spec.js
├── public/             # 静态资源
├── src/
│   ├── api/            # API 调用层
│   ├── components/     # 公共组件
│   ├── directives/     # 自定义指令 (lazy-load, a11y)
│   ├── i18n/           # 国际化配置
│   ├── layouts/        # 布局组件
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia 状态管理
│   │   └── __tests__/  # Store 单元测试
│   ├── styles/         # 全局样式
│   ├── utils/          # 工具函数
│   │   └── __tests__/  # 工具函数测试
│   └── views/          # 页面组件
│       ├── admin/      # 后台页面
│       └── front/      # 前台页面
├── mock-server.cjs     # 本地 Mock API 服务器
├── vitest.config.js    # 测试配置
├── playwright.config.js# E2E 配置
└── vercel.json         # Vercel 部署配置
```

## 🧪 测试

```bash
# 运行单元测试
npm test

# 运行测试 + 覆盖率
npm run test:coverage

# E2E 测试
npm run test:e2e

# E2E 测试 (UI 模式)
npm run test:e2e:ui
```

## 🔒 安全

- **Token 存储**：内存中存储（非 localStorage），防止 XSS 窃取
- **Token 刷新**：自动静默刷新，请求队列化
- **密码哈希**：MD5 哈希存储（Mock 环境）
- **CORS**：白名单限制，生产环境不允许 `*`
- **安全头**：`X-Content-Type-Options`、`X-Frame-Options`、`CSP`、`Referrer-Policy`
- **速率限制**：登录接口防暴力破解（本地 Mock）
- **输入校验**：Zod Schema 统一校验，前后端双重验证
- **请求去重**：防止用户快速点击导致的重复请求
- **审计日志**：所有管理操作自动记录

## 📊 可观测性

- **Web Vitals**：CLS、FCP、LCP、INP 自动采集
- **全局错误捕获**：Vue errorHandler + unhandledrejection
- **性能追踪**：页面加载性能监控
- **结构化日志**：统一 logger，支持生产环境对接 Sentry

## ♿ 可访问性

- 键盘跳过导航 (Skip to main content)
- ARIA 属性：`role`、`aria-label`、`aria-current`、`aria-expanded`
- 语义化 HTML
- 图片懒加载（IntersectionObserver）

## 🌐 部署

项目配置了 Vercel 一键部署，推送到 `master` 分支自动触发 GitHub Actions CI，通过后部署到 Vercel。

## 📄 许可证

MIT License
