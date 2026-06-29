<template>
  <div>
    <div class="page-header">
      <h2>仪表盘</h2>
      <p class="text-secondary">系统概览与数据统计</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="s in stats" :key="s.label" @click="s.route && $router.push(s.route)" style="cursor: pointer;">
        <div class="stat-icon" :style="{ background: s.bg }">{{ s.icon }}</div>
        <div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px;">
      <div class="card">
        <h3 class="chart-title">月度营收趋势</h3>
        <div v-if="revenue.months && revenue.months.length" class="bar-chart">
          <div v-for="(m, i) in revenue.months" :key="i" class="bar-item">
            <div class="bar-label">{{ m.slice(5) }}月</div>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{ width: (revenue.values[i] / maxRevenue * 100) + '%' }"
              ></div>
            </div>
            <div class="bar-value">¥{{ (revenue.values[i] / 1000).toFixed(1) }}k</div>
          </div>
          <div v-if="revenue.months && revenue.months.length === 0" class="empty-chart">暂无营收数据</div>
        </div>
        <div v-else class="empty-chart">加载中...</div>
      </div>

      <div class="card">
        <h3 class="chart-title">最近活动</h3>
        <div v-if="activities.length" class="activity-list">
          <div v-for="(act, i) in activities" :key="i" class="activity-item">
            <div class="activity-dot" :class="act.type === '新增用户' ? 'dot-user' : act.type === '新订单' ? 'dot-order' : 'dot-product'"></div>
            <div class="activity-content">
              <span class="badge" :class="act.type === '新增用户' ? 'badge-active' : act.type === '新订单' ? 'badge-pending' : 'badge-inactive'">{{ act.type }}</span>
              <span class="activity-text">{{ act.content }}</span>
            </div>
            <span class="activity-time">{{ act.time }}</span>
          </div>
        </div>
        <div v-else class="empty-chart">暂无活动</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useResourceStore } from '../stores/resource'
import { getDashboardStats, getDashboardActivities, getDashboardRevenue } from '../api/auth'

const $router = useRouter()

const userStore = useResourceStore('dashboard-users', '/users')
const productStore = useResourceStore('dashboard-products', '/products')
const orderStore = useResourceStore('dashboard-orders', '/orders')

const stats = ref([
  { label: '用户总数', value: 0, icon: '👥', bg: '#ede9fe', route: '/users' },
  { label: '产品总数', value: 0, icon: '📦', bg: '#dbeafe', route: '/products' },
  { label: '订单总数', value: 0, icon: '📋', bg: '#dcfce7', route: '/orders' },
  { label: '活跃用户', value: 0, icon: '⭐', bg: '#fef3c7' },
  { label: '待处理订单', value: 0, icon: '⏳', bg: '#fed7aa', route: '/orders' },
  { label: '低库存商品', value: 0, icon: '⚠️', bg: '#fee2e2', route: '/products' },
])

const activities = ref([])
const revenue = ref({ months: [], values: [] })

const maxRevenue = computed(() => Math.max(...revenue.value.values, 1))

onMounted(async () => {
  try {
    const [s, act, rev] = await Promise.all([
      getDashboardStats(),
      getDashboardActivities(),
      getDashboardRevenue(),
    ])
    if (s) {
      stats.value[0].value = s.userCount || 0
      stats.value[1].value = s.productCount || 0
      stats.value[2].value = s.orderCount || 0
      stats.value[3].value = s.activeUsers || 0
      stats.value[4].value = s.pendingOrders || 0
      stats.value[5].value = s.lowStock || 0
    }
    if (Array.isArray(act)) activities.value = act
    if (rev) revenue.value = rev
  } catch {}
})
</script>

<style scoped>
.text-secondary { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
  transition: transform .15s, box-shadow .15s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-value { font-size: 24px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

.chart-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }

.bar-chart { display: flex; flex-direction: column; gap: 10px; }
.bar-item { display: flex; align-items: center; gap: 10px; }
.bar-label { width: 36px; font-size: 12px; color: var(--text-secondary); text-align: right; flex-shrink: 0; }
.bar-track { flex: 1; height: 20px; background: var(--bg); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #818cf8); border-radius: 4px; transition: width .5s ease; min-width: 4px; }
.bar-value { width: 56px; font-size: 12px; color: var(--text-secondary); flex-shrink: 0; }
.empty-chart { padding: 32px 0; text-align: center; color: var(--text-secondary); font-size: 14px; }

.activity-list { display: flex; flex-direction: column; gap: 12px; }
.activity-item { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; }
.activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.dot-user { background: var(--success); }
.dot-order { background: var(--warning); }
.dot-product { background: var(--info); }
.activity-content { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.activity-text { color: var(--text); }
.activity-time { color: var(--text-secondary); font-size: 12px; white-space: nowrap; flex-shrink: 0; }
</style>
