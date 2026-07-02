<template>
  <div class="wish-page">
    <h1 class="wish-title">我的收藏</h1>
    <div v-if="loading" class="wish-loading">加载中...</div>
    <div v-else-if="!items.length" class="wish-empty">
      <p>还没有收藏的商品</p>
      <router-link to="/products" class="btn btn-primary">去逛逛</router-link>
    </div>
    <div v-else class="product-grid">
      <div
        v-for="p in items"
        :key="p.id"
        class="product-card"
        @click="$router.push(`/product/${p.id}`)"
      >
        <div class="product-img">
          <img v-if="p.image" :src="p.image" :alt="p.name" class="product-real-img" />
          <span v-else class="product-placeholder">{{ p.name[0] }}</span>
          <button class="wish-remove" @click.stop="removeWish(p.id)">♥</button>
        </div>
        <div class="product-info">
          <span class="product-category">{{ p.category }}</span>
          <h3 class="product-name">{{ p.name }}</h3>
          <div class="product-bottom">
            <span class="product-price">¥{{ p.price.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWishlist, toggleWishlist } from '../../api/wishlist'
import { useToastStore } from '../../stores/toast'
import request from '../../api/request'

const toast = useToastStore()
const items = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const list = await getWishlist()
    const res = await request.get('/products')
    const all = res.list || res || []
    items.value = list.map((w) => all.find((p) => p.id === w.productId)).filter(Boolean)
  } catch {}
  loading.value = false
})

async function removeWish(id) {
  try {
    await toggleWishlist(id)
    items.value = items.value.filter((p) => p.id !== id)
    toast.show('已取消收藏', 'success')
  } catch {}
}
</script>

<style scoped>
.wish-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
.wish-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 32px;
}
.wish-loading,
.wish-empty {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
}
.wish-empty p {
  margin-bottom: 16px;
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
  transition: transform 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}
.product-img {
  height: 200px;
  background: linear-gradient(135deg, #ede9fe, #dbeafe);
  position: relative;
}
.product-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 48px;
  font-weight: 700;
  color: var(--primary);
  opacity: 0.4;
}
.wish-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  cursor: pointer;
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin: 8px 0 12px;
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
