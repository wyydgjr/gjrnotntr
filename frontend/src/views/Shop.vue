<template>
  <div class="shop-page">
    <!-- ===== 顶部轮播 Banner ===== -->
    <el-carousel v-if="banners.length" height="280px" class="banner" :interval="4500" arrow="always">
      <el-carousel-item v-for="(b, i) in banners" :key="i">
        <div class="banner-slide" :style="{ background: b.bg }">
          <div class="banner-inner">
            <h2 class="banner-title">{{ b.title }}</h2>
            <p class="banner-sub">{{ b.sub }}</p>
            <el-button type="primary" round size="large" @click="scrollToGoods">{{ b.action }}</el-button>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- ===== 搜索 + 购物车工具栏 ===== -->
    <div class="toolbar-card">
      <div class="search-box">
        <el-input
          v-model="query.keyword"
          placeholder="搜索商品名称 / 描述，如：键盘"
          clearable
          size="large"
          class="search-input"
          @keyup.enter="onSearch"
          @clear="onSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
          <template #append>
            <el-button type="primary" @click="onSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      <div class="sort-box">
        <span class="sort-label">排序</span>
        <el-select v-model="query.sort" size="large" class="sort-select" @change="onSortChange">
          <el-option v-for="s in sortOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </div>
      <div class="cart-entry">
        <el-badge :value="cartCount" :hidden="cartCount === 0" :max="99">
          <el-button type="warning" round size="large" @click="cartVisible = true">
            <el-icon class="mr4"><ShoppingCart /></el-icon>购物车
          </el-button>
        </el-badge>
      </div>
    </div>

    <!-- ===== 分类筛选栏 ===== -->
    <div class="category-bar">
      <span class="category-label">商品分类：</span>
      <el-tag
        v-for="c in categoryOptions"
        :key="c.category"
        :type="query.category === c.category ? 'primary' : 'info'"
        :effect="query.category === c.category ? 'dark' : 'plain'"
        class="category-tag"
        @click="selectCategory(c.category)"
      >
        {{ c.category }} <span class="cat-count">{{ c.count }}</span>
      </el-tag>
    </div>

    <!-- ===== 商品网格 ===== -->
    <div v-loading="loading" class="goods-area">
      <el-row :gutter="20">
        <el-col v-for="p in list" :key="p.id" :xs="24" :sm="12" :md="8" :lg="6" class="goods-col">
          <div class="goods-card" @mouseenter="p._hover = true" @mouseleave="p._hover = false">
            <div class="goods-img" :style="goodsImgStyle(p)" @click="goDetail(p)">
              <span v-if="!p.image_url" class="img-placeholder">{{ p.category?.charAt(0) || '商' }}</span>
              <img v-else :src="p.image_url" :alt="p.name" loading="lazy" />
              <span class="stock-badge" :class="stockClass(p)">库存 {{ p.stock }}</span>
              <span v-if="p.stock <= 5 && p.stock > 0" class="hot-badge">即将售罄</span>
              <span v-if="p.stock <= 0" class="soldout-badge">已售罄</span>
            </div>
            <div class="goods-body">
              <div class="goods-name" :title="p.name" @click="goDetail(p)">{{ p.name }}</div>
              <div class="goods-desc">{{ p.description || '暂无描述' }}</div>
              <div class="goods-meta">
                <el-tag size="small" type="info" effect="plain">{{ p.category }}</el-tag>
                <el-button link type="primary" size="small" @click="goDetail(p)">查看详情</el-button>
              </div>
              <div class="goods-bottom">
                <span class="goods-price">¥{{ Number(p.price).toFixed(2) }}</span>
                <div class="goods-actions">
                  <el-tooltip
                    :content="p.stock <= 0 ? '库存为 0，暂时无法购买' : '加入购物车后可继续挑选其他商品'"
                    placement="top"
                  >
                    <span class="tip-wrap">
                      <el-button
                        type="primary"
                        size="small"
                        round
                        :disabled="p.stock <= 0"
                        :icon="p._hover ? ShoppingCart : Plus"
                        @click="addToCart(p)"
                      >
                        {{ p.stock <= 0 ? '已售罄' : '加购' }}
                      </el-button>
                    </span>
                  </el-tooltip>
                  <el-tooltip
                    :content="p.stock <= 0 ? '库存为 0，暂时无法购买' : '跳过购物车，直接结算该商品'"
                    placement="top"
                  >
                    <span class="tip-wrap">
                      <el-button type="danger" size="small" round :disabled="p.stock <= 0" @click="buyNow(p)">
                        立即购买
                      </el-button>
                    </span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && list.length === 0" description="没有找到相关商品，换个关键词试试吧" />

      <div class="pager-wrap" v-if="pagination.total > 0">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.page"
          @current-change="onPageChange"
        />
      </div>
    </div>

    <!-- ===== 购物车抽屉 ===== -->
    <el-drawer v-model="cartVisible" title="我的购物车" size="480px" :with-header="true">
      <template #header>
        <div class="drawer-header">
          <el-icon class="mr4"><ShoppingCart /></el-icon>
          <span>我的购物车</span>
          <el-tag v-if="cart.length" type="warning" size="small" round>{{ cartCount }} 件</el-tag>
          <el-button v-if="cart.length" link type="danger" class="clear-btn" @click="clearCart">清空</el-button>
        </div>
      </template>

      <div v-if="cart.length === 0" class="cart-empty">
        <el-empty description="购物车还是空的，快去选购吧" />
      </div>

      <template v-else>
        <div class="cart-list">
          <div v-for="(it, idx) in cart" :key="it.id" class="cart-item">
            <div class="cart-item-img">
              <span v-if="!it.image_url">{{ it.category?.charAt(0) || '商' }}</span>
              <img v-else :src="it.image_url" :alt="it.name" />
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">{{ it.name }}</div>
              <div class="cart-item-price">¥{{ Number(it.price).toFixed(2) }}</div>
            </div>
            <div class="cart-item-op">
              <el-input-number
                :model-value="it.quantity"
                :min="1"
                :max="Math.max(it.stock, 1)"
                size="small"
                @change="(v) => cartStore.setQuantity(it.id, v)"
              />
              <div class="cart-item-subtotal">¥{{ (it.price * it.quantity).toFixed(2) }}</div>
            </div>
            <el-button link type="danger" :icon="Delete" @click="removeItem(it)" />
          </div>
        </div>

        <el-divider content-position="left">收货地址</el-divider>
        <div v-if="addressList.length" class="addr-picker">
          <el-radio-group v-model="selectedAddressId" class="addr-radio-group" @change="onAddressChange">
            <el-radio v-for="a in addressList" :key="a.id" :value="a.id" border class="addr-radio">
              <span class="addr-r-name">{{ a.receiver }}</span>
              <span class="addr-r-phone">{{ a.phone }}</span>
              <span class="addr-r-detail">{{ a.address }}</span>
              <el-tag v-if="a.is_default === 1" size="small" type="success" effect="plain">默认</el-tag>
            </el-radio>
          </el-radio-group>
          <div class="addr-links">
            <el-button link type="primary" :loading="addrLoading" @click="loadAddresses">刷新地址</el-button>
            <el-button link type="primary" @click="goAddressBook">管理地址簿</el-button>
          </div>
        </div>
        <el-alert
          v-else
          type="info"
          :closable="false"
          show-icon
          title="暂无收货地址"
          description="可先去「收货地址」页新增（新增后下单自动带入），也可在下方手动填写"
          class="addr-empty-alert"
        />

        <el-form :model="checkoutForm" label-position="top" size="large">
          <el-form-item label="收货人">
            <el-input v-model="checkoutForm.receiverName" placeholder="收货人姓名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="checkoutForm.receiverPhone" placeholder="手机号" :prefix-icon="Phone" />
          </el-form-item>
          <el-form-item label="收货地址">
            <el-input
              v-model="checkoutForm.receiverAddress"
              placeholder="省市区 + 详细地址"
              :prefix-icon="Location"
              type="textarea"
              :rows="2"
            />
          </el-form-item>
          <el-form-item label="订单备注（选填）">
            <el-input
              v-model="checkoutForm.remark"
              placeholder="如：工作日送达 / 送货前电话联系"
              type="textarea"
              :rows="2"
              maxlength="255"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div class="cart-footer">
          <div class="cart-total">
            合计：<span class="total-amount">¥{{ cartTotal }}</span>
          </div>
          <el-button type="primary" size="large" round :loading="submitting" @click="submitOrder">
            提交订单
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ShoppingCart, Search, Plus, Delete, User, Phone, Location } from '@element-plus/icons-vue';
import { productApi, orderApi, addressApi } from '../api';
import { useCartStore } from '../stores/cart';

