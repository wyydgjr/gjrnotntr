<template>
  <div class="orders-page">
    <h1 class="orders-title">我的订单</h1>

    <div v-if="loading" class="orders-loading">加载中...</div>
    <div v-else-if="orders.length === 0" class="orders-empty">
      <p>暂无订单</p>
      <router-link to="/products" class="btn btn-primary">去逛逛</router-link>
    </div>
    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <router-link :to="`/orders/${order.id}`" class="order-id"
            >订单 #{{ order.id }}</router-link
          >
          <span class="order-status" :class="'status-' + order.status">{{
            statusMap[order.status]
          }}</span>
        </div>
        <div class="order-items">
          <div v-for="item in order.items" :key="item.productId" class="order-item">
            <span>{{ item.name }} × {{ item.qty }}</span>
            <span>¥{{ (item.price * item.qty).toLocaleString() }}</span>
          </div>
        </div>
        <div class="order-footer">
          <span class="order-time">{{ order.createdAt }}</span>
          <div class="order-footer-right">
            <span class="order-total">合计: ¥{{ order.total.toLocaleString() }}</span>
            <button
              v-if="order.status === 'pending'"
              class="btn btn-sm btn-danger"
              @click="cancelOrder(order)"
            >
              取消订单
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyOrders } from '../../api/order'
import { useToastStore } from '../../stores/toast'
import request from '../../api/request'
import logger from '../../utils/logger'

const toast = useToastStore()
const orders = ref([])
const loading = ref(true)

const statusMap = {
  pending: '待处理',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

onMounted(async () => {
  try {
    orders.value = await getMyOrders()
  } catch (e) {
    logger.error('Failed to load orders:', e)
  }
  loading.value = false
})

async function cancelOrder(order) {
  if (!confirm(`确认取消订单 #${order.id}？`)) return
  try {
    await request.put(`/orders/${order.id}`, { ...order, status: 'cancelled' })
    order.status = 'cancelled'
    toast.show('订单已取消', 'success')
  } catch {
    toast.show('取消失败', 'error')
  }
}
</script>

<style scoped>
.orders-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}
.orders-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
}
.orders-loading,
.orders-empty {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
}
.orders-empty p {
  margin-bottom: 16px;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.order-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.order-id {
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
  text-decoration: none;
}
.order-id:hover {
  color: var(--primary);
  text-decoration: underline;
}
.order-status {
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 600;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-shipped {
  background: #dbeafe;
  color: #1e40af;
}
.status-completed {
  background: #d1fae5;
  color: #065f46;
}
.status-cancelled {
  background: #fce4ec;
  color: #b71c1c;
}
.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.order-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.order-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
}
.order-total {
  font-size: 16px;
  font-weight: 700;
  color: var(--danger);
}
.order-footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
