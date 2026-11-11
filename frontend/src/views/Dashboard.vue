<!-- ============================================================
  文件作用：统计看板页——KPI 指标 + ECharts 图表 + 畅销榜 + 低库存预警
  讲解一句话：页面挂载时并发拉取多类统计接口，用 ECharts 折线图 / 饼图可视化经营数据。
  答辩点：Promise.all 并发请求提升加载速度；图表实例在卸载时 dispose 防止内存泄漏；销售额按有效订单口径统计。
============================================================ -->
<template>
  <div class="dashboard">
    <!-- ===== KPI 四卡 ===== -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :xl="6" v-for="kpi in kpis" :key="kpi.label" class="kpi-col">
        <div class="kpi-card">
          <span class="kpi-bar" :style="{ background: kpi.grad }"></span>
          <div class="kpi-top">
            <div class="kpi-icon" :style="{ background: kpi.iconBg }">
              <el-icon :size="22"><component :is="kpi.icon" /></el-icon>
            </div>
            <span class="kpi-tip">{{ kpi.tip }}</span>
          </div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- ===== 销售趋势 + 订单状态分布 ===== -->
    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>销售趋势</span>
              <div class="card-actions">
                <el-tag size="small" type="success" effect="plain">已支付口径</el-tag>
                <el-radio-group v-model="trendDays" size="small" @change="onTrendDaysChange">
                  <el-radio-button :label="7">近7天</el-radio-button>
                  <el-radio-button :label="30">近30天</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="trendRef" class="chart-box" v-loading="loading" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="10">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>订单状态分布</span>
              <el-tag size="small" type="info" effect="plain">全部订单</el-tag>
            </div>
          </template>
          <div ref="statusRef" class="chart-box" v-loading="loading" />
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 畅销榜 + 低库存预警 ===== -->
    <el-row :gutter="16" class="second-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>畅销商品 TOP5</span>
              <el-tag size="small" type="warning" effect="plain">按销量</el-tag>
            </div>
          </template>
          <div class="top-list" v-loading="loading">
            <div
              v-for="(item, idx) in topProducts"
              :key="item.id"
              class="top-item"
              :style="{ animationDelay: idx * 60 + 'ms' }"
            >
              <span class="top-rank" :class="'rank-' + (idx + 1)">{{ idx + 1 }}</span>
              <img v-if="item.image_url" :src="item.image_url" class="top-thumb" alt="" />
              <div v-else class="top-thumb top-thumb-placeholder">
                <el-icon :size="18"><Goods /></el-icon>
              </div>
              <div class="top-info">
                <div class="top-name">{{ item.name }}</div>
                <div class="top-meta">{{ item.category }} · 售出 {{ item.sold }} 件</div>
              </div>
              <div class="top-bar-wrap">
                <div class="top-bar" :style="{ width: topBarWidth(item.sold) }"></div>
              </div>
              <div class="top-amount">¥{{ Number(item.amount).toLocaleString() }}</div>
            </div>
            <el-empty v-if="!loading && topProducts.length === 0" description="暂无销量数据" :image-size="70" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-title">
              <span>低库存预警</span>
              <el-badge :value="lowStockList.length" type="danger" :max="99" class="low-badge" />
            </div>
          </template>
          <el-table :data="lowStockList" size="small" v-loading="loading" max-height="336" class="low-table">
            <el-table-column prop="name" label="商品名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="90" />
            <el-table-column label="价格" width="90">
              <template #default="{ row }">¥{{ Number(row.price).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="库存" width="90" sortable>
              <template #default="{ row }">
                <el-tag :type="row.stock <= 5 ? 'danger' : 'warning'" size="small" effect="dark">
                  {{ row.stock }}
                </el-tag>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无低库存商品" :image-size="80" />
            </template>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { statsApi } from '../api';
import {
  Money, Tickets, Wallet, Warning, Goods,
} from '@element-plus/icons-vue';

const loading = ref(true);
const overview = ref({});
const lowStockList = ref([]);
const topProducts = ref([]);
const trendDays = ref(7);

const trendRef = ref(null);
const statusRef = ref(null);

let chartTrend = null;
let chartStatus = null;

