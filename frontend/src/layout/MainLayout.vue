<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="logo" @click="router.push(isAdmin ? '/dashboard' : '/shop')">
        <el-icon :size="24" color="#1677ff"><ShoppingBag /></el-icon>
        <span v-if="!collapsed" class="logo-text">云商优选</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="menu"
        :collapse="collapsed"
        :collapse-transition="false"
      >
        <template v-if="isAdmin">
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>统计看板</template>
          </el-menu-item>
          <el-menu-item index="/products">
            <el-icon><Goods /></el-icon>
            <template #title>商品管理</template>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><Tickets /></el-icon>
            <template #title>订单管理</template>
          </el-menu-item>
          <el-menu-item index="/addresses">
            <el-icon><Location /></el-icon>
            <template #title>收货地址</template>
          </el-menu-item>
        </template>
        <template v-else>
          <el-menu-item index="/shop">
            <el-icon><ShoppingBag /></el-icon>
            <template #title>商品商城</template>
          </el-menu-item>
          <el-menu-item index="/my-orders">
            <el-icon><List /></el-icon>
            <template #title>我的订单</template>
          </el-menu-item>
          <el-menu-item index="/addresses">
            <el-icon><Location /></el-icon>
            <template #title>收货地址</template>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>个人设置</template>
          </el-menu-item>
        </template>
      </el-menu>
      <div class="aside-footer" v-if="!collapsed">
        <el-icon><Medal /></el-icon>
        <span>v1.0.0</span>
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button link class="collapse-btn" :icon="collapsed ? Expand : Fold" @click="collapsed = !collapsed" />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: isAdmin ? '/dashboard' : '/shop' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-tooltip v-if="!isAdmin" content="商城首页" placement="bottom">
            <el-button link circle :icon="ShoppingBag" @click="router.push('/shop')" />
          </el-tooltip>
          <el-dropdown @command="onCommand">
            <span class="user-trigger">
              <el-avatar :size="30" class="avatar">
                {{ avatarText }}
              </el-avatar>
              <span class="user-name">{{ userStore.nickname || userStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <el-tag :type="isAdmin ? 'danger' : 'primary'" size="small" round effect="light">
                    {{ isAdmin ? '管理员' : '普通用户' }}
                  </el-tag>
                </el-dropdown-item>
                <el-dropdown-item command="profile" :icon="User">个人信息</el-dropdown-item>
                <el-dropdown-item command="settings" :icon="Setting">修改昵称 / 密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided :icon="SwitchButton">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <el-footer class="footer">
        <span>云商优选电商平台 · 版权所有</span>
        <span class="footer-ver">© 2026 All Rights Reserved</span>
      </el-footer>
    </el-container>
  </el-container>

  <!-- 个人信息弹窗 -->
  <el-dialog v-model="profileVisible" title="个人信息" width="420px">
    <div class="profile-body">
      <el-avatar :size="64" class="profile-avatar">{{ avatarText }}</el-avatar>
      <div class="profile-item">
        <span class="label">用户名</span>
        <span>{{ userStore.userInfo?.username || '-' }}</span>
      </div>
      <div class="profile-item">
        <span class="label">昵称</span>
        <span>{{ userStore.nickname || '-' }}</span>
      </div>
      <div class="profile-item">
        <span class="label">角色</span>
        <el-tag :type="isAdmin ? 'danger' : 'primary'" size="small" round>
          {{ isAdmin ? '管理员' : '普通用户' }}
        </el-tag>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" round @click="profileVisible = false">知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import {
  User, ArrowDown, SwitchButton, Fold, Expand, ShoppingBag,
  DataAnalysis, Goods, Tickets, List, Medal, Location, Setting,
} from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const collapsed = ref(false);
const profileVisible = ref(false);

const isAdmin = computed(() => userStore.role === 'admin');
const currentTitle = computed(() => route.meta.title || '');
const avatarText = computed(() => {
  const name = userStore.nickname || userStore.userInfo?.username || '用';
  return name.charAt(0).toUpperCase();
});

async function onCommand(command) {
  if (command === 'profile') {
    profileVisible.value = true;
  } else if (command === 'settings') {
    router.push('/settings');
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗？', '提示', {
        type: 'warning',
        confirmButtonText: '退出',
        cancelButtonText: '取消',
      });
    } catch {
      return; // 用户取消退出
    }
    userStore.logout();
    router.push('/login');
  }
}

function handleResize() {
  collapsed.value = window.innerWidth < 768;
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});
onBeforeUnmount(() => window.removeEventListener('resize', handleResize));
</script>

<style scoped>
.layout {
  height: 100%;
}

.aside {
  background: linear-gradient(180deg, #0b1b3a 0%, #10284f 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.25s;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  white-space: nowrap;
}

.logo-text {
  font-size: 17px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
}

.menu {
  border-right: none;
  background: transparent;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.72);
  margin: 4px 8px;
  border-radius: 8px;
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(22, 119, 255, 0.18);
  color: #fff;
}

.menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: linear-gradient(90deg, #1677ff 0%, #36cfc9 100%);
}

.aside-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn {
  font-size: 18px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
  padding: 4px 8px;
  border-radius: 999px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f5f7fa;
}

