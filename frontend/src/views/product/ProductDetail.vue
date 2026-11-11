<template>
  <div v-loading="loading" class="detail-page">
    <div class="back-bar">
      <el-button link :icon="ArrowLeft" @click="goBack">返回商品列表</el-button>
    </div>

    <el-empty v-if="!loading && notFound" description="商品不存在或已下架">
      <el-button type="primary" @click="goBack">返回商城</el-button>
    </el-empty>

    <div v-else-if="product" class="detail-card">
      <!-- 左：主图 / 轮播 -->
      <div class="gallery">
        <el-carousel v-if="slides.length > 1" height="380px" :interval="5000" indicator-position="outside">
          <el-carousel-item v-for="(s, i) in slides" :key="i">
            <div class="slide" :style="s.style">
              <img v-if="s.url" :src="s.url" :alt="product.name" />
              <span v-else class="slide-ph">{{ product.category?.charAt(0) || '商' }}</span>
            </div>
          </el-carousel-item>
        </el-carousel>
        <div v-else class="slide" :style="slides[0]?.style || {}">
          <img v-if="slides[0]?.url" :src="slides[0].url" :alt="product.name" />
          <span v-else class="slide-ph">{{ product.category?.charAt(0) || '商' }}</span>
        </div>

        <div v-if="slides.length > 1" class="thumbs">
          <div
            v-for="(s, i) in slides"
            :key="i"
            class="thumb"
            :style="s.style"
            :class="{ active: i === 0 }"
          >
            <img v-if="s.url" :src="s.url" :alt="product.name" />
            <span v-else>{{ product.category?.charAt(0) || '商' }}</span>
          </div>
        </div>
      </div>

      <!-- 右：商品信息 -->
      <div class="info">
        <h1 class="p-name">{{ product.name }}</h1>
        <div class="p-tags">
          <el-tag size="small" type="info" effect="plain">{{ product.category }}</el-tag>
          <el-tag size="small" :type="product.status === 'on' ? 'success' : 'danger'" effect="plain">
            {{ product.status === 'on' ? '在售' : '已下架' }}
          </el-tag>
        </div>

        <div class="price-box">
          <span class="price-label">价格</span>
          <span class="price">¥{{ Number(product.price).toFixed(2) }}</span>
        </div>

        <div class="meta-list">
          <div class="meta-row">
            <span class="meta-k">库存</span>
            <span class="meta-v" :class="stockClass">
              {{ product.stock }}
              <em v-if="product.stock <= 0" class="stock-tip danger">（已售罄）</em>
              <em v-else-if="product.stock <= 5" class="stock-tip warn">（即将售罄）</em>
              <em v-else-if="product.stock <= 10" class="stock-tip warn">（库存紧张）</em>
            </span>
          </div>
          <div class="meta-row">
            <span class="meta-k">分类</span>
            <span class="meta-v">{{ product.category }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-k">商品编号</span>
            <span class="meta-v">#{{ product.id }}</span>
          </div>
          <div class="meta-row" v-if="product.created_at">
            <span class="meta-k">上架时间</span>
            <span class="meta-v">{{ product.created_at }}</span>
          </div>
        </div>

        <div class="buy-row">
          <span class="buy-label">数量</span>
          <el-input-number v-model="quantity" :min="1" :max="Math.max(product.stock, 1)" :disabled="product.stock <= 0" />
          <span class="buy-total">小计：¥{{ (Number(product.price) * quantity).toFixed(2) }}</span>
        </div>

        <div class="action-row">
          <el-button
            type="primary"
            size="large"
            round
            :icon="ShoppingCart"
            :disabled="product.stock <= 0"
            :loading="adding"
            @click="addToCart"
          >
            {{ product.stock <= 0 ? '已售罄' : '加入购物车' }}
          </el-button>
          <el-button type="danger" size="large" round :disabled="product.stock <= 0" @click="buyNow">
            立即购买
          </el-button>
        </div>

        <el-divider content-position="left">商品描述</el-divider>
        <div class="desc">{{ product.description || '暂无商品描述' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, ShoppingCart } from '@element-plus/icons-vue';
import { productApi } from '../../api';
import { useCartStore } from '../../stores/cart';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();

const loading = ref(false);
const adding = ref(false);
const notFound = ref(false);
const product = ref(null);
const quantity = ref(1);

const PALETTE = ['#e6f4ff', '#fff1f0', '#f6ffed', '#fffbe6', '#f9f0ff', '#e6fffb'];

/** 轮播数据：有图用真图；无图用渐变色占位（主图 + 2 张角度占位，避免空白页） */
const slides = computed(() => {
  if (!product.value) return [];
  const idx = (product.value.id || 0) % PALETTE.length;
  if (product.value.image_url) {
    return [{ url: product.value.image_url, style: {} }];
  }
  return [
    { url: null, style: { background: `linear-gradient(135deg, ${PALETTE[idx]} 0%, #ffffff 100%)` } },
    { url: null, style: { background: `linear-gradient(135deg, ${PALETTE[(idx + 2) % 6]} 0%, #ffffff 100%)` } },
    { url: null, style: { background: `linear-gradient(135deg, ${PALETTE[(idx + 4) % 6]} 0%, #ffffff 100%)` } },
  ];
});

const stockClass = computed(() => {
  const s = product.value?.stock ?? 0;
  if (s <= 0) return 'danger';
  if (s <= 10) return 'warn';
  return 'ok';
});

async function loadDetail() {
  const id = Number(route.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    notFound.value = true;
    return;
  }
  loading.value = true;
  notFound.value = false;
  try {
    // 真实调用 GET /api/products/:id
    product.value = await productApi.detail(id);
    quantity.value = 1;
  } catch {
    product.value = null;
    notFound.value = true;
  } finally {
    loading.value = false;
  }
}

function addToCart() {
  if (!product.value) return;
  adding.value = true;
  try {
    for (let i = 0; i < quantity.value; i += 1) {
      const r = cartStore.add(product.value);
      if (r === 'limit') {
        ElMessage.warning('已达到库存上限');
        break;
      }
      if (r === 'soldout') {
        ElMessage.warning('该商品库存不足');
        break;
      }
    }
    ElMessage.success(`已加入购物车：${product.value.name} × ${quantity.value}`);
  } finally {
    adding.value = false;
  }
}

/** 立即购买：加购后跳商城并自动打开结算抽屉 */
function buyNow() {
  if (!product.value) return;
  addToCart();
  router.push({ path: '/shop', query: { checkout: '1' } });
}

function goBack() {
  router.push('/shop');
}

// 支持同一路由切换不同商品 id（详情页内点相关推荐等场景）
watch(() => route.params.id, loadDetail, { immediate: true });
</script>

<style scoped>
.detail-page {
  max-width: 1180px;
  min-height: 420px;
}

.back-bar {
  margin-bottom: 12px;
}

.detail-card {
  display: flex;
  gap: 32px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.06);
}

.gallery {
  width: 440px;
  flex: 0 0 440px;
}

.slide {
  height: 380px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f7f9fc;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.slide-ph {
  font-size: 96px;
  font-weight: 700;
  color: rgba(22, 119, 255, 0.25);
}

.thumbs {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  color: rgba(22, 119, 255, 0.35);
  font-weight: 600;
}

.thumb.active {
  border-color: #1677ff;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.p-name {
  margin: 0 0 10px;
  font-size: 24px;
  color: #1f2d3d;
  line-height: 1.4;
}

.p-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.price-box {
  background: linear-gradient(90deg, #fff5f2 0%, #ffffff 90%);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.price-label {
  font-size: 13px;
  color: #8c94a3;
  margin-right: 12px;
}

.price {
  font-size: 30px;
  font-weight: 700;
  color: #f5222d;
}

.meta-list {
  margin-bottom: 18px;
}

.meta-row {
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 7px 0;
  border-bottom: 1px dashed #f0f2f5;
}

.meta-k {
  width: 90px;
  color: #8c94a3;
}

.meta-v {
  color: #1f2d3d;
}

.meta-v.danger {
  color: #f5222d;
}

.meta-v.warn {
  color: #e6a23c;
}

.stock-tip {
  font-style: normal;
  font-size: 12px;
}

.buy-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.buy-label {
  font-size: 14px;
  color: #8c94a3;
}

.buy-total {
  font-size: 14px;
  color: #5b6472;
}

.action-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.desc {
  font-size: 14px;
  line-height: 1.9;
  color: #4b5563;
  white-space: pre-wrap;
}

@media (max-width: 960px) {
  .detail-card {
    flex-direction: column;
  }

  .gallery {
    width: 100%;
    flex: none;
  }
}
</style>
