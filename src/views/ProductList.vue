<template>
  <div>
    <div class="page-header">
      <h2>产品管理</h2>
      <router-link to="/products/new" class="btn btn-primary">新增产品</router-link>
    </div>

    <div style="margin-bottom: 16px;">
      <SearchBar placeholder="搜索产品名称或分类..." @search="handleSearch" />
    </div>

    <DataTable
      :columns="columns"
      :items="store.list"
      :loading="store.loading"
      empty-text="暂无产品数据"
    >
      <template #actions="{ row }">
        <router-link :to="`/products/${row.id}/edit`" class="btn btn-sm">编辑</router-link>
        <button class="btn btn-sm btn-danger" @click="handleDelete(row)">删除</button>
      </template>
    </DataTable>

    <Pagination
      v-if="store.total > pageSize"
      :total="store.total"
      v-model="page"
      :page-size="pageSize"
      @change="loadData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useResourceStore } from '../stores/resource'
import { useToastStore } from '../stores/toast'
import DataTable from '../components/DataTable.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'

const store = useResourceStore('products', '/products')
const toast = useToastStore()
const page = ref(1)
const pageSize = 20

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '产品名称' },
  { key: 'category', label: '分类' },
  { key: 'price', label: '价格', render: (r) => `¥${r.price}` },
  { key: 'stock', label: '库存' },
  { key: 'status', label: '状态', render: (r) => r.status === 'active' ? '<span class="badge badge-active">上架</span>' : '<span class="badge badge-inactive">下架</span>' },
  { key: 'createdAt', label: '创建时间' },
]

onMounted(() => store.fetchList())

watch(page, () => loadData())

function loadData() {
  store.fetchList({ page: page.value, pageSize })
}

function handleSearch(keyword) {
  page.value = 1
  store.fetchList({ keyword, page: 1, pageSize })
}

async function handleDelete(row) {
  if (!confirm(`确认删除产品「${row.name}」？`)) return
  try {
    await store.remove(row.id)
    toast.show('产品已删除', 'success')
  } catch {
    toast.show('删除失败', 'error')
  }
}
</script>
