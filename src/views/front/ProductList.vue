<template>
  <div class="plist-page">
    <div class="plist-header">
      <h1>{{ keyword ? '搜索: ' + keyword : '全部商品' }}</h1>
      <p class="plist-count">{{ keyword ? '搜索结果' : '' }} 共 {{ total }} 件商品</p>
    </div>

    <div class="plist-toolbar">
      <div class="filter-tabs">
        <button
          v-for="c in categories"
          :key="c.id"
          class="filter-tab"
          :class="{ active: activeCategory === c.id }"
          @click="activeCategory = c.id; load()"
        >
          {{ c.name }}
        </button>
        <button
          class="filter-tab"
          :class="{ active: activeCategory === 0 }"
          @click="activeCategory = 0; load()"
        >
          全部
        </button>
      </div>
      <div class="sort-group">
        <button
          class="btn btn-sm"
          :class="{ 'btn-primary': sort === 'default' }"
          @click="sort = 'default'; load()"
        >
          默认
        </button>
        <button
          class="btn btn-sm"
          :class="{ 'btn-primary': sort === 'price' }"
          @click="sort = 'price'; load()"
        >
          价格
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-grid">
      <div v-for="n in 8" :key="n" class="skeleton-card"></div>
    </div>
    <div v-else-if="!products.length" class="empty-state">
      <p>暂无商品</p>
    </div>
    <div v-else class="product-grid">
      <div
        v-for="p in products"
        :key="p.id"
        class="product-card"
        @click="$router.push(`/product/${p.id}`)"
      >
        <div class="product-img">
          <img v-if="p.image" :src="p.image" :alt="p.name" class="product-real-img" />
          <span v-else class="product-placeholder">{{ p.name[0] }}</span>
        </div>
        <div class="product-info">
          <span class="product-category">{{ p.category }}</span>
          <h3 class="product-name">{{ p.name }}</h3>
          <p class="product-desc">{{ p.description }}</p>
          <div class="product-meta">
            <span>库存: {{ p.stock }}</span>
          </div>
          <div class="product-bottom">
            <span class="product-price">¥{{ p.price.toLocaleString() }}</span>
            <button class="btn btn-sm btn-primary" @click.stop="addToCart(p)">加入购物车</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useToastStore } from '../../stores/toast'
import { createResourceApi } from '../../api/resource'
import logger from '../../utils/logger'

const route = useRoute()
const cart = useCartStore()
const toast = useToastStore()

const products = ref([])
const categories = ref([])
const loading = ref(true)
const total = ref(0)
const activeCategory = ref(0)
const sort = ref('default')
const keyword = ref(route.query.search || '')

async function load() {
  loading.value = true
  try {
    const params = { page: 1, pageSize: 50 }
    if (keyword.value) params.keyword = keyword.value
    if (activeCategory.value > 0) {
      const cat = categories.value.find((c) => c.id === activeCategory.value)
      if (cat) params.category = cat.name
    }
    const res = await createResourceApi('/products').list(params)
    let list = res.list || res || []
    if (sort.value === 'price') {
      list = [...list].sort((a, b) => a.price - b.price)
    }
    products.value = list
    total.value = res.total || list.length
  } catch (e) {
    logger.error('Failed to load products:', e)
  }
  loading.value = false
}

onMounted(async () => {
  try {
    const catRes = await createResourceApi('/categories').list({ page: 1, pageSize: 50 })
    categories.value = catRes.list || catRes || []
  } catch {}
  await load()
})

function addToCart(p) {
  cart.add(p)
  toast.show(`「${p.name}」已加入购物车`, 'success')
}
</script>

<style scoped>
.plist-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
.plist-header {
  margin-bottom: 24px;
}
.plist-header h1 {
  font-size: 28px;
  font-weight: 700;
}
.plist-count {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.plist-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-tab {
  padding: 6px 16px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}
.filter-tab:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.filter-tab.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.sort-group {
  display: flex;
  gap: 6px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.skeleton-card {
  height: 380px;
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.product-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
.product-img {
  height: 200px;
  background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-placeholder {
  font-size: 48px;
  font-weight: 700;
  color: var(--primary);
  opacity: 0.4;
}
.product-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-info {
  padding: 16px;
}
.product-category {
  font-size: 12px;
  color: var(--primary);
  background: #ede9fe;
  padding: 2px 8px;
  border-radius: 4px;
}
.product-name {
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0 6px;
}
.product-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.product-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.product-price {
  font-size: 20px;
  font-weight: 700;
  color: var(--danger);
}
</style>
