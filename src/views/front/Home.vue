<template>
  <div>
    <section class="hero" :style="bannerStyle">
      <div class="hero-content">
        <h1>{{ currentBanner?.title || $t('footer.slogan') }}</h1>
        <p>{{ currentBanner?.subtitle || '' }}</p>
        <router-link :to="currentBanner?.link || '/products'" class="btn btn-primary hero-btn">{{
          $t('product.buyNow')
        }}</router-link>
      </div>
      <div class="banner-dots">
        <span
          v-for="(b, i) in banners"
          :key="i"
          class="banner-dot"
          :class="{ active: i === bannerIdx }"
          @click="bannerIdx = i"
        ></span>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>{{ $t('home.featured') }}</h2>
        <router-link to="/products" class="more-link">{{ $t('home.viewAll') }} →</router-link>
      </div>
      <div v-if="loading" class="loading-grid">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
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
            <div class="product-bottom">
              <span class="product-price">¥{{ p.price.toLocaleString() }}</span>
              <button class="btn btn-sm btn-primary" @click.stop="addToCart(p)">
                {{ $t('product.addToCart') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section features">
      <div class="feature-grid">
        <div class="feature-item">
          <span class="feature-icon">🚚</span>
          <h4>{{ $t('home.freeShipping') }}</h4>
          <p>{{ $t('home.freeShippingDesc') }}</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔒</span>
          <h4>{{ $t('home.securePayment') }}</h4>
          <p>{{ $t('home.securePaymentDesc') }}</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">↩️</span>
          <h4>{{ $t('home.sevenDayReturn') }}</h4>
          <p>{{ $t('home.sevenDayReturnDesc') }}</p>
        </div>
        <div class="feature-item">
          <span class="feature-icon">💬</span>
          <h4>{{ $t('home.onlineSupport') }}</h4>
          <p>{{ $t('home.onlineSupportDesc') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useToastStore } from '../../stores/toast'
import { createResourceApi } from '../../api/resource'
import logger from '../../utils/logger'

const $router = useRouter()
const cart = useCartStore()
const toast = useToastStore()

const products = ref([])
const loading = ref(true)
const banners = ref([])
const bannerIdx = ref(0)
let bannerTimer = null

const currentBanner = computed(() => banners.value[bannerIdx.value] || null)
const bannerStyle = computed(() => {
  const b = currentBanner.value
  if (b?.image)
    return {
      backgroundImage: `url(${b.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  return {}
})

onMounted(async () => {
  try {
    const res = await createResourceApi('/products').list({ page: 1, pageSize: 8 })
    products.value = (res.list || res || []).slice(0, 8)
  } catch (e) {
    logger.error('Home load failed:', e)
  }
  loading.value = false
  try {
    const catRes = await createResourceApi('/banners').list({ page: 1, pageSize: 10 })
    banners.value = (catRes.list || catRes || []).sort((a, b) => (a.sort || 0) - (b.sort || 0))
    if (banners.value.length > 1) {
      bannerTimer = setInterval(() => {
        bannerIdx.value = (bannerIdx.value + 1) % banners.value.length
      }, 4000)
    }
  } catch {}
})

onUnmounted(() => {
  clearInterval(bannerTimer)
})

function addToCart(p) {
  cart.add(p)
  toast.show(`「${p.name}」已加入购物车`, 'success')
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 24px 50px;
  text-align: center;
  color: #fff;
  position: relative;
}
.hero-content {
  max-width: 600px;
  margin: 0 auto;
}
.hero h1 {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;
}
.hero p {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 28px;
  line-height: 1.6;
}
.hero-btn {
  font-size: 16px;
  padding: 12px 36px;
  background: #fff;
  color: #4f46e5;
  border: none;
}
.hero-btn:hover {
  background: #f1f5f9;
}
.banner-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}
.banner-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
}
.banner-dot.active {
  background: #fff;
  width: 24px;
  border-radius: 5px;
}

.section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-header h2 {
  font-size: 24px;
  font-weight: 700;
}
.more-link {
  color: var(--primary);
  font-size: 14px;
  text-decoration: none;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.skeleton-card {
  height: 340px;
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
  margin-bottom: 10px;
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

.features {
  padding-top: 0;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}
.feature-item {
  text-align: center;
  padding: 32px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.feature-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 12px;
}
.feature-item h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}
.feature-item p {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
