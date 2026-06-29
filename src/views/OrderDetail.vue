<template>
  <div v-if="order">
    <div class="page-header">
      <h2>订单详情 #{{ order.id }}</h2>
      <router-link to="/orders" class="btn">← 返回列表</router-link>
    </div>

    <div class="detail-grid">
      <div class="card">
        <h3 class="section-title">订单信息</h3>
        <div class="info-row"><span class="info-label">订单号</span><span>{{ order.id }}</span></div>
        <div class="info-row"><span class="info-label">状态</span>
          <span class="badge" :class="statusClass">{{ statusText }}</span>
        </div>
        <div class="info-row"><span class="info-label">创建时间</span><span>{{ order.createdAt }}</span></div>
        <div class="info-row"><span class="info-label">总金额</span><span class="total-amount">¥{{ order.total.toLocaleString() }}</span></div>
      </div>

      <div class="card">
        <h3 class="section-title">用户信息</h3>
        <div class="info-row"><span class="info-label">用户名</span><span>{{ order.userName }}</span></div>
        <div class="info-row"><span class="info-label">用户ID</span><span>{{ order.userId }}</span></div>
        <div class="info-row"><span class="info-label">收货地址</span><span>{{ order.address }}</span></div>
      </div>
    </div>

    <div class="card" style="margin-top: 20px;">
      <h3 class="section-title">商品明细</h3>
      <table>
        <thead>
          <tr><th>商品名称</th><th>单价</th><th>数量</th><th>小计</th></tr>
        </thead>
        <tbody>
          <tr v-for="(item, i) in order.items" :key="i">
            <td>{{ item.name }}</td>
            <td>¥{{ item.price }}</td>
            <td>{{ item.qty }}</td>
            <td>¥{{ (item.price * item.qty).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 20px; display: flex; gap: 10px;">
      <button v-if="order.status === 'pending'" class="btn btn-primary" @click="updateStatus('shipped')">确认发货</button>
      <button v-if="order.status === 'pending'" class="btn btn-danger" @click="updateStatus('cancelled')">取消订单</button>
    </div>
  </div>
  <div v-else class="empty-state"><p>加载中...</p></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const store = useResourceStore('order-detail', '/orders')
const toast = useToastStore()

const order = ref(null)

const statusMap = { pending: '待处理', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
const statusText = computed(() => statusMap[order.value?.status] || order.value?.status)
const statusClass = computed(() => {
  const s = order.value?.status
  if (s === 'pending') return 'badge-pending'
  if (s === 'shipped') return 'badge-shipped'
  if (s === 'completed') return 'badge-completed'
  if (s === 'cancelled') return 'badge-cancelled'
  return 'badge-inactive'
})

onMounted(async () => {
  try {
    await store.fetchById(route.params.id)
    if (store.current) {
      order.value = store.current
    } else {
      toast.show('订单不存在', 'error')
      router.push('/orders')
    }
  } catch {
    toast.show('加载订单失败', 'error')
    router.push('/orders')
  }
})

async function updateStatus(status) {
  try {
    await store.save({ ...order.value, status })
    order.value.status = status
    toast.show(`订单已${statusMap[status]}`, 'success')
  } catch {
    toast.show('操作失败', 'error')
  }
}
</script>

<style scoped>
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
.info-row { display: flex; padding: 8px 0; font-size: 14px; }
.info-label { width: 100px; color: var(--text-secondary); flex-shrink: 0; }
.total-amount { font-weight: 700; color: var(--danger); font-size: 16px; }
</style>
