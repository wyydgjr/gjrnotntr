<template>
  <div class="detail-page">
    <div v-if="loading" class="detail-loading">加载中...</div>
    <div v-else-if="!product" class="empty-state"><p>商品不存在</p></div>
    <div v-else class="detail-content">
      <div class="detail-gallery">
        <div class="detail-img">
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            class="detail-real-img"
          />
          <span v-else class="detail-placeholder">{{ product.name[0] }}</span>
        </div>
      </div>
      <div class="detail-meta">
        <span class="detail-category">{{ product.category }}</span>
        <h1 class="detail-name">{{ product.name }}</h1>
        <div class="detail-price">¥{{ product.price.toLocaleString() }}</div>
        <div class="detail-desc">{{ product.description }}</div>
        <div v-if="product.specs" class="detail-specs">
          <div v-for="(opts, name) in product.specs" :key="name" class="spec-row">
            <span class="spec-label">{{ name }}:</span>
            <div class="spec-opts">
              <span
                v-for="o in opts"
                :key="o"
                class="spec-opt"
                :class="{ active: selectedSpecs[name] === o }"
                @click="selectedSpecs[name] = o"
                >{{ o }}</span
              >
            </div>
          </div>
        </div>
        <div class="detail-stock">
          库存:
          <span :class="product.stock > 0 ? 'in-stock' : 'out-of-stock'">
            {{ product.stock > 0 ? product.stock + ' 件' : '暂时缺货' }}
          </span>
        </div>
        <div class="detail-actions">
          <div class="qty-selector">
            <button class="qty-btn" @click="qty > 1 && qty--" :disabled="qty <= 1">−</button>
            <span class="qty-value">{{ qty }}</span>
            <button
              class="qty-btn"
              @click="qty++"
              :disabled="qty >= product.stock && product.stock > 0"
            >
              +
            </button>
          </div>
          <button
            class="btn btn-primary add-cart-btn"
            :disabled="product.stock <= 0"
            @click="addToCart"
          >
            {{ product.stock > 0 ? '加入购物车' : '暂时缺货' }}
          </button>
          <button class="btn wish-btn" :class="{ wishActive: wishlisted }" @click="toggleWish">
            {{ wishlisted ? '♥ 已收藏' : '♡ 收藏' }}
          </button>
        </div>
      </div>
    </div>
    <div class="detail-reviews">
      <h3>商品评价（{{ reviews.length }}）</h3>
      <div v-if="!reviews.length" class="empty-state" style="padding: 32px 0"><p>暂无评价</p></div>
      <div v-for="r in reviews" :key="r.id" class="review-item">
        <div class="review-user">{{ r.username }}</div>
        <div class="review-stars">
          {{ '★'.repeat(r.rating || 5) }}{{ '☆'.repeat(5 - (r.rating || 5)) }}
        </div>
        <div class="review-content">{{ r.content }}</div>
        <div class="review-time">{{ r.createdAt }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useToastStore } from '../../stores/toast'
import { useAuthStore } from '../../stores/auth'
import { createResourceApi } from '../../api/resource'
import { toggleWishlist, getWishlist } from '../../api/wishlist'
import { getProductReviews } from '../../api/review'

const route = useRoute()
const $router = useRouter()
const cart = useCartStore()
const toast = useToastStore()
const auth = useAuthStore()

const product = ref(null)
const loading = ref(true)
const qty = ref(1)
const wishlisted = ref(false)
const reviews = ref([])
const selectedSpecs = ref({})

onMounted(async () => {
  try {
    const res = await createResourceApi('/products').get(route.params.id)
    product.value = res
    if (res.specs) {
      const init = {}
      for (const key of Object.keys(res.specs)) init[key] = res.specs[key][0]
      selectedSpecs.value = init
    }
    loadReviews()
    if (auth.isLoggedIn) checkWishlist()
  } catch (e) {
    logger.error('Product detail load failed:', e)
  }
  loading.value = false
})

async function loadReviews() {
  try {
    reviews.value = await getProductReviews(route.params.id)
  } catch {}
}

async function checkWishlist() {
  try {
    const list = await getWishlist()
    wishlisted.value = list.some((w) => w.productId === Number(route.params.id))
  } catch {}
}

async function toggleWish() {
  if (!auth.isLoggedIn) return $router.push('/login')
  try {
    const res = await toggleWishlist(product.value.id)
    wishlisted.value = res.wishlisted
    toast.show(res.wishlisted ? '已收藏' : '已取消收藏', 'success')
  } catch {}
}

function addToCart() {
  if (!product.value || product.value.stock <= 0) return
  cart.add(product.value, qty.value)
  toast.show(`已添加 ${qty.value} 件「${product.value.name}」到购物车`, 'success')
  qty.value = 1
}
</script>

<style scoped>
.detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}
.detail-loading {
  text-align: center;
  padding: 80px 0;
  color: var(--text-secondary);
}
.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}
@media (max-width: 768px) {
  .detail-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.detail-gallery {
}
.detail-img {
  height: 400px;
  background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-placeholder {
  font-size: 80px;
  font-weight: 700;
  color: var(--primary);
  opacity: 0.3;
}
.detail-real-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.8;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.detail-category {
  align-self: flex-start;
  font-size: 13px;
  color: var(--primary);
  background: #ede9fe;
  padding: 4px 12px;
  border-radius: 4px;
}
.detail-name {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
}
.detail-price {
  font-size: 32px;
  font-weight: 700;
  color: var(--danger);
}
.detail-stock {
  font-size: 14px;
  color: var(--text-secondary);
}
.detail-specs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.spec-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.spec-label {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 48px;
}
.spec-opts {
  display: flex;
  gap: 8px;
}
.spec-opt {
  padding: 4px 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.spec-opt:hover {
  border-color: var(--primary);
}
.spec-opt.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.in-stock {
  color: var(--success);
  font-weight: 600;
}
.out-of-stock {
  color: var(--danger);
  font-weight: 600;
}
.detail-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}
.qty-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.qty-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg);
  font-size: 18px;
  cursor: pointer;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.qty-btn:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}
.qty-value {
  width: 48px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}
.add-cart-btn {
  padding: 10px 32px;
  font-size: 15px;
}
.add-cart-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.wish-btn {
  padding: 10px 20px;
  font-size: 15px;
}
.wishActive {
  color: var(--danger);
  border-color: var(--danger);
}
.detail-reviews {
  margin-top: 48px;
  border-top: 1px solid var(--border);
  padding-top: 32px;
}
.detail-reviews h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}
.review-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.review-user {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}
.review-stars {
  color: #f59e0b;
  font-size: 14px;
  margin-bottom: 6px;
}
.review-content {
  font-size: 14px;
  line-height: 1.6;
}
.review-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}
</style>
