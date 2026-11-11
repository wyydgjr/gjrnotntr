<template>
  <router-view />
</template>

<script setup>
// 根组件：仅承载路由出口与全局主题样式，具体布局见 MainLayout.vue
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
}

/* ========== 全局主题：品牌色统一 ========== */
:root {
  /* 品牌主色：蓝紫渐变（用于主按钮、选中态、链接） */
  --brand-primary: #1677ff;
  --brand-primary-dark: #0958d9;
  --brand-primary-light: #e6f0ff;
  --brand-gradient: linear-gradient(135deg, #1677ff 0%, #7b5cff 100%);
  --brand-gradient-soft: linear-gradient(135deg, #e6f0ff 0%, #f0ecff 100%);

  /* 覆盖 Element Plus 主题变量 */
  --el-color-primary: #1677ff;
  --el-color-primary-light-3: #4a99ff;
  --el-color-primary-light-5: #7db8ff;
  --el-color-primary-light-7: #b1d4ff;
  --el-color-primary-light-8: #cbe3ff;
  --el-color-primary-light-9: #e6f0ff;
  --el-color-primary-dark-2: #0958d9;

  --el-border-radius-base: 10px;
  --el-border-radius-small: 8px;
  --el-border-radius-round: 999px;

  --el-font-size-base: 14px;
  --el-text-color-primary: #1f2329;
  --el-text-color-regular: #4b5565;
  --el-border-color-lighter: #eef0f4;
  --el-border-color: #dfe3ea;

  /* 辅助色统一 */
  --el-color-success: #52c41a;
  --el-color-success-light-3: #7ad84f;
  --el-color-success-light-5: #a5e383;
  --el-color-success-light-7: #c9efae;
  --el-color-success-light-8: #dcf5c6;
  --el-color-success-light-9: #f0fbe6;
  --el-color-success-dark-2: #3ba014;
  --el-color-warning: #fa8c16;
  --el-color-warning-light-3: #ffb15c;
  --el-color-warning-light-5: #ffc98f;
  --el-color-warning-light-7: #ffdfba;
  --el-color-warning-light-8: #ffe9d0;
  --el-color-warning-light-9: #fff7ec;
  --el-color-warning-dark-2: #d47110;
  --el-color-danger: #f5222d;
  --el-color-danger-light-3: #ff7078;
  --el-color-danger-light-5: #ff9da2;
  --el-color-danger-light-7: #ffc4c7;
  --el-color-danger-light-8: #ffd6d8;
  --el-color-danger-light-9: #fff0f0;
  --el-color-danger-dark-2: #d11a24;

  /* 阴影层级 */
  --el-box-shadow-light: 0 2px 12px rgba(15, 31, 77, 0.08);
  --el-box-shadow: 0 8px 24px rgba(15, 31, 77, 0.12);
  --el-box-shadow-dark: 0 12px 32px rgba(15, 31, 77, 0.18);
}

/* ========== 通用页面容器 ========== */
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ========== 卡片圆角与阴影规范 ========== */
.el-card {
  --el-card-border-radius: 12px;
  border-color: #eef0f4;
  transition: box-shadow 0.25s;
}

.el-card.is-hover-shadow:hover,
.el-card.shadow-hover:hover {
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.12);
}

/* ========== 主按钮渐变 ========== */
.el-button--primary {
  background: var(--brand-gradient);
  border: none;
  background-size: 100% 100%;
  transition: transform 0.15s, box-shadow 0.25s, filter 0.2s;
}

.el-button--primary:hover {
  filter: brightness(1.08);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.35);
}

.el-button--primary:active {
  transform: scale(0.97);
}

/* ========== 滚动条美化 ========== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #cdd3de;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a9b2c2;
}

::-webkit-scrollbar-track {
  background: transparent;
}

/* ========== 路由过渡动画（配合 MainLayout transition） ========== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== 页面标题通用样式 ========== */
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2329;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title::before {
  content: '';
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: var(--brand-gradient);
}
/* ========== 字体层级与数字字体 ========== */
html,
body,
#app {
  font-family: 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #1f2329;
}

.num-font {
  font-family: 'Bahnschrift', 'DIN Alternate', 'Segoe UI', 'PingFang SC', sans-serif;
  font-variant-numeric: tabular-nums;
}