const router = useRouter();
const route = useRoute();
const cartStore = useCartStore();

const loading = ref(false);
const list = ref([]);
const cartVisible = ref(false);
const submitting = ref(false);
// 购物车改为 Pinia store + localStorage 持久化（第二批改造），此处仅做只读引用
const cart = computed(() => cartStore.items);

const query = reactive({ keyword: '', category: '', page: 1, pageSize: 12, sort: 'newest' });
const pagination = reactive({ page: 1, pageSize: 12, total: 0 });

const checkoutForm = reactive({ receiverName: '', receiverPhone: '', receiverAddress: '', remark: '' });
const categoryOptions = ref([]);

// 收货地址簿（第二批新增）：默认地址自动带入结算表单
const addressList = ref([]);
const addrLoading = ref(false);
const selectedAddressId = ref(null);

// 商品列表排序：对应后端 sort 白名单参数
const sortOptions = [
  { label: '综合排序（最新上架）', value: 'newest' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
  { label: '库存从多到少', value: 'stock_desc' },
  { label: '库存从少到多', value: 'stock_asc' },
  { label: '销量从高到低', value: 'sales_desc' },
];

const banners = [
  { title: '精选好物 全场热卖', sub: '数码配件 · 生活家电 · 办公文具，一站式购齐', action: '立即选购', bg: 'linear-gradient(120deg, #1677ff 0%, #36cfc9 100%)' },
  { title: '新人专享 下单立减', sub: '注册即领优惠，优质商品低至 5 折起', action: '去逛逛', bg: 'linear-gradient(120deg, #722ed1 0%, #eb2f96 100%)' },
  { title: '极速发货 售后无忧', sub: '全场正品保障，7 天无理由退换', action: '开始购物', bg: 'linear-gradient(120deg, #fa8c16 0%, #f5222d 100%)' },
];

const cartCount = computed(() => cartStore.count);
const cartTotal = computed(() => cartStore.total.toFixed(2));

/** 排序切换：回到第一页重新查询 */
function onSortChange() {
  query.page = 1;
  loadList();
}

/** 跳转商品详情页 */
function goDetail(p) {
  router.push(`/product/${p.id}`);
}

/** 加载地址簿并把默认地址带入结算表单 */
async function loadAddresses() {
  addrLoading.value = true;
  try {
    addressList.value = await addressApi.list();
    if (addressList.value.length === 0) {
      selectedAddressId.value = null;
      return;
    }
    // 优先保留已选地址，其次取默认地址，最后取第一条
    const keep = addressList.value.find((a) => a.id === selectedAddressId.value);
    const target = keep || addressList.value.find((a) => a.is_default === 1) || addressList.value[0];
    selectedAddressId.value = target.id;
    applyAddress(target);
  } catch {
    addressList.value = [];
    selectedAddressId.value = null;
  } finally {
    addrLoading.value = false;
  }
}

function applyAddress(a) {
  if (!a) return;
  checkoutForm.receiverName = a.receiver;
  checkoutForm.receiverPhone = a.phone;
  checkoutForm.receiverAddress = a.address;
}

function onAddressChange(id) {
  const a = addressList.value.find((x) => x.id === id);
  applyAddress(a);
}

function goAddressBook() {
  cartVisible.value = false;
  router.push('/addresses');
}

/** 删除购物车单项（二次确认由 ElMessageBox 提供） */
async function removeItem(it) {
  try {
    await ElMessageBox.confirm(`确定从购物车移除「${it.name}」吗？`, '移除确认', {
      type: 'warning',
      confirmButtonText: '移除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  cartStore.remove(it.id);
  ElMessage.success('已从购物车移除');
}

/** 清空购物车 */
async function clearCart() {
  try {
    await ElMessageBox.confirm('确定清空购物车中的全部商品吗？', '清空确认', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  cartStore.clear();
  ElMessage.success('购物车已清空');
}

function stockClass(p) {
  if (p.stock <= 0) return 'danger';
  if (p.stock <= 10) return 'warn';
  return 'ok';
}

function goodsImgStyle(p) {
  if (p.image_url) return {};
  const palette = ['#e6f4ff', '#fff1f0', '#f6ffed', '#fffbe6', '#f9f0ff', '#e6fffb'];
  const idx = (p.id || 0) % palette.length;
  return { background: `linear-gradient(135deg, ${palette[idx]} 0%, #ffffff 100%)` };
}

function scrollToGoods() {
  document.querySelector('.goods-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadCategories() {
  try {
    categoryOptions.value = await productApi.categories();
  } catch {
    categoryOptions.value = [];
  }
}

function selectCategory(category) {
  query.category = query.category === category ? '' : category;
  query.page = 1;
  loadList();
}

async function onSearch() {
  query.page = 1;
  loadList();
}

async function loadList() {
  loading.value = true;
  try {
    const data = await productApi.list({ ...query });
    list.value = data.list || [];
    pagination.page = data.pagination.page;
    pagination.pageSize = data.pagination.pageSize;
    pagination.total = data.pagination.total;
  } catch {
    // 接口异常时清空列表，错误提示由请求拦截器统一弹出
    list.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function onPageChange(page) {
  query.page = page;
  loadList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addToCart(p) {
  const r = cartStore.add(p);
  if (r === 'soldout') {
    ElMessage.warning('该商品库存不足，暂时无法购买');
    return r;
  }
  if (r === 'limit') {
    ElMessage.warning('已达到库存上限');
    return r;
  }
  ElMessage.success(`已加入购物车：${p.name}`);
  return r;
}

/** 立即购买：直接加入购物车并打开结算抽屉 */
function buyNow(p) {
  if (p.stock <= 0) {
    ElMessage.warning('该商品库存不足，暂时无法购买');
    return;
  }
  addToCart(p);
  cartVisible.value = true;
}

async function submitOrder() {
  if (cart.value.length === 0) {
    ElMessage.warning('购物车为空，请先选择商品');
    return;
  }
  if (!checkoutForm.receiverName || !checkoutForm.receiverPhone || !checkoutForm.receiverAddress) {
    ElMessage.warning('请填写完整收货信息');
    return;
  }
  if (!/^1\d{10}$/.test(checkoutForm.receiverPhone.trim())) {
    ElMessage.warning('请输入 11 位手机号');
    return;
  }
  submitting.value = true;
  try {
    const data = await orderApi.create({
      items: cartStore.orderItems,
      // 传 addressId：后端校验归属后回填收货信息；同时保留手填字段兼容原逻辑
      addressId: selectedAddressId.value || undefined,
      receiverName: checkoutForm.receiverName,
      receiverPhone: checkoutForm.receiverPhone,
      receiverAddress: checkoutForm.receiverAddress,
      remark: checkoutForm.remark,
    });
    ElMessage.success(`下单成功，订单号：${data.orderNo}，请前往"我的订单"完成支付`);
    // 下单成功：清空已下单商品（购物车 store 同步清理 localStorage）
    cartStore.clear();
    cartVisible.value = false;
    checkoutForm.receiverName = '';
    checkoutForm.receiverPhone = '';
    checkoutForm.receiverAddress = '';
    checkoutForm.remark = '';
    loadList();
    // 下单后引导去支付，形成完整购买动线
    router.push('/my-orders');
  } catch {
    // 库存不足等业务错误提示由请求拦截器统一弹出，此处重新加载列表以同步最新库存
    loadList();
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadCategories();
  loadList();
  loadAddresses();
  // 详情页「立即购买」跳转过来时自动打开结算抽屉
  if (route.query.checkout === '1' && cartStore.items.length > 0) {
    cartVisible.value = true;
  }
});
</script>

<style scoped>
.shop-page {
  max-width: 1280px;
  margin: 0 auto;
}

/* 轮播 */
.banner {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.15);
}

.banner-slide {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-inner {
  text-align: center;
  color: #fff;
}

.banner-title {
  font-size: 34px;
  letter-spacing: 2px;
  margin-bottom: 10px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.banner-sub {
  font-size: 15px;
  opacity: 0.92;
  margin-bottom: 16px;
}

/* 工具栏 */
.toolbar-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
}

.search-input :deep(.el-input-group__append) {
  background: #1677ff;
  border-color: #1677ff;
  border-radius: 0 999px 999px 0;
  overflow: hidden;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 999px 0 0 999px;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1677ff inset;
}

/* 分类栏 */
.category-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  background: #fff;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.category-label {
  color: #666;
  font-weight: 600;
  margin-right: 4px;
}

.category-tag {
  cursor: pointer;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
  transition: all 0.25s;
}

.cat-count {
  opacity: 0.7;
  font-size: 12px;
}

/* 商品卡片 */
.goods-area {
  min-height: 260px;
}

.goods-col {
  margin-bottom: 20px;
}

.goods-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}

.goods-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
}

.goods-img {
  position: relative;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.goods-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.goods-card:hover .goods-img img {
  transform: scale(1.06);
}

.img-placeholder {
  font-size: 48px;
  color: #1677ff;
  font-weight: bold;
  opacity: 0.45;
}

.stock-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}

.stock-badge.ok { background: rgba(82, 196, 26, 0.85); }
.stock-badge.warn { background: rgba(250, 140, 22, 0.9); }
.stock-badge.danger { background: rgba(245, 34, 45, 0.85); }

.hot-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f5222d;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}

.soldout-badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 4px;
}

.goods-body {
  padding: 14px 16px 16px;
}

.goods-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-desc {
  color: #888;
  font-size: 13px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.goods-meta {
  margin-bottom: 10px;
}

.goods-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.goods-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 禁用按钮外层容器：保证悬停仍能触发提示 */
.tip-wrap {
  display: inline-flex;
  align-items: center;
}

.goods-actions :deep(.el-button.is-disabled),
.goods-actions :deep(.el-button.is-disabled:hover) {
  background: #f6f7fa !important;
  border-color: #e6e9ef !important;
  color: #bfc5d1 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.goods-price {
  color: #f5222d;
  font-size: 20px;
  font-weight: bold;
}

.pager-wrap {
  display: flex;
  justify-content: center;
  margin-top: 8px;
  padding: 12px 0 20px;
}

/* 抽屉 */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.cart-empty {
  padding: 40px 0;
}

.cart-list {
  max-height: 360px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
}

.cart-item-img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #1677ff;
  background: #e6f4ff;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
}

.cart-item-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cart-item-price {
  color: #f5222d;
  margin-top: 4px;
}

.cart-item-op {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.cart-item-subtotal {
  color: #f5222d;
  font-weight: 600;
  font-size: 13px;
}

.cart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.cart-total {
  font-size: 15px;
}

.total-amount {
  color: #f5222d;
  font-size: 24px;
  font-weight: bold;
}

.mr4 {
  margin-right: 4px;
}

/* ========== 轮播增强 ========== */
.banner-slide {
  position: relative;
  overflow: hidden;
}

.banner-slide::before,
.banner-slide::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  pointer-events: none;
}

.banner-slide::before {
  width: 320px;
  height: 320px;
  top: -120px;
  right: -80px;
}

.banner-slide::after {
  width: 220px;
  height: 220px;
  bottom: -120px;
  left: -60px;
  background: rgba(255, 255, 255, 0.1);
}

.banner-inner {
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s ease both;
}

.banner-title {
  font-weight: 800;
}

.banner .el-button--primary {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  animation: floatY 3.2s ease-in-out infinite;
}

/* ========== 工具栏/分类栏 ========== */
.toolbar-card,
.category-bar {
  position: relative;
  border: 1px solid #eef0f4;
}

.toolbar-card::before,
.category-bar::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  top: 0;
  height: 2px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(90deg, #1677ff, #36cfc9, transparent);
  opacity: 0.7;
}

.category-tag:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.18);
}

/* ========== 商品卡片微动效 ========== */
.goods-card {
  position: relative;
  border: 1px solid #f0f2f6;
  animation: fadeInUp 0.5s ease both;
}

.goods-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #1677ff, #36cfc9, #7b5cff);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s ease;
  z-index: 2;
}

.goods-card:hover::before {
  transform: scaleX(1);
}

.goods-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(15, 31, 77, 0.16);
}

.goods-col:nth-child(1) .goods-card { animation-delay: 0.02s; }
.goods-col:nth-child(2) .goods-card { animation-delay: 0.06s; }
.goods-col:nth-child(3) .goods-card { animation-delay: 0.10s; }
.goods-col:nth-child(4) .goods-card { animation-delay: 0.14s; }
.goods-col:nth-child(5) .goods-card { animation-delay: 0.18s; }
.goods-col:nth-child(6) .goods-card { animation-delay: 0.22s; }
.goods-col:nth-child(7) .goods-card { animation-delay: 0.26s; }
.goods-col:nth-child(8) .goods-card { animation-delay: 0.30s; }
.goods-col:nth-child(9) .goods-card { animation-delay: 0.34s; }
.goods-col:nth-child(10) .goods-card { animation-delay: 0.38s; }
.goods-col:nth-child(11) .goods-card { animation-delay: 0.42s; }
.goods-col:nth-child(12) .goods-card { animation-delay: 0.46s; }

.goods-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(15, 31, 77, 0.12) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.goods-card:hover .goods-img::after {
  opacity: 1;
}

.goods-price {
  font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
  letter-spacing: 0.3px;
}

.goods-price::first-letter {
  font-size: 14px;
}

.goods-card .el-button--primary {
  transition: all 0.2s ease;
}

.goods-card .el-button--primary:hover {
  transform: translateY(-2px) scale(1.04);
}

.goods-card .el-button--primary:active {
  transform: scale(0.96);
}

/* ========== 购物车抽屉 ========== */
.cart-item {
  transition: background 0.2s ease;
  border-radius: 10px;
  padding: 10px 8px;
}

.cart-item:hover {
  background: #f7faff;
}

.cart-item-img {
  box-shadow: 0 2px 6px rgba(22, 119, 255, 0.15);
}

.total-amount {
  font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
}

/* ========== 2026-11-04 · 商城页质感升级 ========== */

/* ---- Banner：光效扫过 + 层次 ---- */
.banner {
  border-radius: 16px;
  box-shadow: 0 10px 32px rgba(22, 119, 255, 0.22);
}

.banner-slide::before {
  width: 420px;
  height: 420px;
  top: -160px;
  right: -110px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.28), transparent 70%);
  animation: softFloat 6s ease-in-out infinite;
}

