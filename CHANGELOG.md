# CHANGELOG

## [Unreleased]

### Added
- **安全性**：`api/index.js` 全面安全加固，同步 `mock-server.cjs` 所有安全机制
  - 密码哈希验证（MD5，与本地 Mock 一致）
  - CORS 白名单限制
  - 安全响应头（X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy）
  - 账号状态检查（禁用账号不可登录）
  - 管理员登录角色校验
  - 注册密码复杂度校验
  - 补充所有业务端点：购物车、地址、收藏、评价、售后、发票、优惠券、聊天、属性模板、采购单、供应商、审计日志
- **测试基础设施**：从 3 个测试文件扩展到 7 个测试文件，72 个测试用例全部通过
  - 新增 `error-codes.test.js`（12 个测试）
  - 新增 `validation-schemas.test.js`（25 个测试）
  - 新增 `toast.test.js`（7 个测试）
  - 新增 `request-dedup.test.js`（5 个测试）
  - E2E 测试框架：Playwright 配置 + 基础测试套件
  - 覆盖率阈值配置（60% lines/functions/statements）
- **性能优化**
  - `keep-alive` 缓存前台路由组件（最多 10 个）
  - 图片懒加载指令 `v-lazy`（IntersectionObserver）
  - 防抖/节流工具函数
  - Suspense fallback 加载状态
- **可访问性 (a11y)**
  - SkipLink 跳过导航组件
  - 语义化 ARIA 属性（`role`、`aria-label`、`aria-current`、`aria-expanded`）
  - Focus trap 和 Focus first 指令
- **国际化 (i18n)**
  - Vue I18n 11 集成
  - 中英文完整语言包
- **可观测性**
  - 全局错误捕获（Vue errorHandler + unhandledrejection）
  - Web Vitals 监控工具
  - 页面性能追踪
  - 错误上报工具（开发环境 console，生产环境 beacon）
- **文档**
  - 完整的 README.md
  - CHANGELOG.md
- **其他**
  - 修复 `FrontLayout.vue` 缺失 `ref` 导入
  - 修复 `auth.userLogout()` 为 `auth.logout()`

## [0.0.0] - 初始版本

### Added
- Vue 3 + Vite 项目初始化
- 前台商城基础功能
- 后台管理系统基础功能
- Mock API 服务器
- CI/CD (GitHub Actions + Vercel)
- ESLint + Prettier + Husky + commitlint 代码规范
