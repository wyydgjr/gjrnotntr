<template>
  <div class="success-page">
    <div class="success-card">
      <div class="success-icon">✅</div>
      <h1>下单成功！</h1>
      <p class="success-order-id">订单号: #{{ orderId }}</p>
      <p>感谢您的购买，我们会尽快为您安排发货。</p>
      <div class="success-actions">
        <router-link to="/orders" class="btn btn-primary">查看订单</router-link>
        <router-link to="/" class="btn">返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const orderId = ref(route.query.id || '--')
</script>

<style scoped>
.success-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
}
.success-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 60px 40px;
}
.success-icon {
  font-size: 64px;
  margin-bottom: 20px;
}
.success-card h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}
.success-order-id {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 8px;
}
.success-card p {
  color: var(--text-secondary);
  font-size: 15px;
  margin-bottom: 32px;
}
.success-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
