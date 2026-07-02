<template>
  <div class="checkout-page">
    <h1 class="checkout-title">结算</h1>

    <div v-if="cart.isEmpty" class="empty-checkout">
      <p>购物车是空的</p>
      <router-link to="/products" class="btn btn-primary">去选购</router-link>
    </div>

    <div v-else class="checkout-layout">
      <div class="checkout-form">
        <div class="card">
          <h3>收货信息</h3>
          <div v-if="addresses.length" class="addr-select">
            <div
              v-for="a in addresses"
              :key="a.id"
              class="addr-option"
              :class="{ selected: selectedAddr?.id === a.id }"
              @click="selectAddr(a)"
            >
              <div class="addr-opt-top">
                <span class="addr-opt-name">{{ a.name }}</span>
                <span class="addr-opt-phone">{{ a.phone }}</span>
                <span v-if="a.isDefault" class="addr-default">默认</span>
              </div>
              <div class="addr-opt-detail">
                {{ a.province }}{{ a.city }}{{ a.district }} {{ a.detail }}
              </div>
            </div>
            <router-link to="/addresses" class="btn btn-sm" style="margin-top: 8px"
              >管理地址</router-link
            >
          </div>
          <div v-else>
            <div class="form-group">
              <label>收件人</label><input v-model="form.name" class="form-control" />
            </div>
            <div class="form-group">
              <label>手机号</label><input v-model="form.phone" class="form-control" />
            </div>
            <div class="form-group">
              <label>地址</label><input v-model="form.address" class="form-control" />
            </div>
            <router-link to="/addresses" class="btn btn-sm">新建地址</router-link>
          </div>
        </div>

        <div class="card" style="margin-top: 20px">
          <h3>商品清单</h3>
          <div v-for="item in cart.items" :key="item.productId" class="checkout-item">
            <span>{{ item.name }} × {{ item.qty }}</span>
            <span>¥{{ (item.price * item.qty).toLocaleString() }}</span>
          </div>
        </div>

        <p v-if="error" class="checkout-error">{{ error }}</p>
        <button class="btn btn-primary submit-btn" :disabled="submitting" @click="submitOrder">
          {{
            submitting
              ? '提交中...'
              : `确认支付 ¥${(cart.total + (cart.total >= 99 ? 0 : 15)).toLocaleString()}`
          }}
        </button>
      </div>

      <div class="checkout-summary">
        <div class="card">
          <h3>订单摘要</h3>
          <div class="summary-row">
            <span>商品总额</span>
            <span>¥{{ cart.total.toLocaleString() }}</span>
          </div>
          <div class="summary-row">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { useToastStore } from '../../stores/toast'
import { getAddresses } from '../../api/address'

const $router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const toast = useToastStore()

const form = ref({ name: '', phone: '', address: '' })
const addresses = ref([])
const selectedAddr = ref(null)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const list = await getAddresses()
    addresses.value = list
    const def = list.find((a) => a.isDefault)
    if (def) selectAddr(def)
  } catch {}
})

function selectAddr(a) {
  selectedAddr.value = a
  form.value = {
    name: a.name,
    phone: a.phone,
    address: `${a.province}${a.city}${a.district} ${a.detail}`,
  }
}
async function submitOrder() {
  if (!form.value.name || !form.value.phone || !form.value.address) {
    error.value = '请填写完整的收货信息'
    return
  }
  if (!/^1\d{10}$/.test(form.value.phone)) {
    error.value = '请输入正确的手机号'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const orderData = {
      items: cart.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      total: cart.total + (cart.total >= 99 ? 0 : 15),
      name: form.value.name,
      address: form.value.address,
      phone: form.value.phone,
    }
    $router.push(`/payment?data=${encodeURIComponent(JSON.stringify(orderData))}`)
  } catch (e) {
    error.value = '页面跳转失败'
  }
  submitting.value = false
}
</script>

<style scoped>
.checkout-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
.checkout-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
}
.empty-checkout {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
}
.empty-checkout p {
  margin-bottom: 16px;
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 32px;
  align-items: start;
}
@media (max-width: 768px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}

.checkout-form .card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}
.checkout-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}
.checkout-item:last-child {
  border-bottom: none;
}
.checkout-error {
  color: var(--danger);
  font-size: 14px;
  margin: 12px 0;
}
.submit-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 16px;
  margin-top: 20px;
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.addr-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.addr-option {
  padding: 12px;
  border: 2px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.addr-option:hover {
  border-color: #cbd5e1;
}
.addr-option.selected {
  border-color: var(--primary);
  background: #ede9fe;
}
.addr-opt-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.addr-opt-name {
  font-weight: 600;
  font-size: 14px;
}
.addr-opt-phone {
  font-size: 13px;
  color: var(--text-secondary);
}
.addr-default {
  font-size: 11px;
  background: var(--primary);
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
}
.addr-opt-detail {
  font-size: 13px;
  color: var(--text-secondary);
}

.checkout-summary {
  position: sticky;
  top: 88px;
}
.checkout-summary .card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 10px;
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
</style>
