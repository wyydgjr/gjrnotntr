<template>
  <div class="inv-page">
    <div class="inv-header">
      <h1>发票管理</h1>
      <button class="btn btn-primary" @click="showForm = true">申请发票</button>
    </div>
    <div v-if="showForm" class="card" style="padding: 20px; max-width: 520px; margin-bottom: 20px">
      <h3>申请发票</h3>
      <div class="form-group">
        <label>订单号</label><input v-model="form.orderId" class="form-control" />
      </div>
      <div class="form-group">
        <label>发票抬头</label><input v-model="form.title" class="form-control" />
      </div>
      <div class="form-group">
        <label>税号</label><input v-model="form.taxId" class="form-control" />
      </div>
      <div class="form-group">
        <label>邮箱</label><input v-model="form.email" class="form-control" type="email" />
      </div>
      <div style="display: flex; gap: 10px">
        <button class="btn btn-primary" @click="submitInv">提交</button
        ><button class="btn" @click="showForm = false">取消</button>
      </div>
    </div>
    <div v-if="!list.length" class="empty-state"><p>暂无发票</p></div>
    <div v-else class="inv-list">
      <div v-for="i in list" :key="i.id" class="inv-card">
        <div class="inv-top">
          <span>订单 #{{ i.orderId }}</span
          ><span>{{ { pending: '待开票', done: '已开票' }[i.status] || i.status }}</span>
        </div>
        <div class="inv-body">{{ i.title }}（{{ i.taxId }}）</div>
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
const form = ref({ orderId: '', title: '', taxId: '', email: '' })
onMounted(load)
async function load() {
  try {
    list.value = await request.get('/invoices/my')
  } catch {}
}
async function submitInv() {
  try {
    await request.post('/invoices', form.value)
    toast.show('已提交', 'success')
    showForm.value = false
    form.value = { orderId: '', title: '', taxId: '', email: '' }
    await load()
  } catch {
    toast.show('提交失败', 'error')
  }
}
</script>
<style scoped>
.inv-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}
.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.inv-header h1 {
  font-size: 28px;
  font-weight: 700;
}
.inv-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inv-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
.inv-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-weight: 600;
}
.inv-body {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
