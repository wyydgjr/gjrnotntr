<template>
  <div class="addr-page">
    <div class="addr-header">
      <h1>收货地址</h1>
      <button
        class="btn btn-primary"
        @click="openAddForm"
      >
        + 新增地址
      </button>
    </div>

    <div v-if="!showForm" class="addr-list">
      <div v-for="addr in addresses" :key="addr.id" class="addr-card">
        <div class="addr-top">
          <span class="addr-name">{{ addr.name }}</span>
          <span class="addr-phone">{{ addr.phone }}</span>
          <span v-if="addr.isDefault" class="addr-default">默认</span>
        </div>
        <div class="addr-detail">
          {{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}
        </div>
        <div class="addr-actions">
          <button class="btn btn-sm" @click="editAddr(addr)">编辑</button>
          <button v-if="!addr.isDefault" class="btn btn-sm" @click="setDefault(addr)">
            设为默认
          </button>
          <button class="btn btn-sm btn-danger" @click="delAddr(addr)">删除</button>
        </div>
      </div>
      <div v-if="!addresses.length" class="empty-state"><p>还没有收货地址</p></div>
    </div>

    <div v-else class="addr-form card" style="max-width: 520px; padding: 24px">
      <h3>{{ editing ? '编辑地址' : '新增地址' }}</h3>
      <form @submit.prevent="saveAddr">
        <div class="form-group">
          <label>收件人</label><input v-model="form.name" class="form-control" required />
        </div>
        <div class="form-group">
          <label>手机号</label><input v-model="form.phone" class="form-control" required />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px">
          <div class="form-group">
            <label>省</label><input v-model="form.province" class="form-control" required />
          </div>
          <div class="form-group">
            <label>市</label><input v-model="form.city" class="form-control" required />
          </div>
          <div class="form-group">
            <label>区</label><input v-model="form.district" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label>详细地址</label><input v-model="form.detail" class="form-control" required />
        </div>
        <div class="form-group" style="flex-direction: row; gap: 8px">
          <label style="margin: 0"
            ><input type="checkbox" v-model="form.isDefault" /> 设为默认地址</label
          >
        </div>
        <div style="display: flex; gap: 10px; margin-top: 16px">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button type="button" class="btn" @click="showForm = false">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToastStore } from '../../stores/toast'
import { getAddresses, saveAddress, deleteAddress } from '../../api/address'

const toast = useToastStore()
const addresses = ref([])
const showForm = ref(false)
const editing = ref(null)
const saving = ref(false)

function openAddForm() { showForm.value = true; editing.value = null }
const form = ref({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
})

onMounted(load)

async function load() {
  try {
    addresses.value = await getAddresses()
  } catch {}
}

function editAddr(a) {
  editing.value = a
  form.value = { ...a }
  showForm.value = true
}

async function saveAddr() {
  saving.value = true
  try {
    const data = { ...form.value }
    if (editing.value) data.id = editing.value.id
    await saveAddress(data)
    toast.show('保存成功', 'success')
    showForm.value = false
    editing.value = null
    form.value = {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false,
    }
    await load()
  } catch {
    toast.show('保存失败', 'error')
  }
  saving.value = false
}

async function setDefault(a) {
  try {
    await saveAddress({ ...a, isDefault: true })
    toast.show('已设为默认', 'success')
    await load()
  } catch {
    toast.show('操作失败', 'error')
  }
}

async function delAddr(a) {
  if (!confirm(`删除 ${a.name} 的地址？`)) return
  try {
    await deleteAddress(a.id)
    toast.show('已删除', 'success')
    await load()
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>

<style scoped>
.addr-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}
.addr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.addr-header h1 {
  font-size: 28px;
  font-weight: 700;
}
.addr-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.addr-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
.addr-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.addr-name {
  font-weight: 600;
  font-size: 15px;
}
.addr-phone {
  color: var(--text-secondary);
  font-size: 14px;
}
.addr-default {
  font-size: 11px;
  background: var(--primary);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}
.addr-detail {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.addr-actions {
  display: flex;
  gap: 8px;
}
</style>
