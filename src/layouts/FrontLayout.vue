<template>
  <div class="front-layout">
    <header class="front-header" role="banner">
      <div class="header-inner">
        <router-link to="/" class="logo" :aria-label="$t('nav.home')">
          <span class="logo-icon" aria-hidden="true">◆</span>
          <span class="logo-text">VeStore</span>
        </router-link>

        <button
          class="mobile-menu-btn"
          @click="mobileMenu = !mobileMenu"
          :aria-expanded="mobileMenu"
          :aria-label="$t('common.search')"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <nav class="header-nav" :class="{ open: mobileMenu }" role="navigation" aria-label="主导航">
          <router-link
            to="/"
            class="nav-link"
            :class="{ active: $route.path === '/' }"
            @click="mobileMenu = false"
            >{{ $t('nav.home') }}</router-link
          >
          <router-link
            to="/products"
            class="nav-link"
            :class="{ active: $route.path.startsWith('/products') }"
            @click="mobileMenu = false"
            >{{ $t('nav.products') }}</router-link
          >
        </nav>
        <div class="header-search">
          <input
            v-model="searchWord"
            class="search-input"
            :placeholder="$t('common.search') + '...'"
            @keyup.enter="doSearch"
          />
        </div>

        <div class="header-actions">
          <LocaleSwitcher />
          <router-link to="/cart" class="cart-btn">
            <span class="cart-icon">🛒</span>
            <span v-if="cart.count > 0" class="cart-badge">{{ cart.count }}</span>
          </router-link>
          <!-- 已登录：头像 + 用户名下拉菜单 -->
          <div v-if="auth.isLoggedIn" class="user-menu-wrapper" ref="menuRef">
            <div class="user-trigger" @click="menuOpen = !menuOpen">
              <div class="user-avatar-sm">
                <img v-if="auth.effectiveUser?.avatar" :src="auth.effectiveUser.avatar" alt="" />
                <span v-else class="avatar-letter-sm">{{ (auth.effectiveUser?.username || 'U').charAt(0).toUpperCase() }}</span>
              </div>
              <span class="user-name-sm">{{ auth.effectiveUser?.username }}</span>
              <span class="menu-arrow" :class="{ open: menuOpen }">▾</span>
            </div>
            <transition name="menu-fade">
              <div v-if="menuOpen" class="user-dropdown">
                <router-link to="/profile" class="dropdown-item" @click="menuOpen = false">
                  <span class="dropdown-icon">👤</span> {{ $t('nav.profile') }}
                </router-link>
                <router-link to="/orders" class="dropdown-item" @click="menuOpen = false">
                  <span class="dropdown-icon">📋</span> {{ $t('nav.orders') }}
                </router-link>
                <router-link to="/wishlist" class="dropdown-item" @click="menuOpen = false">
                  <span class="dropdown-icon">❤️</span> {{ $t('nav.wishlist') }}
                </router-link>
                <router-link to="/addresses" class="dropdown-item" @click="menuOpen = false">
                  <span class="dropdown-icon">📍</span> {{ $t('nav.addresses') }}
                </router-link>
                <router-link to="/coupons" class="dropdown-item" @click="menuOpen = false">
                  <span class="dropdown-icon">🎫</span> {{ $t('nav.coupons') }}
                </router-link>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item dropdown-logout" @click="handleLogout">
                  <span class="dropdown-icon">🚪</span> {{ $t('auth.logout') }}
                </button>
              </div>
            </transition>
          </div>
          <!-- 未登录：登录 + 注册 -->
          <template v-else>
            <router-link to="/login" class="btn btn-sm">{{ $t('auth.login') }}</router-link>
            <router-link to="/register" class="btn btn-sm btn-primary">{{
              $t('auth.register')
            }}</router-link>
          </template>
        </div>
      </div>
    </header>

    <main class="front-main" id="main-content" role="main">
      <router-view v-slot="{ Component }">
        <keep-alive :max="10">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <footer class="front-footer">
      <div class="footer-inner">
        <div class="footer-col">
          <h4>VeStore</h4>
          <p>{{ $t('footer.slogan') }}</p>
        </div>
        <div class="footer-col">
          <h4>{{ $t('footer.quickLinks') }}</h4>
          <router-link to="/">{{ $t('nav.home') }}</router-link>
          <router-link to="/products">{{ $t('nav.products') }}</router-link>
        </div>
        <div class="footer-col">
          <h4>{{ $t('footer.contactUs') }}</h4>
          <span>邮箱: support@vestore.com</span>
          <span>电话: 400-888-0000</span>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ $t('footer.copyright') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'

const $router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const mobileMenu = ref(false)
const searchWord = ref('')
const menuOpen = ref(false)
const menuRef = ref(null)

function doSearch() {
  if (!searchWord.value.trim()) return
  $router.push(`/products?search=${encodeURIComponent(searchWord.value.trim())}`)
  searchWord.value = ''
}

function handleLogout() {
  menuOpen.value = false
  auth.logout()
  $router.push('/')
}

// 点击外部关闭下拉菜单
function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.front-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.front-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.logo-icon {
  font-size: 24px;
  color: var(--primary);
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}
.header-nav {
  display: flex;
  gap: 8px;
}
.nav-link {
  padding: 8px 16px;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 15px;
  text-decoration: none;
  transition: all 0.15s;
}
.nav-link:hover {
  color: var(--primary);
  background: #f1f5f9;
  text-decoration: none;
}
.nav-link.active {
  color: var(--primary);
  font-weight: 600;
}
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--text);
  padding: 4px;
}
.header-search {
  margin: 0 8px;
}
.search-input {
  width: 160px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}
.search-input:focus {
  border-color: var(--primary);
}
@media (max-width: 768px) {
  .header-search {
    display: none;
  }
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ── 用户下拉菜单 ── */
.user-menu-wrapper {
  position: relative;
}
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
  user-select: none;
}
.user-trigger:hover {
  background: var(--bg-hover, #f1f5f9);
}
.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-avatar-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-letter-sm {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.user-name-sm {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-arrow {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.2s;
}
.menu-arrow.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 200;
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text);
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.15s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.dropdown-item:hover {
  background: var(--bg-hover, #f1f5f9);
}
.dropdown-icon {
  font-size: 16px;
  flex-shrink: 0;
}
.dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}
.dropdown-logout {
  color: var(--danger, #dc2626);
}
.dropdown-logout:hover {
  background: #fef2f2;
}

/* 下拉动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── 购物车 ── */
.cart-btn {
  position: relative;
  font-size: 22px;
  text-decoration: none;
  padding: 6px;
  line-height: 1;
}
.cart-badge {
  position: absolute;
  top: -2px;
  right: -6px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.front-main {
  flex: 1;
}

.front-footer {
  background: #1e293b;
  color: #cbd5e1;
  margin-top: 60px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 32px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-col h4 {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}
.footer-col a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
}
.footer-col a:hover {
  color: #fff;
  text-decoration: none;
}
.footer-bottom {
  border-top: 1px solid #334155;
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #64748b;
}
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
  .header-nav {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: var(--bg-card);
    flex-direction: column;
    padding: 12px;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .header-nav.open {
    display: flex;
  }
}
</style>
