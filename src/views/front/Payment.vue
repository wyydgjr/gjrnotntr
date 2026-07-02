<template>
  <div class="payment-page">
    <div class="payment-card">
      <h1>确认支付</h1>
      <p class="payment-amount">
        应付金额: <span class="amount">¥{{ total.toLocaleString() }}</span>
      </p>

      <div class="payment-methods">
        <div class="pm-item" :class="{ active: method === 'wechat' }" @click="method = 'wechat'">
          <span class="pm-icon">💚</span>
          <span>微信支付</span>
        </div>
        <div class="pm-item" :class="{ active: method === 'alipay' }" @click="method = 'alipay'">
          <span class="pm-icon">💙</span>
          <span>支付宝</span>
        </div>
        <div class="pm-item" :class="{ active: method === 'mock' }" @click="method = 'mock'">
          <span class="pm-icon">💰</span>
          <span>模拟支付（测试）</span>
        </div>
      </div>

      <p v-if="error" class="payment-error">{{ error }}</p>
      <button class="btn btn-primary payment-btn" :disabled="paying" @click="handlePay">
        {{ paying ? '支付中...' : `确认支付 ¥${total.toLocaleString()}` }}
      </button>
      <button class="btn payment-cancel" @click="$router.push('/checkout')">返回修改</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { createOrder } from '../../api/order'

const $router = useRouter()
const route = useRoute()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToastStore()

const method = ref('mock')
const paying = ref(false)
const error = ref('')
const total = ref(0)

const orderData = ref(null)

onMounted(() => {
  try {
    orderData.value = JSON.parse(route.query.data || '{}')
    total.value = Number(orderData.value.total) || 0
  } catch {}
  if (!total.value) $router.push('/cart')
})

async function handlePay() {
  if (!orderData.value) return
  paying.value = true
  error.value = ''
  try {
    const order = await createOrder(orderData.value)
    const orderId = order.id
    cart.clear()
    toast.show(method.value === 'mock' ? '支付成功（模拟）' : '支付成功', 'success')
    $router.push(`/order-success?id=${orderId}`)
  } catch (e) {
    error.value = e.response?.data?.message || '支付失败，请重试'
  }
  paying.value = false
}
</script>

<style scoped>
.payment-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 40px 24px;
}
.payment-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
.payment-card h1 {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}
.payment-amount {
  text-align: center;
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
.amount {
  font-size: 28px;
  font-weight: 700;
  color: var(--danger);
}
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}
.pm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.15s;
}
.pm-item:hover {
  border-color: #cbd5e1;
}
.pm-item.active {
  border-color: var(--primary);
  background: #ede9fe;
}
.pm-icon {
  font-size: 24px;
}
.payment-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 16px;
}
.payment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.payment-error {
  color: var(--danger);
  font-size: 13px;
  text-align: center;
  margin-bottom: 12px;
}
.payment-cancel {
  width: 100%;
  justify-content: center;
  margin-top: 8px;
}
</style>