.banner-slide::after {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -80px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
  animation: softFloat 7s ease-in-out infinite reverse;
}

.banner-inner::after {
  content: '';
  position: absolute;
  top: -20px;
  bottom: -20px;
  width: 120px;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: translateX(-160%) skewX(-18deg);
  animation: shineSweep 5.5s ease-in-out infinite;
  pointer-events: none;
}

.banner-title {
  font-size: 38px;
  font-weight: 800;
}

/* ---- 工具栏 / 分类栏：玻璃质感 ---- */
.toolbar-card,
.category-bar {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(22, 119, 255, 0.08);
  box-shadow: 0 2px 6px rgba(15, 31, 77, 0.04), 0 12px 30px rgba(15, 31, 77, 0.07);
  border-radius: 14px;
}

.category-label {
  color: #5d6b82;
}

.category-tag {
  border: 1px solid rgba(22, 119, 255, 0.14);
  padding: 7px 14px;
}

/* ---- 商品卡：精致边框 + 光晕 ---- */
.goods-card {
  border: 1px solid rgba(22, 119, 255, 0.08);
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  box-shadow: 0 2px 6px rgba(15, 31, 77, 0.04), 0 10px 28px rgba(15, 31, 77, 0.06);
}

.goods-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 6px 14px rgba(15, 31, 77, 0.06), 0 24px 56px rgba(22, 119, 255, 0.16);
}

