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
          <template v-if="auth.isLoggedIn">
            <router-link to="/wishlist" class="btn btn-sm">{{ $t('nav.wishlist') }}</router-link>
            <router-link to="/orders" class="btn btn-sm">{{ $t('nav.orders') }}</router-link>
            <router-link to="/coupons" class="btn btn-sm">{{ $t('nav.coupons') }}</router-link>
            <router-link to="/after-sales" class="btn btn-sm">{{
              $t('nav.afterSales')
            }}</router-link>
            <router-link to="/invoices" class="btn btn-sm">{{ $t('nav.invoices') }}</router-link>
            <router-link to="/addresses" class="btn btn-sm">{{ $t('nav.addresses') }}</router-link>
            <router-link to="/chat" class="btn btn-sm">{{ $t('nav.chat') }}</router-link>
            <span class="user-greeting">{{ auth.effectiveUser?.username }}</span>
            <button class="btn btn-sm" @click="handleLogout">{{ $t('auth.logout') }}</button>
          </template>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'

const $router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const mobileMenu = ref(false)
const searchWord = ref('')

function doSearch() {
  if (!searchWord.value.trim()) return
  $router.push(`/products?search=${encodeURIComponent(searchWord.value.trim())}`)
  searchWord.value = ''
}

function handleLogout() {
  auth.logout()
  $router.push('/')
}
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
.user-greeting {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}
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
