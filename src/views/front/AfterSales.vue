<template>
  <div class="as-page">
    <div class="as-header">
      <h1>退换货</h1>
      <button class="btn btn-primary" @click="showForm = true">申请售后</button>
    </div>
    <div v-if="showForm" class="card" style="padding: 20px; max-width: 520px; margin-bottom: 20px">
      <h3>申请售后</h3>
      <div class="form-group">
        <label>订单号</label><input v-model="form.orderId" class="form-control" />
      </div>
      <div class="form-group">
        <label>类型</label
        ><select v-model="form.type" class="form-control">
          <option value="refund">仅退款</option>
          <option value="return">退货退款</option>
          <option value="exchange">换货</option>
        </select>
      </div>
      <div class="form-group">
        <label>原因</label><textarea v-model="form.reason" class="form-control" rows="3"></textarea>
      </div>
      <div style="display: flex; gap: 10px">
        <button class="btn btn-primary" @click="submitAS">提交</button
        ><button class="btn" @click="showForm = false">取消</button>
      </div>
    </div>
    <div v-if="!list.length" class="empty-state"><p>暂无售后记录</p></div>
    <div v-else class="as-list">
      <div v-for="a in list" :key="a.id" class="as-card">
        <div class="as-top">
          <span>订单 #{{ a.orderId }}</span
          ><span class="order-status" :class="'status-' + a.status">{{
            { pending: '处理中', approved: '已通过', rejected: '已拒绝', done: '已完成' }[
              a.status
            ] || a.status
          }}</span>
        </div>
        <div class="as-body">
          {{ a.type === 'refund' ? '仅退款' : a.type === 'return' ? '退货退款' : '换货' }} —
          {{ a.reason }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import request from '../../api/request'
import { useToastStore } from '../../stores/toast'
const toast = useToastStore()
const list = ref([])
const showForm = ref(false)
const form = ref({ orderId: '', type: 'refund', reason: '' })
onMounted(load)
async function load() {
  try {
    list.value = await request.get('/after-sales/my')
  } catch {}
}
async function submitAS() {
  try {
    await request.post('/after-sales', form.value)
    toast.show('已提交', 'success')
    showForm.value = false
    form.value = { orderId: '', type: 'refund', reason: '' }
    await load()
  } catch {
    toast.show('提交失败', 'error')
  }
}
</script>
<style scoped>
.as-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}
.as-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.as-header h1 {
  font-size: 28px;
  font-weight: 700;
}
.as-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.as-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
.as-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}
.as-body {
  font-size: 14px;
  color: var(--text-secondary);
}
.order-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-approved {
  background: #dbeafe;
  color: #1e40af;
}
.status-rejected {
  background: #fce4ec;
  color: #b71c1c;
}
.status-done {
  background: #d1fae5;
  color: #065f46;
}
</style>
