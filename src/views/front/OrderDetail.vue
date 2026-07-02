<template>
  <div class="od-page">
    <div v-if="loading" class="od-loading">加载中...</div>
    <div v-else-if="!order" class="empty-state"><p>订单不存在</p></div>
    <div v-else>
      <div class="od-header">
        <router-link to="/orders" class="btn btn-sm">← 返回订单列表</router-link>
        <h1>订单 #{{ order.id }}</h1>
        <span class="order-status" :class="'status-' + order.status">{{
          statusMap[order.status]
        }}</span>
      </div>

      <div class="od-card">
        <h3>收货信息</h3>
        <div class="od-row">
          <span>收件人</span><span>{{ order.name || order.userName }}</span>
        </div>
        <div class="od-row">
          <span>手机号</span><span>{{ order.phone || '未填写' }}</span>
        </div>
        <div class="od-row">
          <span>地址</span><span>{{ order.address }}</span>
        </div>
      </div>

      <div v-if="order.tracking" class="od-card">
        <h3>物流信息</h3>
        <div class="od-row">
          <span>快递公司</span><span>{{ order.tracking.company || '—' }}</span>
        </div>
        <div class="od-row">
          <span>快递单号</span><span class="tracking-num">{{ order.tracking.number || '—' }}</span>
        </div>
      </div>

      <div class="od-card">
        <h3>商品清单</h3>
        <div v-for="item in order.items" :key="item.productId" class="od-item">
          <div class="od-item-img">
            <span class="od-item-char">{{ item.name[0] }}</span>
          </div>
          <div class="od-item-info">
            <span class="od-item-name">{{ item.name }}</span>
            <span class="od-item-price">¥{{ item.price }} × {{ item.qty }}</span>
          </div>
          <span class="od-item-total">¥{{ (item.price * item.qty).toLocaleString() }}</span>
        </div>
      </div>

      <div v-if="order.status === 'completed' && !reviewed" class="od-card">
        <h3>发表评价</h3>
        <div class="form-group">
          <label>评分</label>
          <div class="star-select">
            <span
              v-for="n in 5"
              :key="n"
              class="star-opt"
              :class="{ active: n <= reviewRating }"
              @click="reviewRating = n"
              >{{ n <= reviewRating ? '★' : '☆' }}</span
            >
          </div>
        </div>
        <div class="form-group">
          <textarea
            v-model="reviewContent"
            class="form-control"
            rows="3"
            placeholder="分享您的使用体验..."
          ></textarea>
        </div>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!reviewContent.trim()"
          @click="submitReviewFn"
        >
          提交评价
        </button>
      </div>

      <div class="od-card od-summary">
        <div class="od-row">
          <span>商品总额</span><span>¥{{ order.total.toLocaleString() }}</span>
        </div>
        <div class="od-row">
          <span>下单时间</span><span>{{ order.createdAt }}</span>
        </div>
        <div class="od-row od-final">
          <span>实付金额</span><span class="od-grand">¥{{ order.total.toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToastStore } from '../../stores/toast'
import { useAuthStore } from '../../stores/auth'
import request from '../../api/request'
import { submitReview } from '../../api/review'

const route = useRoute()
const toast = useToastStore()
const auth = useAuthStore()
const order = ref(null)
const loading = ref(true)
const reviewed = ref(false)
const reviewRating = ref(5)
const reviewContent = ref('')

const statusMap = { pending: '待处理', shipped: '已发货', completed: '已完成', cancelled: '已取消' }

onMounted(async () => {
  try {
    const orders = await request.get('/orders/my')
    order.value = orders.find((o) => o.id === Number(route.params.id)) || null
  } catch {}
  loading.value = false
})

async function submitReviewFn() {
  if (!reviewContent.value.trim()) return
  try {
    for (const item of order.value.items) {
      await submitReview({
        productId: item.productId,
        orderId: order.value.id,
        username: auth.effectiveUser?.username || '用户',
        rating: reviewRating.value,
        content: reviewContent.value.trim(),
      })
    }
    reviewed.value = true
    toast.show('评价成功', 'success')
  } catch {
    toast.show('提交失败', 'error')
  }
}
</script>

<style scoped>
.od-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}
.od-loading {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
}
.od-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.od-header h1 {
  font-size: 22px;
  font-weight: 700;
  flex: 1;
}
.order-status {
  font-size: 13px;
  padding: 4px 12px;
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
.od-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}
.od-card h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.od-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}
.od-row span:first-child {
  color: var(--text-secondary);
}
.od-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.od-item:last-child {
  border-bottom: none;
}
.od-item-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ede9fe, #dbeafe);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.od-item-char {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  opacity: 0.4;
}
.od-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.od-item-name {
  font-size: 14px;
  font-weight: 600;
}
.od-item-price {
  font-size: 12px;
  color: var(--text-secondary);
}
.od-item-total {
  font-size: 15px;
  font-weight: 600;
}
.od-summary {
  margin-top: 0;
}
.od-final {
  font-size: 16px;
  font-weight: 700;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  margin-top: 8px;
}
.od-grand {
  color: var(--danger);
  font-size: 20px;
}
.tracking-num {
  font-weight: 600;
  color: var(--primary);
}
.star-select {
  display: flex;
  gap: 4px;
  font-size: 24px;
}
.star-opt {
  cursor: pointer;
  color: #d1d5db;
  transition: color 0.15s;
}
.star-opt.active {
  color: #f59e0b;
}
.star-opt:hover {
  color: #f59e0b;
}
</style>