const STATUS_COLORS = {
  pending: '#faad14',
  paid: '#1677ff',
  shipped: '#13c2c2',
  completed: '#10b981',
  cancelled: '#f5222d',
};
const STATUS_LABELS = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

const kpis = computed(() => [
  {
    label: '总销售额',
    icon: Money,
    tip: '有效订单累计',
    grad: 'linear-gradient(90deg, #1677ff, #69b1ff)',
    iconBg: 'linear-gradient(135deg, rgba(22,119,255,0.16), rgba(105,177,255,0.16))',
    color: '#1677ff',
    value: `¥${Number(overview.value.totalSales || 0).toLocaleString()}`,
  },
  {
    label: '订单总数',
    icon: Tickets,
    tip: '全部状态订单',
    grad: 'linear-gradient(90deg, #722ed1, #b37feb)',
    iconBg: 'linear-gradient(135deg, rgba(114,46,209,0.14), rgba(179,127,235,0.14))',
    color: '#722ed1',
    value: overview.value.totalOrders ?? '-',
  },
  {
    label: '平均客单价',
    icon: Wallet,
    tip: '有效订单均值',
    grad: 'linear-gradient(90deg, #13c2c2, #5cdbd3)',
    iconBg: 'linear-gradient(135deg, rgba(19,194,194,0.14), rgba(92,219,211,0.14))',
    color: '#13c2c2',
    value: `¥${Number(overview.value.avgOrder || 0).toLocaleString()}`,
  },
  {
    label: '低库存商品',
    icon: Warning,
    tip: '库存 ≤ 10',
    grad: 'linear-gradient(90deg, #f5222d, #ff7875)',
    iconBg: 'linear-gradient(135deg, rgba(245,34,45,0.14), rgba(255,120,117,0.14))',
    color: '#f5222d',
    value: overview.value.lowStockProducts ?? '-',
  },
]);

function baseOption() {
  return {
    color: ['#1677ff', '#36cfc9', '#fa8c16', '#722ed1', '#f5222d', '#13c2c2'],
    textStyle: { fontFamily: 'Microsoft YaHei' },
  };
}

function renderTrend(rows) {
  if (!chartTrend) chartTrend = echarts.init(trendRef.value);
  chartTrend.setOption({
    ...baseOption(),
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `¥${Number(v).toLocaleString()}`,
      backgroundColor: 'rgba(15,31,77,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
    },
    grid: { left: 58, right: 24, top: 36, bottom: 30 },
    xAxis: {
      type: 'category',
      data: rows.map((r) => r.date),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#eef0f4' } },
      axisTick: { show: false },
      axisLabel: { color: '#8c8c8c', interval: rows.length > 10 ? 2 : 0 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}', color: '#8c8c8c' },
      splitLine: { lineStyle: { color: '#f2f4f8', type: 'dashed' } },
    },
    series: [{
      name: '销售额',
      type: 'line',
      smooth: true,
      symbolSize: 7,
      showSymbol: rows.length <= 10,
      lineStyle: { width: 3, color: '#1677ff' },
      itemStyle: { color: '#1677ff', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(22,119,255,0.32)' },
          { offset: 1, color: 'rgba(22,119,255,0.02)' },
        ]),
      },
      data: rows.map((r) => Number(r.amount)),
    }],
  });
}

