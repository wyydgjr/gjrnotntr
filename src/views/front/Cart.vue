<template>
  <div class="cart-page">
    <h1 class="cart-title">购物车</h1>

    <div v-if="cart.isEmpty" class="empty-cart">
      <p>购物车是空的</p>
      <router-link to="/products" class="btn btn-primary">去逛逛</router-link>
    </div>

    <div v-else class="cart-layout">
      <div class="cart-items">
        <div v-for="item in cart.items" :key="item.productId" class="cart-item">
          <div class="cart-item-img">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="cart-real-img" />
            <span v-else class="cart-item-placeholder">{{ item.name[0] }}</span>
          </div>
          <div class="cart-item-info">
            <h3 class="cart-item-name">{{ item.name }}</h3>
            <span class="cart-item-price">¥{{ item.price.toLocaleString() }}</span>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" @click="cart.updateQty(item.productId, item.qty - 1)">−</button>
            <span class="qty-value">{{ item.qty }}</span>
            <button class="qty-btn" @click="cart.updateQty(item.productId, item.qty + 1)">+</button>
          </div>
          <div class="cart-item-subtotal">¥{{ (item.price * item.qty).toLocaleString() }}</div>
          <button class="cart-item-remove" @click="cart.remove(item.productId)">✕</button>
        </div>
      </div>

      <div class="cart-summary">
        <h3>订单摘要</h3>
        <div class="summary-row">
          <span>商品数量</span>
          <span>{{ cart.count }} 件</span>
        </div>
        <div class="summary-row">
          <span>商品小计</span>
          <span class="summary-total">¥{{ cart.total.toLocaleString() }}</span>
        </div>
        <div class="summary-row summary-note">
          <span>运费</span>
          <span>{{ cart.total >= 99 ? '免运费' : '¥15' }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row summary-final">
          <span>应付总额</span>
          <span class="summary-grand"
            >¥{{ (cart.total + (cart.total >= 99 ? 0 : 15)).toLocaleString() }}</span
          >
        </div>
        <button class="btn btn-primary checkout-btn" @click="goCheckout">去结算</button>
        <button class="btn clear-btn" @click="cart.clear()">清空购物车</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'

const $router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()

function goCheckout() {
  if (cart.isEmpty) return
  if (!auth.isLoggedIn) {
    $router.push('/login')
    return
  }
  $router.push('/checkout')
}
</script>

<style scoped>
.cart-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
.cart-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
}

.empty-cart {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
}
.empty-cart p {
  margin-bottom: 16px;
  font-size: 16px;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 32px;
  align-items: start;
}
@media (max-width: 768px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cart-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.cart-item-img {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ede9fe, #dbeafe);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cart-item-placeholder {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  opacity: 0.4;
}
.cart-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.cart-item-info {
  flex: 1;
  min-width: 0;
}
.cart-item-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}
.cart-item-price {
  font-size: 14px;
  color: var(--text-secondary);
}
.cart-item-qty {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.qty-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg);
  cursor: pointer;
  font-size: 16px;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-btn:hover {
  background: var(--primary);
  color: #fff;
}
.qty-value {
  width: 36px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}
.cart-item-subtotal {
  font-size: 16px;
  font-weight: 600;
  min-width: 80px;
  text-align: right;
}
.cart-item-remove {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}
.cart-item-remove:hover {
  color: var(--danger);
}

.cart-summary {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  position: sticky;
  top: 88px;
}
.cart-summary h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 12px;
}
.summary-total {
  font-weight: 600;
}
.summary-note {
  color: var(--text-secondary);
}
.summary-divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}
.summary-final {
  font-size: 16px;
  font-weight: 700;
}
.summary-grand {
  font-size: 22px;
  color: var(--danger);
}
.checkout-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 16px;
  margin-top: 20px;
}
.clear-btn {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}
</style>
