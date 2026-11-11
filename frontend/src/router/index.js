/**
 * 文件作用：前端路由表 + 全局路由守卫（RBAC 前端一侧，答辩重点）
 * 讲解一句话：路由通过 meta.roles 声明可访问角色，守卫在跳转前完成登录校验与角色校验。
 * 答辩点：前后端双端鉴权——前端守卫控制页面可见性，后端中间件控制接口权限，缺一不可。
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '统计看板', roles: ['admin'] } },
      { path: 'products', name: 'ProductList', component: () => import('../views/product/ProductList.vue'), meta: { title: '商品管理', roles: ['admin'] } },
      { path: 'orders', name: 'OrderManage', component: () => import('../views/order/OrderManage.vue'), meta: { title: '订单管理', roles: ['admin'] } },
      { path: 'shop', name: 'Shop', component: () => import('../views/Shop.vue'), meta: { title: '商品商城', roles: ['user'] } },
      // 商品详情页：/product/:id（真实调用 GET /api/products/:id；管理员从商品管理也能预览）
      { path: 'product/:id', name: 'ProductDetail', component: () => import('../views/product/ProductDetail.vue'), meta: { title: '商品详情', roles: ['user', 'admin'] } },
      { path: 'my-orders', name: 'MyOrders', component: () => import('../views/order/MyOrders.vue'), meta: { title: '我的订单', roles: ['user'] } },
      // 收货地址簿
      { path: 'addresses', name: 'AddressList', component: () => import('../views/address/AddressList.vue'), meta: { title: '收货地址', roles: ['user', 'admin'] } },
      // 个人设置（修改昵称 / 修改密码）
      { path: 'settings', name: 'Settings', component: () => import('../views/settings/Settings.vue'), meta: { title: '个人设置', roles: ['user', 'admin'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue'), meta: { public: true } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 全局路由守卫：登录校验 + 访问控制校验
router.beforeEach((to) => {
  const userStore = useUserStore();

  // 公开页面（登录/注册）直接放行
  if (to.meta.public) return true;

  // 未登录跳转登录页
  if (!userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  // 角色校验：页面声明了 roles 且当前角色不在其中
  if (to.meta.roles && !to.meta.roles.includes(userStore.role)) {
    // 管理员默认进看板，普通用户默认进商城
    return userStore.role === 'admin' ? '/dashboard' : '/shop';
  }

  return true;
});

export default router;