.goods-card::before {
  height: 4px;
  background: linear-gradient(90deg, #1677ff, #36cfc9, #7b5cff, #1677ff);
  background-size: 200% 100%;
}

.goods-card:hover::before {
  transform: scaleX(1);
  animation: gradientMove 1.2s linear infinite;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

.goods-img {
  border-radius: 16px 16px 0 0;
}

.goods-img::after {
  background: linear-gradient(180deg, transparent 40%, rgba(15, 31, 77, 0.22) 100%);
}

.goods-body {
  padding: 16px 18px 18px;
}

.goods-name {
  font-size: 16px;
}

.goods-price {
  font-size: 22px;
  background: linear-gradient(90deg, #f43f5e, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stock-badge {
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(15, 31, 77, 0.18);
}

/* ===== 第二批新增样式：排序下拉 / 购物车地址选择 / 可点击详情 ===== */
.sort-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.sort-label {
  font-size: 13px;
  color: #8c94a3;
  white-space: nowrap;
}

.sort-select {
  width: 180px;
}

.goods-img,
.goods-name {
  cursor: pointer;
}

.clear-btn {
  margin-left: auto;
}

.addr-picker {
  margin-bottom: 14px;
}

.addr-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.addr-radio {
  margin-right: 0 !important;
  height: auto;
  width: 100%;
  padding: 8px 12px;
  align-items: flex-start;
  white-space: normal;
}

.addr-radio :deep(.el-radio__label) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.addr-r-name {
  font-weight: 600;
  color: #1f2d3d;
}

.addr-r-phone {
  color: #5b6472;
}

.addr-r-detail {
  width: 100%;
  color: #8c94a3;
}

.addr-links {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}

.addr-empty-alert {
  margin-bottom: 12px;
}
</style>