.avatar {
  background: linear-gradient(135deg, #1677ff, #36cfc9);
  color: #fff;
  font-weight: 600;
}

.user-name {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main {
  background: #f5f6f8;
  padding: 20px;
  overflow-y: auto;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 46px;
  color: #999;
  font-size: 13px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 0 20px;
}

.footer-ver {
  opacity: 0.8;
}

.profile-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  background: linear-gradient(135deg, #1677ff, #36cfc9);
  color: #fff;
  font-size: 26px;
  font-weight: 600;
}

.profile-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f7f8fa;
  border-radius: 8px;
}

.profile-item .label {
  color: #999;
}

/* 路由过渡动画 */
:deep(.fade-slide-enter-active),
:deep(.fade-slide-leave-active) {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

:deep(.fade-slide-enter-from) {
  opacity: 0;
  transform: translateY(14px);
}

:deep(.fade-slide-leave-to) {
  opacity: 0;
  transform: translateY(-10px);
}

/* ========== 侧边栏细节 ========== */
.aside {
  background: linear-gradient(180deg, #0b1b3a 0%, #10284f 55%, #16286b 100%);
  box-shadow: 2px 0 12px rgba(15, 31, 77, 0.2);
  position: relative;
  z-index: 2;
}

.aside::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -40px;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(22, 119, 255, 0.35) 0%, transparent 70%);
  pointer-events: none;
}

.logo {
  transition: background 0.25s;
}

.logo:hover {
  background: rgba(255, 255, 255, 0.09);
}

.logo .el-icon {
  filter: drop-shadow(0 2px 6px rgba(22, 119, 255, 0.6));
}

.logo-text {
  background: linear-gradient(90deg, #ffffff 0%, #9fd8ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.menu :deep(.el-menu-item) {
  position: relative;
  transition: all 0.25s ease;
}

.menu :deep(.el-menu-item::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 16px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(180deg, #36cfc9, #1677ff);
  transition: transform 0.25s ease;
}

.menu :deep(.el-menu-item:hover::before),
.menu :deep(.el-menu-item.is-active::before) {
  transform: translateY(-50%) scaleY(1);
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(22, 119, 255, 0.2);
}

.menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #1677ff 0%, #36cfc9 100%);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
}

.aside-footer {
  letter-spacing: 0.5px;
}

.aside-footer .el-icon {
  color: #36cfc9;
}

/* ========== 顶栏细节 ========== */
.header {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid #eef0f4;
  box-shadow: 0 1px 8px rgba(15, 31, 77, 0.04);
  position: relative;
  z-index: 10;
}

.collapse-btn {
  transition: transform 0.3s ease, color 0.2s;
}

.collapse-btn:hover {
  color: #1677ff;
  transform: scale(1.12);
}

.header :deep(.el-breadcrumb__inner) {
  color: #4b5565;
}

.header :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #1f2329;
  font-weight: 600;
}

.user-trigger {
  transition: all 0.2s ease;
}

.user-trigger:hover {
  background: #eef2f9;
  transform: translateY(-1px);
}

.avatar {
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.4);
}

/* ========== 主区与页脚 ========== */
.main {
  background: linear-gradient(180deg, #f6f8fc 0%, #f2f4f9 100%);
}

.footer {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid #eef0f4;
  color: #8a94a6;
}

.profile-avatar {
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.35);
}

/* ========== 2026-11-04 · 布局质感升级 ========== */

/* ---- 侧边栏：深邃渐变 + 光泽 ---- */
.aside {
  background:
    radial-gradient(320px 240px at 110% -10%, rgba(124, 92, 255, 0.35), transparent 70%),
    radial-gradient(260px 200px at -20% 110%, rgba(22, 119, 255, 0.28), transparent 70%),
    linear-gradient(180deg, #0a1633 0%, #0e2249 48%, #141a3f 100%);
}

.aside::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent);
  pointer-events: none;
}

.logo {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo .el-icon {
  background: linear-gradient(135deg, #1677ff, #7b5cff);
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff !important;
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.45);
}

.logo-text {
  font-size: 18px;
  letter-spacing: 2px;
}

/* 菜单项：圆润 + 图标彩底 */
.menu :deep(.el-menu-item) {
  margin: 5px 10px;
  border-radius: 10px;
  height: 44px;
}

.menu :deep(.el-menu-item .el-icon) {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  transition: background 0.25s ease;
}

.menu :deep(.el-menu-item.is-active .el-icon) {
  background: rgba(255, 255, 255, 0.2);
}

.menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #1677ff 0%, #36cfc9 100%);
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.45);
  font-weight: 600;
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(22, 119, 255, 0.22);
}

/* ---- 顶栏：毛玻璃 + 渐变分隔 ---- */
.header {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 255, 0.86));
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  border-bottom: 1px solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 4px 20px rgba(15, 31, 77, 0.06);
}

.header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, #1677ff, #36cfc9 40%, transparent);
  opacity: 0.6;
}

/* ---- 主内容区：蓝调氛围背景 ---- */
.main {
  background:
    radial-gradient(1000px 480px at 88% -8%, rgba(22, 119, 255, 0.1), transparent 60%),
    radial-gradient(760px 420px at -6% 108%, rgba(124, 92, 255, 0.07), transparent 60%),
    linear-gradient(180deg, #f5f8fd 0%, #eef2f9 100%);
}

/* ---- 页脚：精致分隔 ---- */
.footer {
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(22, 119, 255, 0.06);
  font-size: 12.5px;
  letter-spacing: 0.4px;
}

.footer span:first-child {
  color: #5d6b82;
}

.footer-ver {
  color: #a7b0bf;
}
</style>
