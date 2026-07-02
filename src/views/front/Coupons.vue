<template>
  <div class="cp-page">
    <h1>我的优惠券</h1>
    <div v-if="!coupons.length" class="empty-state"><p>暂无可用优惠券</p></div>
    <div v-else class="cp-list">
      <div v-for="c in coupons" :key="c.id" class="cp-card" :class="{ used: c.used }">
        <div class="cp-left">
          <span class="cp-amount">¥{{ c.discount }}</span>
          <span class="cp-min">满{{ c.minAmount }}可用</span>
        </div>
        <div class="cp-right">
          <div class="cp-name">{{ c.name }}</div>
          <div class="cp-expire">有效期至: {{ c.expireAt || '永久' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import request from '../../api/request'
const coupons = ref([])
onMounted(async () => {
  try {
    coupons.value = await request.get('/user/coupons')
  } catch {}
})
</script>
<style scoped>
.cp-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}
.cp-page h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
}
.cp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cp-card {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.cp-left {
  width: 120px;
  background: var(--primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.cp-amount {
  font-size: 28px;
  font-weight: 800;
}
.cp-min {
  font-size: 12px;
  opacity: 0.8;
}
.cp-right {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cp-name {
  font-weight: 600;
}
.cp-expire {
  font-size: 13px;
  color: var(--text-secondary);
}
.cp-card.used {
  opacity: 0.5;
}
</style>