/* ========== 按钮细节增强 ========== */
.el-button {
  font-weight: 500;
  transition: all 0.2s ease;
}

.el-button--primary {
  background: linear-gradient(135deg, #1677ff 0%, #3b82ff 60%, #7b5cff 100%);
  background-size: 150% 150%;
  background-position: 0% 50%;
}

.el-button--primary:hover {
  background-position: 100% 50%;
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.38);
  transform: translateY(-1px);
}

.el-button--primary:active {
  transform: translateY(0) scale(0.97);
}

.el-button.is-round {
  border-radius: 999px;
}

/* ========== 输入控件细节 ========== */
.el-input__wrapper,
.el-textarea__inner,
.el-select__wrapper {
  border-radius: 10px;
  box-shadow: 0 0 0 1px #dfe3ea inset;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.el-input__wrapper:hover,
.el-textarea__inner:hover,
.el-select__wrapper:hover {
  box-shadow: 0 0 0 1px #b1d4ff inset;
}

.el-input__wrapper.is-focus,
.el-textarea__inner:focus,
.el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px #1677ff inset, 0 4px 12px rgba(22, 119, 255, 0.12) !important;
}

/* ========== 表格细节 ========== */
.el-table {
  --el-table-header-bg-color: #f7f9fc;
  --el-table-header-text-color: #4b5565;
  --el-table-border-color: #eef0f4;
  --el-table-row-hover-bg-color: #f0f7ff;
  border-radius: 10px;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background: linear-gradient(180deg, #f9fbfe 0%, #eef2f9 100%) !important;
  font-weight: 600;
}

.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: #fafcff;
}

/* ========== 标签/徽标 ========== */
.el-tag {
  border-radius: 6px;
  font-weight: 500;
}

.el-tag.is-round {
  border-radius: 999px;
}

/* ========== 弹窗/抽屉 ========== */
.el-dialog {
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(15, 31, 77, 0.25);
  overflow: hidden;
}

.el-dialog__header {
  padding: 18px 24px 10px;
}

.el-dialog__title {
  font-weight: 600;
}

.el-drawer {
  border-radius: 16px 0 0 16px;
}

.el-drawer__header {
  font-weight: 600;
  margin-bottom: 12px;
}

/* ========== 消息提示 ========== */
.el-message {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 31, 77, 0.15);
}

/* ========== 分页 ========== */
.el-pagination.is-background .el-pager li,
.el-pagination.is-background .btn-prev,
.el-pagination.is-background .btn-next {
  border-radius: 8px;
}

.el-pagination.is-background .el-pager li.is-active {
  background: linear-gradient(135deg, #1677ff, #7b5cff);
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.35);
}

/* ========== 下拉菜单 ========== */
.el-popper.is-light {
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 31, 77, 0.15);
}

.el-dropdown-menu {
  padding: 6px;
}

.el-dropdown-menu__item {
  border-radius: 8px;
  margin: 2px 0;
}

.el-dropdown-menu__item:hover {
  background: #e6f0ff;
  color: #1677ff;
}

/* ========== 加载遮罩 ========== */
.el-loading-mask {
  border-radius: inherit;
}

/* ========== 通用微动画 ========== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes floatY {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes pulseGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.35);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(22, 119, 255, 0);
  }
}

@keyframes shine {
  0% {
    background-position: -150% 0;
  }
  100% {
    background-position: 250% 0;
  }
}

/* ========== 路由过渡增强 ========== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.99);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(1.01);
}

/* ========== 2026-11-04 · 质感升级层（成熟电商后台视觉语言） ========== */

