<template>
  <div class="page-wrap">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="toolbar">
      <el-form inline @submit.prevent>
        <el-form-item label="订单状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 160px" @change="loadList">
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="搜索订单号" clearable style="width: 200px" :prefix-icon="Search" @keyup.enter="loadList" @clear="loadList" />
        </el-form-item>
        <el-form-item label="查看已归档">
          <el-switch v-model="query.archived" active-text="已归档" @change="onArchivedChange" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          <el-tooltip content="立即扫描并自动取消超过 30 分钟未支付的订单（定时任务的手动版）" placement="bottom">
            <el-button type="warning" plain :icon="Timer" :loading="expiring" @click="runExpireCheck">超时检查</el-button>
          </el-tooltip>
        </el-form-item>
        <el-form-item class="pull-right">
          <el-tag type="info" effect="plain" size="large">共 {{ pagination.total }} 笔订单</el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单表格 -->
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="订单号" width="220">
          <template #default="{ row }">
            <span class="order-no">{{ row.order_no }}</span>
            <el-tag v-if="Number(row.is_archived) === 1" class="badge-archived" type="warning" effect="dark" size="small" round>已归档</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="buyer" label="买家" width="100" />
        <el-table-column label="金额" width="120">
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
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column prop="receiver_phone" label="电话" width="130" />
        <el-table-column prop="receiver_address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="created_at" label="下单时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="订单详情" placement="top">
              <el-button size="small" circle plain :icon="View" @click="showDetail(row)" />
            </el-tooltip>
            <el-tooltip :content="canNext(row) ? nextAction(row) : '当前状态不可再流转'" placement="top">
              <span class="tip-wrap">
                <el-button size="small" circle type="primary" plain :icon="nextIcon(row)" @click="nextStatus(row)" :disabled="!canNext(row)" />
              </span>
            </el-tooltip>
            <el-tooltip :content="row.status === 'pending' ? '取消订单' : '仅待支付订单可取消'" placement="top">
              <span class="tip-wrap">
                <el-button size="small" circle type="danger" plain :icon="CloseBold" @click="cancelOrder(row)" :disabled="row.status !== 'pending'" />
              </span>
            </el-tooltip>
            <el-tooltip :content="archiveTip(row)" placement="top">
              <span class="tip-wrap">
                <el-button
                  size="small"
                  circle
                  plain
                  :type="isArchived(row) ? 'warning' : 'info'"
                  :icon="isArchived(row) ? RefreshLeft : Box"
                  :disabled="!isArchived(row) && !canArchive(row)"
                  @click="toggleArchive(row)"
                />
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无符合条件的订单" :image-size="90" />
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
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">
            <span class="order-no">{{ detail.order_no }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(detail.status)" :class="statusClass(detail.status)" size="small" effect="dark">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="买家ID">{{ detail.user_id }}</el-descriptions-item>
          <el-descriptions-item label="总金额">
            <span class="price">¥{{ Number(detail.total_amount).toFixed(2) }}</span>
          </el-descriptions-item>
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
          <el-descriptions-item label="下单时间" :span="2">{{ detail.created_at }}</el-descriptions-item>
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
          <template #empty>
            <el-empty description="无商品明细" :image-size="60" />
          </template>
        </el-table>
      </template>
    </el-dialog>

    <!-- 发货弹窗：选择快递公司 + 填写物流单号 -->
    <el-dialog v-model="shipVisible" title="订单发货" width="460px">
      <el-form :model="shipForm" label-width="96px">
        <el-form-item label="订单号">
          <span class="order-no">{{ shipForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="快递公司" required>
          <el-select v-model="shipForm.expressCompany" placeholder="请选择快递公司" style="width: 100%">
            <el-option v-for="c in expressOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号" required>
          <el-input v-model="shipForm.expressNo" placeholder="5-64 位字母/数字/短横线" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="submitShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, View, CloseBold, Money, Van, Check, Box, RefreshLeft, Timer } from '@element-plus/icons-vue';
import { orderApi } from '../../api';

const loading = ref(false);
const list = ref([]);
const detailVisible = ref(false);
const detail = ref(null);

// ===== 待支付超时相关 =====
const nowTick = ref(Date.now());
const loadedAt = ref(Date.now());
const expiring = ref(false);
let clockTimer = null;

// ===== 发货弹窗 =====
const shipVisible = ref(false);
const shipping = ref(false);
const expressOptions = ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '申通快递', '京东物流', 'EMS', '其他'];
const shipForm = reactive({ id: null, orderNo: '', expressCompany: '顺丰速运', expressNo: '' });

// ===== 备注编辑 =====
const remarkEditing = ref(false);
const remarkSaving = ref(false);
const remarkInput = ref('');

const query = reactive({ status: '', orderNo: '', archived: false, page: 1, pageSize: 10 });
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
    if (query.orderNo) params.orderNo = query.orderNo;
    // 归档开关开启时只查已归档订单，关闭时查未归档订单（默认视图）
    if (query.archived) params.archived = 1;
    const data = await orderApi.all(params);
    list.value = data.list;
    loadedAt.value = Date.now();
    pagination.page = data.pagination.page;
    pagination.pageSize = data.pagination.pageSize;
    pagination.total = data.pagination.total;
  } catch (e) {
    // 接口异常时清空列表，具体错误提示由请求拦截器统一弹出
    list.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.status = '';
  query.orderNo = '';
  query.archived = false;
  query.page = 1;
  loadList();
}

/** 切换"查看已归档"开关：回到第一页重新加载 */
function onArchivedChange() {
  query.page = 1;
  loadList();
}

/** 是否已归档（后端返回 1/0，兼容字符串） */
function isArchived(row) {
  return Number(row.is_archived) === 1;
}

/** 仅已完成 / 已取消订单可归档 */
function canArchive(row) {
  return ['completed', 'cancelled'].includes(row.status);
}

/** 归档按钮提示文案 */
function archiveTip(row) {
  if (isArchived(row)) return '取消归档（恢复列表展示）';
  if (canArchive(row)) return '归档订单（列表移除，数据保留可追溯）';
  return '仅已完成或已取消订单可归档';
}

/** 归档 / 取消归档（均需二次确认） */
async function toggleArchive(row) {
  if (isArchived(row)) {
    try {
      await ElMessageBox.confirm(
        `确定将订单 ${row.order_no} 取消归档吗？该订单将重新出现在订单列表中。`,
        '取消归档确认',
        { type: 'info', confirmButtonText: '确认取消归档', cancelButtonText: '再想想' }
      );
    } catch (e) {
      return;
    }
    try {
      await orderApi.unarchive(row.id);
      ElMessage.success('已取消归档，订单恢复展示');
      loadList();
    } catch (e) {
      // 失败提示由请求拦截器统一弹出
    }
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定归档订单 ${row.order_no} 吗？归档后该订单将从列表中移除，但数据完整保留，可在「查看已归档」中恢复。`,
      '归档确认',
      { type: 'warning', confirmButtonText: '确认归档', cancelButtonText: '再想想' }
    );
  } catch (e) {
    return;
  }
  try {
    await orderApi.archive(row.id);
    ElMessage.success('订单已归档，数据保留可追溯');
    loadList();
  } catch (e) {
    // 失败提示由请求拦截器统一弹出
  }
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

function canNext(row) {
  return ['pending', 'paid', 'shipped'].includes(row.status);
}

function nextAction(row) {
  if (row.status === 'pending') return '标记已支付';
  if (row.status === 'paid') return '标记已发货';
  if (row.status === 'shipped') return '标记已完成';
  return '—';
}

function nextIcon(row) {
  if (row.status === 'pending') return Money;
  if (row.status === 'paid') return Van;
  if (row.status === 'shipped') return Check;
  return View;
}

async function nextStatus(row) {
  const next = { pending: 'paid', paid: 'shipped', shipped: 'completed' }[row.status];
  if (!next) return;
  // 发货必须填写物流信息，改为弹窗收集
  if (next === 'shipped') {
    openShip(row);
    return;
  }
  try {
    await orderApi.updateStatus(row.id, next);
    ElMessage.success('订单状态已更新');
    loadList();
  } catch (e) {
    // 失败提示由请求拦截器统一弹出
  }
}

/** 剩余支付时间文案（基于后端返回的 pay_remain_seconds，前端按秒递减） */
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

/** 手动触发超时检查（演示定时任务效果） */
async function runExpireCheck() {
  expiring.value = true;
  try {
    const data = await orderApi.expireCheck();
    ElMessage.success(
      `超时检查完成：扫描 ${data.scannedCount ?? 0} 笔待支付订单，自动取消 ${data.cancelledCount ?? 0} 笔，库存已回滚`
    );
    loadList();
  } catch (e) {
    // 失败提示由请求拦截器统一弹出
  } finally {
    expiring.value = false;
  }
}

/** 打开发货弹窗 */
function openShip(row) {
  shipForm.id = row.id;
  shipForm.orderNo = row.order_no;
  shipForm.expressCompany = row.express_company || '顺丰速运';
  shipForm.expressNo = row.express_no || '';
  shipVisible.value = true;
}

/** 提交发货：写入快递公司与物流单号，同时记录发货时间 */
async function submitShip() {
  const code = (shipForm.expressNo || '').trim();
  if (!code) {
    ElMessage.warning('请填写物流单号');
    return;
  }
  if (!/^[A-Za-z0-9-]{5,64}$/.test(code)) {
    ElMessage.warning('物流单号格式不正确（5-64 位字母/数字/短横线）');
    return;
  }
  shipping.value = true;
  try {
    await orderApi.updateStatus(shipForm.id, 'shipped', {
      expressCompany: shipForm.expressCompany,
      expressNo: code,
    });
    ElMessage.success('发货成功，物流信息已记录');
    shipVisible.value = false;
    loadList();
  } catch (e) {
    // 失败提示由请求拦截器统一弹出
  } finally {
    shipping.value = false;
  }
}

/** 开始编辑备注 */
function startEditRemark() {
  remarkInput.value = detail.value?.remark || '';
  remarkEditing.value = true;
}

/** 保存备注 */
async function saveRemark() {
  if (!detail.value) return;
  remarkSaving.value = true;
  try {
    const data = await orderApi.updateRemark(detail.value.id, remarkInput.value);
    detail.value.remark = data.remark;
    remarkEditing.value = false;
    ElMessage.success(data.remark ? '备注已保存' : '备注已清空');
    loadList();
  } catch (e) {
    // 失败提示由请求拦截器统一弹出
  } finally {
    remarkSaving.value = false;
  }
}

async function cancelOrder(row) {
  try {
    await ElMessageBox.confirm(`确定取消订单 ${row.order_no} 吗？库存将自动回滚。`, '取消确认', {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想',
    });
  } catch (e) {
    // 用户点了"再想想"，直接结束
    return;
  }
  try {
    await orderApi.cancel(row.id);
    ElMessage.success('订单已取消');
    loadList();
  } catch (e) {
    // 失败提示由请求拦截器统一弹出
  }
}

async function showDetail(row) {
  try {
    detail.value = await orderApi.detail(row.id);
    remarkEditing.value = false;
    remarkInput.value = detail.value.remark || '';
    detailVisible.value = true;
  } catch (e) {
    // 失败提示由请求拦截器统一弹出，避免点击后毫无反应却无任何提示
  }
}

onMounted(() => {
  loadList();
  // 每秒刷新一次时钟，驱动"剩余支付时间"倒计时
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

/* ========== 2026-11-04 · 订单管理质感升级 ========== */

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

/* ========== 操作列按钮可用性提示 ==========
   不可用按钮必须一眼看出来是灰的，否则用户会反复点击却毫无反应 */
:deep(.el-table .el-button.is-circle.is-disabled) {
  color: #bfc5d1 !important;
  border-color: #e6e9ef !important;
  background: #f6f7fa !important;
  opacity: 1 !important;
  cursor: not-allowed;
  box-shadow: none;
}

:deep(.el-table .el-button.is-circle.is-disabled:hover) {
  transform: none;
  color: #bfc5d1 !important;
  border-color: #e6e9ef !important;
}

:deep(.el-table .el-button.is-circle:not(.is-disabled):hover) {
  transform: translateY(-2px) scale(1.08);
}

/* ========== 已归档徽章：列表内一眼可辨 ========== */
.badge-archived {
  margin-left: 6px;
  background: linear-gradient(135deg, #fa8c16, #f5222d) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(245, 34, 45, 0.28);
}
</style>
