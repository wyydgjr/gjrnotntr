import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('../views/UserList.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'users/new',
        name: 'UserCreate',
        component: () => import('../views/UserForm.vue'),
        meta: { title: '新增用户' },
      },
      {
        path: 'users/:id/edit',
        name: 'UserEdit',
        component: () => import('../views/UserForm.vue'),
        meta: { title: '编辑用户' },
      },
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('../views/ProductList.vue'),
        meta: { title: '产品管理' },
      },
      {
        path: 'products/new',
        name: 'ProductCreate',
        component: () => import('../views/ProductForm.vue'),
        meta: { title: '新增产品' },
      },
      {
        path: 'products/:id/edit',
        name: 'ProductEdit',
        component: () => import('../views/ProductForm.vue'),
        meta: { title: '编辑产品' },
      },
      {
        path: 'categories',
        name: 'CategoryList',
        component: () => import('../views/CategoryList.vue'),
        meta: { title: '分类管理' },
      },
      {
        path: 'categories/new',
        name: 'CategoryCreate',
        component: () => import('../views/CategoryForm.vue'),
        meta: { title: '新增分类' },
      },
      {
        path: 'categories/:id/edit',
        name: 'CategoryEdit',
        component: () => import('../views/CategoryForm.vue'),
        meta: { title: '编辑分类' },
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('../views/OrderList.vue'),
        meta: { title: '订单管理' },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        meta: { title: '订单详情' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { title: '个人中心' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.guest) {
    next()
  } else if (!auth.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