/* ---- 通用光效关键帧 ---- */
@keyframes shineSweep {
  0% { transform: translateX(-160%) skewX(-18deg); }
  100% { transform: translateX(320%) skewX(-18deg); }
}
@keyframes softFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ---- 卡片：分层阴影 + 细腻描边 ---- */
.el-card {
  --el-card-border-radius: 14px;
  border: 1px solid rgba(22, 119, 255, 0.09);
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 10px 30px rgba(15, 31, 77, 0.06);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.el-card:hover {
  border-color: rgba(22, 119, 255, 0.2);
  box-shadow: 0 2px 4px rgba(15, 31, 77, 0.05), 0 18px 44px rgba(15, 31, 77, 0.12);
}

/* ---- 表格：细腻渐变表头 + 呼吸行 ---- */
.el-table {
  --el-table-header-bg-color: #f4f7fd;
  --el-table-row-hover-bg-color: #f4f8ff;
  --el-table-border-color: #eef1f7;
  border-radius: 12px;
  overflow: hidden;
}

.el-table th.el-table__cell {
  background: linear-gradient(180deg, #f8faff 0%, #edf2fb 100%) !important;
  color: #3d4a63 !important;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.el-table td.el-table__cell {
  border-bottom: 1px solid #f1f3f8;
}

.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: rgba(22, 119, 255, 0.016);
}

.el-table .el-table__row {
  transition: background 0.2s ease;
}

.el-table .el-table__row:hover > td.el-table__cell {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.07), rgba(124, 92, 255, 0.035)) !important;
}

/* ---- 状态徽章：渐变质感 ---- */
.el-tag--dark.el-tag--success {
  background: linear-gradient(135deg, #10b981, #34d399);
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.32);
}

.el-tag--dark.el-tag--warning {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border: none;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.32);
}

.el-tag--dark.el-tag--danger {
  background: linear-gradient(135deg, #f43f5e, #fb7185);
  border: none;
  box-shadow: 0 2px 8px rgba(244, 63, 94, 0.32);
}

.el-tag--dark.el-tag--primary {
  background: linear-gradient(135deg, #1677ff, #7b5cff);
  border: none;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.32);
}

.el-tag--dark.el-tag--info {
  background: linear-gradient(135deg, #64748b, #94a3b8);
  border: none;
  box-shadow: 0 2px 8px rgba(100, 116, 139, 0.28);
}

.el-tag--plain {
  border-color: rgba(22, 119, 255, 0.28);
  background: rgba(22, 119, 255, 0.05);
  color: #1677ff;
}

.el-tag {
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* ---- 主按钮：渐变光晕 ---- */
.el-button--primary {
  background: linear-gradient(135deg, #1677ff 0%, #3b82ff 55%, #7b5cff 100%);
  background-size: 180% 180%;
  background-position: 0% 50%;
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.26);
}

.el-button--primary:hover {
  background-position: 100% 50%;
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.4);
  transform: translateY(-1px);
}

/* ---- 输入控件：柔和底色 + 聚焦光晕 ---- */
.el-input__wrapper,
.el-textarea__inner,
.el-select__wrapper {
  background: #fbfcfe;
  box-shadow: 0 0 0 1px #e2e8f2 inset;
  border-radius: 10px;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.el-input__wrapper:hover,
.el-select__wrapper:hover {
  background: #fff;
  box-shadow: 0 0 0 1px #b7c9ea inset;
}

.el-input__wrapper.is-focus,
.el-select__wrapper.is-focused {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.3) inset, 0 6px 18px rgba(22, 119, 255, 0.1) !important;
}

/* ---- 弹窗 / 抽屉 ---- */
.el-dialog {
  border-radius: 20px;
  box-shadow: 0 32px 84px rgba(15, 31, 77, 0.3);
}

.el-dialog__header {
  padding: 20px 24px 14px;
  border-bottom: 1px solid #f0f2f7;
}

.el-dialog__title {
  font-weight: 700;
  color: #141a2b;
}

.el-drawer {
  border-radius: 18px 0 0 18px;
}

.el-drawer__header {
  font-weight: 700;
  border-bottom: 1px solid #f0f2f7;
  padding-bottom: 14px;
}

/* ---- 分页 ---- */
.el-pagination.is-background .el-pager li.is-active {
  background: linear-gradient(135deg, #1677ff, #7b5cff);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
  font-weight: 700;
}

/* ---- 下拉 ---- */
.el-popper.is-light {
  border-radius: 14px;
  box-shadow: 0 14px 40px rgba(15, 31, 77, 0.16);
}

.el-dropdown-menu__item:hover {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.08), rgba(124, 92, 255, 0.05));
  color: #1677ff;
}

/* ---- 空状态 ---- */
.el-empty__description p {
  color: #8a94a6;
}
</style>