function renderStatus(rows) {
  if (!chartStatus) chartStatus = echarts.init(statusRef.value);
  const total = rows.reduce((s, r) => s + Number(r.count), 0) || 1;
  chartStatus.setOption({
    ...baseOption(),
    color: rows.map((r) => STATUS_COLORS[r.status] || '#bfbfbf'),
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${STATUS_LABELS[p.name] || p.name}<br/>${p.value} 单（${p.percent}%）`,
      backgroundColor: 'rgba(15,31,77,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff' },
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#595959' },
      formatter: (name) => `${STATUS_LABELS[name] || name}  ${rows.find((r) => r.status === name)?.count ?? 0}`,
    },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['46%', '68%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      emphasis: {
        scaleSize: 6,
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 13, fontWeight: 600 },
      },
      data: rows.map((r) => ({ name: r.status, value: Number(r.count) })),
    }],
  });
}

function topBarWidth(sold) {
  const max = Math.max(...topProducts.value.map((p) => p.sold), 1);
  return `${Math.round((Number(sold) / max) * 100)}%`;
}

function handleResize() {
  chartTrend?.resize();
  chartStatus?.resize();
}

async function loadTrend(days) {
  const [trend, orders] = await Promise.all([
    statsApi.trend(days),
    statsApi.ordersTrend(days),
  ]);
  renderTrend(trend.map((r, i) => ({
    date: r.date,
    amount: Number(r.amount),
    count: Number(orders[i]?.count ?? 0),
  })));
}

// 一次性并发拉取看板全部数据（总览 / 状态分布 / 低库存 / 畅销榜），避免串行请求拖慢首屏
async function loadAll() {
  loading.value = true;
  try {
    const [ov, status, low, top] = await Promise.all([
      statsApi.overview(),
      statsApi.statusDistribution(),
      statsApi.lowStock(),
      statsApi.topProducts(),
    ]);
    overview.value = ov;
    lowStockList.value = low;
    topProducts.value = top;
    renderStatus(status);
    await loadTrend(trendDays.value);
  } catch {
    // 接口异常时保留已渲染部分，错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false;
  }
}

async function onTrendDaysChange() {
  loading.value = true;
  try {
    await loadTrend(trendDays.value);
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadAll();
  window.addEventListener('resize', handleResize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartTrend?.dispose();
  chartStatus?.dispose();
  chartTrend = null;
  chartStatus = null;
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ========== KPI 四卡 ========== */
.kpi-row .kpi-col {
  margin-bottom: 16px;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 14px;
  padding: 20px 20px 18px;
  box-shadow: 0 4px 16px rgba(15, 31, 77, 0.06);
  transition: transform 0.28s ease, box-shadow 0.28s ease;
  animation: fadeInUp 0.4s ease both;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 32px rgba(15, 31, 77, 0.14);
}

.kpi-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
}

.kpi-card::after {
  content: '';
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  right: -44px;
  bottom: -52px;
  background: radial-gradient(circle, rgba(22, 119, 255, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.28s ease;
}

.kpi-card:hover .kpi-icon {
  transform: rotate(-6deg) scale(1.08);
}

.kpi-tip {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f7fa;
  border: 1px solid #eef0f4;
  padding: 3px 10px;
  border-radius: 999px;
}

.kpi-value {
  margin-top: 16px;
  font-size: 28px;
  font-weight: 700;
  color: #141a2b;
  font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
}

.kpi-label {
  margin-top: 4px;
  font-size: 14px;
  color: #8c8c8c;
}

/* ========== 卡片通用 ========== */
.chart-card {
  border: 1px solid #eef0f4;
  border-radius: 14px;
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  animation: fadeInUp 0.5s ease both;
}

.chart-card:hover {
  box-shadow: 0 12px 28px rgba(15, 31, 77, 0.1);
  transform: translateY(-2px);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #1677ff, #36cfc9);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-actions :deep(.el-radio-group) {
  border-radius: 999px;
  overflow: hidden;
}

.card-actions :deep(.el-radio-button__inner) {
  padding: 6px 14px;
}

.chart-box {
  height: 320px;
}

.second-row {
  margin-top: 0;
}

.low-badge {
  margin-right: 12px;
}

.low-badge :deep(.el-badge__content) {
  box-shadow: 0 2px 6px rgba(245, 34, 45, 0.35);
}

/* ========== 畅销榜 ========== */
.top-list {
  min-height: 336px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fafbfc;
  border: 1px solid transparent;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  animation: fadeInUp 0.45s ease both;
}

.top-item:hover {
  background: #fff;
  border-color: #dbe4ff;
  transform: translateX(4px);
  box-shadow: 0 6px 16px rgba(15, 31, 77, 0.08);
}

.top-rank {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #8c8c8c;
  background: #eef0f4;
  flex-shrink: 0;
}

.top-rank.rank-1 {
  color: #fff;
  background: linear-gradient(135deg, #f7b733, #fc4a1a);
  box-shadow: 0 3px 8px rgba(247, 183, 51, 0.4);
}

.top-rank.rank-2 {
  color: #fff;
  background: linear-gradient(135deg, #8e9eab, #5c6b7a);
  box-shadow: 0 3px 8px rgba(92, 107, 122, 0.3);
}

.top-rank.rank-3 {
  color: #fff;
  background: linear-gradient(135deg, #d19c5a, #a9713b);
  box-shadow: 0 3px 8px rgba(169, 113, 59, 0.3);
}

.top-thumb {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #eef0f4;
  background: #f5f7fa;
}

.top-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c8cdd8;
}

.top-info {
  flex: 1;
  min-width: 0;
}

.top-name {
  font-size: 14px;
  font-weight: 600;
  color: #141a2b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-meta {
  font-size: 12px;
  color: #a0a6b2;
  margin-top: 2px;
}

.top-bar-wrap {
  width: 92px;
  height: 6px;
  border-radius: 999px;
  background: #eef0f4;
  overflow: hidden;
  flex-shrink: 0;
}

.top-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1677ff, #36cfc9);
  transition: width 0.6s ease;
}

.top-amount {
  width: 92px;
  text-align: right;
  font-size: 13px;
  font-weight: 700;
  color: #1677ff;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ========== 低库存表 ========== */
.low-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, #f0f4ff, #f7f9ff);
  color: #4a5468;
  font-weight: 600;
}

.low-table :deep(.el-table__row) {
  transition: background 0.2s ease;
}

/* ========== 2026-11-04 · 看板质感升级 ========== */

/* ---- KPI 卡片：玻璃质感 + 渐变数字 ---- */
.kpi-card {
  background: linear-gradient(160deg, #ffffff 0%, #f8faff 100%);
  border: 1px solid rgba(22, 119, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 10px 30px rgba(15, 31, 77, 0.07);
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(240px 140px at 90% -10%, rgba(22, 119, 255, 0.12), transparent 70%);
  pointer-events: none;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(15, 31, 77, 0.05), 0 20px 48px rgba(15, 31, 77, 0.14);
}

.kpi-bar {
  height: 5px;
  border-radius: 0 0 6px 6px;
  filter: drop-shadow(0 2px 4px rgba(22, 119, 255, 0.4));
}

.kpi-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.kpi-value {
  font-size: 30px;
  background: linear-gradient(120deg, #141a2b 30%, #1677ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.kpi-tip {
  color: #7a8499;
  background: rgba(22, 119, 255, 0.06);
  border: 1px solid rgba(22, 119, 255, 0.12);
}

.kpi-label {
  color: #7a8499;
  font-weight: 500;
  letter-spacing: 0.4px;
}

/* ---- 图表卡片 ---- */
.chart-card {
  border-radius: 16px;
  border: 1px solid rgba(22, 119, 255, 0.09);
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 12px 34px rgba(15, 31, 77, 0.07);
}

.chart-card:hover {
  box-shadow: 0 4px 10px rgba(15, 31, 77, 0.06), 0 20px 48px rgba(15, 31, 77, 0.13);
  transform: translateY(-3px);
}

.card-title {
  font-size: 15px;
  letter-spacing: 0.3px;
}

.card-title::before {
  background: linear-gradient(180deg, #1677ff, #7b5cff);
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(22, 119, 255, 0.4);
}

/* ---- 畅销榜 ---- */
.top-item {
  background: linear-gradient(135deg, #f7f9fd, #fbfcff);
  border: 1px solid rgba(22, 119, 255, 0.06);
}

.top-item:hover {
  background: linear-gradient(135deg, #ffffff, #f3f8ff);
  border-color: rgba(22, 119, 255, 0.22);
  box-shadow: 0 8px 22px rgba(15, 31, 77, 0.1);
  transform: translateX(5px);
}

.top-rank {
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 9px;
}

.top-bar-wrap {
  background: #edf0f6;
  box-shadow: inset 0 1px 2px rgba(15, 31, 77, 0.06);
}

.top-bar {
  background: linear-gradient(90deg, #1677ff, #36cfc9);
  box-shadow: 0 2px 6px rgba(22, 119, 255, 0.35);
}

.top-amount {
  color: #1677ff;
  font-size: 14px;
}

/* ---- 低库存表 ---- */
.low-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.06), rgba(124, 92, 255, 0.03)) !important;
}
</style>
