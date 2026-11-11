<template>
  <div class="page-wrap">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="toolbar">
      <el-form inline @submit.prevent>
        <el-form-item label="订单状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 150px" @change="onFilterChange">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input
            v-model="query.orderNo"
            placeholder="输入订单号搜索"
            clearable
            style="width: 200px"
            :prefix-icon="Search"
            @keyup.enter="onFilterChange"
            @clear="onFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="onFilterChange">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item class="pull-right">
          <el-tag type="info" effect="plain" size="large">共 {{ pagination.total }} 笔订单</el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 我的订单表格 -->
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="订单号" width="190">
          <template #default="{ row }">
            <span class="order-no">{{ row.order_no }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="130">
          <template #default="{ row }">
            <span class="price">¥{{ Number(row.total_amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" :class="statusClass(row.status)" size="small" effect="dark" round>{{ statusText(row.status) }}</el-tag>
            <div v-if="row.status === 'pending'" class="remain-tip">{{ remainText(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="180" />
        <el-table-column label="操作" width="210" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="查看订单详情" placement="top">
              <el-button size="small" circle plain :icon="View" @click="showDetail(row)" />
            </el-tooltip>
            <el-tooltip
              :content="row.status === 'pending' ? '去支付' : '当前状态无需支付，仅待支付订单可支付'"
              placement="top"
            >
              <span class="tip-wrap">
                <el-button
                  size="small"
                  circle
                  type="primary"
                  plain
                  :icon="Wallet"
                  :disabled="row.status !== 'pending'"
                  @click="payOrder(row)"
                />
              </span>
            </el-tooltip>
            <el-tooltip
              :content="row.status === 'shipped' ? '确认收货' : '仅已发货订单可确认收货'"
              placement="top"
            >
              <span class="tip-wrap">
                <el-button
                  size="small"
                  circle
                  type="success"
                  plain
                  :icon="CircleCheck"
                  :disabled="row.status !== 'shipped'"
                  @click="confirmReceipt(row)"
                />
              </span>
            </el-tooltip>
            <el-tooltip
              :content="row.status === 'pending' ? '取消订单（库存自动回滚）' : '仅待支付订单可取消'"
              placement="top"
            >
              <span class="tip-wrap">
                <el-button
                  size="small"
                  circle
                  type="danger"
                  plain
                  :icon="CloseBold"
                  :disabled="row.status !== 'pending'"
                  @click="cancelOrder(row)"
                />
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="还没有相关订单，去商城逛逛吧" :image-size="90">
            <el-button type="primary" round @click="$router.push('/shop')">去逛逛</el-button>
          </el-empty>
        </template>
      </el-table>

      <el-pagination
        class="pager"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50]"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="620px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">
            <span class="order-no">{{ detail.order_no }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(detail.status)" :class="statusClass(detail.status)" size="small" effect="dark">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总金额">
            <span class="price">¥{{ Number(detail.total_amount).toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ detail.created_at }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ detail.receiver_name }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ detail.receiver_phone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ detail.receiver_address }}</el-descriptions-item>
          <el-descriptions-item label="物流信息" :span="2">
            <span v-if="detail.express_no" class="express-text">
              {{ detail.express_company || '快递' }} · {{ detail.express_no }}
            </span>
            <span v-else class="muted">未发货</span>
          </el-descriptions-item>
          <el-descriptions-item label="发货时间" :span="2">{{ detail.shipped_at || '—' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            <div class="remark-row">
              <span v-if="!remarkEditing" class="remark-text">{{ detail.remark || '无' }}</span>
              <el-input
                v-else
                v-model="remarkInput"
                type="textarea"
                :rows="2"
                maxlength="255"
                show-word-limit
                placeholder="填写订单备注"
              />
              <el-button v-if="!remarkEditing" link type="primary" @click="startEditRemark">编辑</el-button>
              <template v-else>
                <el-button link type="primary" :loading="remarkSaving" @click="saveRemark">保存</el-button>
                <el-button link @click="remarkEditing = false">取消</el-button>
              </template>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="items-title">商品明细</div>
        <el-table :data="detail.items" border size="small">
          <el-table-column prop="product_name" label="商品" min-width="180" show-overflow-tooltip />
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column prop="subtotal" label="小计" width="110">
            <template #default="{ row }">
              <span class="price">¥{{ Number(row.subtotal).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, View, CloseBold, Wallet, CircleCheck } from '@element-plus/icons-vue';
import { orderApi } from '../../api';

const loading = ref(false);
const list = ref([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref(null);

// ===== 待支付倒计时 =====
const nowTick = ref(Date.now());
const loadedAt = ref(Date.now());
let clockTimer = null;

// ===== 备注编辑 =====
const remarkEditing = ref(false);
const remarkSaving = ref(false);
const remarkInput = ref('');

const query = reactive({ status: '', orderNo: '', page: 1, pageSize: 10 });
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

const statusMap = {
  pending: ['待支付', 'warning', ''],
  paid: ['已支付', 'primary', ''],
  shipped: ['已发货', '', 'status-shipped'],
  completed: ['已完成', 'success', ''],
  cancelled: ['已取消', 'danger', ''],
};

function statusText(s) {
  return statusMap[s]?.[0] || s;
}
function statusTag(s) {
  return statusMap[s]?.[1] || 'info';
}
function statusClass(s) {
  return statusMap[s]?.[2] || '';
}

async function loadList() {
  loading.value = true;
  try {
    const params = { page: query.page, pageSize: query.pageSize };
    if (query.status) params.status = query.status;
    if (query.orderNo && query.orderNo.trim()) params.orderNo = query.orderNo.trim();
    const data = await orderApi.mine(params);
    list.value = data.list || [];
    loadedAt.value = Date.now();
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

function onFilterChange() {
  query.page = 1;
  loadList();
}

function resetQuery() {
  query.status = '';
  query.orderNo = '';
  query.page = 1;
  loadList();
}

function onPageChange(page) {
  query.page = page;
  loadList();
}

function onSizeChange(size) {
  query.pageSize = size;
  query.page = 1;
  loadList();
}

/** 支付订单：待支付 → 已支付 */
async function payOrder(row) {
  try {
    await ElMessageBox.confirm(
      `确认支付订单 ${row.order_no} 吗？应付金额 ¥${Number(row.total_amount).toFixed(2)}。`,
      '支付确认',
      { type: 'warning', confirmButtonText: '确认支付', cancelButtonText: '稍后支付' }
    );
  } catch {
    return; // 用户取消支付
  }
  try {
    await orderApi.pay(row.id);
    ElMessage.success('支付成功，等待商家发货');
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

/** 确认收货：已发货 → 已完成 */
async function confirmReceipt(row) {
  try {
    await ElMessageBox.confirm(`确认已收到订单 ${row.order_no} 的商品吗？`, '确认收货', {
      type: 'info',
      confirmButtonText: '确认收货',
      cancelButtonText: '再等等',
    });
  } catch {
    return;
  }
  try {
    await orderApi.confirm(row.id);
    ElMessage.success('已确认收货，订单完成');
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

async function cancelOrder(row) {
  try {
    await ElMessageBox.confirm(`确定取消订单 ${row.order_no} 吗？库存将自动回滚。`, '取消确认', {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
    });
  } catch {
    return; // 用户放弃取消
  }
  try {
    await orderApi.cancel(row.id);
    ElMessage.success('订单已取消，库存已回滚');
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

async function showDetail(row) {
  detailLoading.value = true;
  detailVisible.value = true;
  detail.value = null;
  remarkEditing.value = false;
  try {
    detail.value = await orderApi.detail(row.id);
    remarkInput.value = detail.value.remark || '';
  } catch {
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

/** 剩余支付时间文案（基于后端 pay_remain_seconds，按秒递减） */
function remainText(row) {
  if (row.status !== 'pending') return '';
  if (row.pay_remain_seconds === null || row.pay_remain_seconds === undefined) return '';
  const base = Number(row.pay_remain_seconds);
  if (!Number.isFinite(base)) return '';
  const elapsed = Math.floor((nowTick.value - loadedAt.value) / 1000);
  const left = base - elapsed;
  if (left <= 0) return '即将自动取消';
  const m = Math.floor(left / 60);
  const s = left % 60;
  if (m >= 1) return `剩 ${m} 分 ${String(s).padStart(2, '0')} 秒`;
  return `剩 ${s} 秒`;
}

function startEditRemark() {
  remarkInput.value = detail.value?.remark || '';
  remarkEditing.value = true;
}

async function saveRemark() {
  if (!detail.value) return;
  remarkSaving.value = true;
  try {
    const data = await orderApi.updateRemark(detail.value.id, remarkInput.value);
    detail.value.remark = data.remark;
    remarkEditing.value = false;
    ElMessage.success(data.remark ? '备注已保存' : '备注已清空');
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    remarkSaving.value = false;
  }
}

onMounted(() => {
  loadList();
  clockTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = null;
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  border-radius: 10px;
}

.toolbar :deep(.el-form-item) {
  margin-bottom: 0;
}

.pull-right {
  margin-left: auto;
}

.pager {
  margin-top: 14px;
  justify-content: flex-end;
}

.order-no {
  font-family: Consolas, monospace;
  font-size: 13px;
}

.price {
  color: #f5222d;
  font-weight: 600;
}

.items-title {
  font-weight: 600;
  margin: 16px 0 10px;
  padding-left: 8px;
  border-left: 3px solid #1677ff;
}

/* ========== 待支付倒计时 / 物流 / 备注 ========== */
.remain-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #e6a23c;
  font-variant-numeric: tabular-nums;
}

.express-text {
  color: #1677ff;
  font-family: Consolas, monospace;
}

.remark-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.remark-text {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}

.muted {
  color: #a8abb2;
}

/* ========== 管理页细节 ========== */
.toolbar {
  border: 1px solid #eef0f4;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  transition: box-shadow 0.25s ease;
}

.toolbar::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, #1677ff, #36cfc9, transparent);
}

.toolbar:hover {
  box-shadow: 0 6px 18px rgba(15, 31, 77, 0.08);
}

.el-card {
  border-radius: 12px;
  border-color: #eef0f4;
}

.order-no {
  color: #1677ff;
}

.price {
  font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
}

/* 操作按钮微动效 */
.el-button.is-circle {
  transition: all 0.2s ease;
}

/* 禁用按钮外层容器：保证禁用态悬停仍能显示原因提示 */
.tip-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}


.el-button.is-circle:hover {
  transform: translateY(-2px) scale(1.08);
}

.el-button.is-circle:active {
  transform: scale(0.95);
}

/* ===== 状态徽章体系：已发货 = 青色 ===== */
.status-shipped.el-tag--dark {
  background: #13c2c2;
  border-color: #13c2c2;
  color: #fff;
}

/* ===== 渐变表头 + 行 hover ===== */
:deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(135deg, #f0f4ff 0%, #f7f9ff 100%);
  color: #4a5468;
  font-weight: 600;
}

:deep(.el-table .el-table__row) {
  transition: background 0.2s ease;
}

:deep(.el-table .el-table__row:hover > td.el-table__cell) {
  background: #f5f8ff;
}

/* ========== 2026-11-04 · 我的订单质感升级 ========== */

.toolbar {
  background: linear-gradient(180deg, #ffffff, #f8faff);
  border: 1px solid rgba(22, 119, 255, 0.09);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 10px 30px rgba(15, 31, 77, 0.06);
}

.toolbar::before {
  height: 3px;
  background: linear-gradient(90deg, #1677ff, #36cfc9 60%, #7b5cff);
}

.page-wrap .el-card:not(.toolbar) {
  border-radius: 14px;
  border: 1px solid rgba(22, 119, 255, 0.09);
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 10px 30px rgba(15, 31, 77, 0.06);
}

:deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f8faff 0%, #edf2fb 100%);
  letter-spacing: 0.4px;
}

:deep(.el-table .el-table__row:hover > td.el-table__cell) {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.06), rgba(124, 92, 255, 0.03)) !important;
}

.order-no {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.price {
  font-size: 15px;
  background: linear-gradient(90deg, #f43f5e, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-shipped.el-tag--dark {
  background: linear-gradient(135deg, #0ea5e9, #22d3ee) !important;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);
}

/* ===== 操作列禁用态：强制灰底灰字，明确表达"当前状态不可操作" ===== */
:deep(.el-button.is-circle.is-disabled),
:deep(.el-button.is-circle.is-disabled:hover),
:deep(.el-button.is-circle.is-disabled:active) {
  background: #f6f7fa !important;
  border-color: #e6e9ef !important;
  color: #bfc5d1 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
}

.detail-body {
  min-height: 120px;
}
</style>
