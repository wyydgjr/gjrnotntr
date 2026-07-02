import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useSeo } from '../utils/seo'

const DEFAULT_DESC = 'VeStore 精选好物，用心为你推荐每一件值得拥有的产品，享受品质生活。'

const frontMeta = {
  FrontHome: { title: 'VeStore - 品质生活，从这里开始', description: DEFAULT_DESC },
  FrontProducts: { title: '全部商品 - VeStore', description: '浏览 VeStore 全部精选商品，服饰、数码、家居好物一站购齐。' },
  FrontProductDetail: { title: '商品详情 - VeStore', description: '' },
  FrontCart: { title: '购物车 - VeStore', description: '查看购物车中的商品，准备结算。' },
  FrontCheckout: { title: '结算 - VeStore', description: '' },
  FrontPayment: { title: '支付 - VeStore', description: '' },
  FrontOrderSuccess: { title: '下单成功 - VeStore', description: '' },
  FrontOrders: { title: '我的订单 - VeStore', description: '查看您的订单历史和物流状态。' },
  FrontOrderDetail: { title: '订单详情 - VeStore', description: '' },
  FrontWishlist: { title: '我的收藏 - VeStore', description: '您收藏的心仪商品。' },
  FrontAddresses: { title: '收货地址 - VeStore', description: '' },
  FrontCoupons: { title: '我的优惠券 - VeStore', description: '' },
  FrontAfterSales: { title: '售后申请 - VeStore', description: '' },
  FrontInvoices: { title: '发票管理 - VeStore', description: '' },
  FrontChat: { title: '在线客服 - VeStore', description: '' },
}

const routes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '404 - VeStore' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true, title: '用户登录 - VeStore' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/front/Register.vue'),
    meta: { guest: true, title: '注册 - VeStore' },
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue'),
    meta: { guest: true, title: '管理员登录 - VeStore' },
  },
  {
    path: '/',
    component: () => import('../layouts/FrontLayout.vue'),
    children: [
      { path: '', name: 'FrontHome', component: () => import('../views/front/Home.vue') },
      { path: 'products', name: 'FrontProducts', component: () => import('../views/front/ProductList.vue') },
      { path: 'product/:id', name: 'FrontProductDetail', component: () => import('../views/front/ProductDetail.vue') },
      { path: 'cart', name: 'FrontCart', component: () => import('../views/front/Cart.vue') },
      { path: 'checkout', name: 'FrontCheckout', component: () => import('../views/front/Checkout.vue'), meta: { requiresAuth: true } },
      { path: 'payment', name: 'FrontPayment', component: () => import('../views/front/Payment.vue'), meta: { requiresAuth: true } },
      { path: 'order-success', name: 'FrontOrderSuccess', component: () => import('../views/front/OrderSuccess.vue') },
      { path: 'orders', name: 'FrontOrders', component: () => import('../views/front/UserOrders.vue'), meta: { requiresAuth: true } },
      { path: 'orders/:id', name: 'FrontOrderDetail', component: () => import('../views/front/OrderDetail.vue'), meta: { requiresAuth: true } },
      { path: 'wishlist', name: 'FrontWishlist', component: () => import('../views/front/Wishlist.vue'), meta: { requiresAuth: true } },
      { path: 'addresses', name: 'FrontAddresses', component: () => import('../views/front/AddressList.vue'), meta: { requiresAuth: true } },
      { path: 'coupons', name: 'FrontCoupons', component: () => import('../views/front/Coupons.vue'), meta: { requiresAuth: true } },
      { path: 'after-sales', name: 'FrontAfterSales', component: () => import('../views/front/AfterSales.vue'), meta: { requiresAuth: true } },
      { path: 'invoices', name: 'FrontInvoices', component: () => import('../views/front/Invoices.vue'), meta: { requiresAuth: true } },
      { path: 'chat', name: 'FrontChat', component: () => import('../views/front/Chat.vue'), meta: { requiresAuth: true } },
    ],
  },
  {
    path: '/admin',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '仪表盘', requiresAdmin: true } },
      { path: 'users', name: 'UserList', component: () => import('../views/UserList.vue'), meta: { title: '用户管理', requiresAdmin: true } },
      { path: 'users/new', name: 'UserCreate', component: () => import('../views/UserForm.vue'), meta: { title: '新增用户', requiresAdmin: true } },
      { path: 'users/:id/edit', name: 'UserEdit', component: () => import('../views/UserForm.vue'), meta: { title: '编辑用户', requiresAdmin: true } },
      { path: 'products', name: 'ProductList', component: () => import('../views/ProductList.vue'), meta: { title: '产品管理', requiresAdmin: true } },
      { path: 'products/new', name: 'ProductCreate', component: () => import('../views/ProductForm.vue'), meta: { title: '新增产品', requiresAdmin: true } },
      { path: 'products/:id/edit', name: 'ProductEdit', component: () => import('../views/ProductForm.vue'), meta: { title: '编辑产品', requiresAdmin: true } },
      { path: 'categories', name: 'CategoryList', component: () => import('../views/CategoryList.vue'), meta: { title: '分类管理', requiresAdmin: true } },
      { path: 'categories/new', name: 'CategoryCreate', component: () => import('../views/CategoryForm.vue'), meta: { title: '新增分类', requiresAdmin: true } },
      { path: 'categories/:id/edit', name: 'CategoryEdit', component: () => import('../views/CategoryForm.vue'), meta: { title: '编辑分类', requiresAdmin: true } },
      { path: 'orders', name: 'OrderList', component: () => import('../views/OrderList.vue'), meta: { title: '订单管理', requiresAdmin: true } },
      { path: 'orders/:id', name: 'OrderDetail', component: () => import('../views/OrderDetail.vue'), meta: { title: '订单详情', requiresAdmin: true } },
      { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { title: '个人中心', requiresAdmin: true } },
      { path: 'banners', name: 'BannerList', component: () => import('../views/BannerList.vue'), meta: { title: '轮播管理', requiresAdmin: true } },
      { path: 'coupons', name: 'CouponList', component: () => import('../views/CouponList.vue'), meta: { title: '优惠券管理', requiresAdmin: true } },
      { path: 'after-sales', name: 'AfterSaleList', component: () => import('../views/AfterSaleList.vue'), meta: { title: '售后工单', requiresAdmin: true } },
      { path: 'invoices', name: 'InvoiceList', component: () => import('../views/InvoiceList.vue'), meta: { title: '发票管理', requiresAdmin: true } },
      { path: 'audit-logs', name: 'AuditLog', component: () => import('../views/AuditLog.vue'), meta: { title: '操作日志', requiresAdmin: true } },
      { path: 'spec-templates', name: 'SpecTemplate', component: () => import('../views/SpecTemplate.vue'), meta: { title: '属性模板', requiresAdmin: true } },
      { path: 'purchase-orders', name: 'PurchaseOrder', component: () => import('../views/PurchaseOrder.vue'), meta: { title: '采购单', requiresAdmin: true } },
      { path: 'suppliers', name: 'SupplierList', component: () => import('../views/SupplierList.vue'), meta: { title: '供应商', requiresAdmin: true } },
      { path: 'reviews', name: 'ReviewList', component: () => import('../views/ReviewList.vue'), meta: { title: '评价管理', requiresAdmin: true } },
      { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { title: '系统设置', requiresAdmin: true } },
      // ── 新增小企业功能页面 ──
      { path: 'inventory', name: 'InventoryList', component: () => import('../views/InventoryList.vue'), meta: { title: '库存管理', requiresAdmin: true } },
      { path: 'reports', name: 'ReportView', component: () => import('../views/ReportView.vue'), meta: { title: '销售报表', requiresAdmin: true } },
      { path: 'roles', name: 'RoleList', component: () => import('../views/RoleList.vue'), meta: { title: '角色管理', requiresAdmin: true } },
      { path: 'logistics', name: 'LogisticsList', component: () => import('../views/LogisticsList.vue'), meta: { title: '物流管理', requiresAdmin: true } },
      { path: 'members', name: 'MemberLevel', component: () => import('../views/MemberLevel.vue'), meta: { title: '会员管理', requiresAdmin: true } },
      { path: 'backup', name: 'BackupRestore', component: () => import('../views/BackupRestore.vue'), meta: { title: '数据备份', requiresAdmin: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (auth.activeRole === null) auth.initFromStorage()

  // SEO meta
  const { setMeta, setBreadcrumbSchema, setWebsiteSchema, setOrganizationSchema } = useSeo()
  const frontSeo = frontMeta[to.name]
  if (frontSeo) {
    setMeta({
      title: frontSeo.title,
      description: frontSeo.description,
      url: window.location.origin + to.path,
    })
  } else {
    const title = to.meta.title ? `${to.meta.title} - VeStore` : 'VeStore'
    setMeta({ title, description: '' })
  }
  // 首页注入 Website + Organization 结构化数据
  if (to.name === 'FrontHome') {
    setWebsiteSchema(window.location.origin)
    setOrganizationSchema({ url: window.location.origin })
    setBreadcrumbSchema([{ name: '首页', url: window.location.origin + '/' }])
  }

  if (to.meta.guest) {
    if (auth.isAdmin) return next('/admin/dashboard')
    if (auth.isRegularUser) return next('/')
    return next()
  }
  if (to.meta.requiresAdmin) {
    if (auth.isAdmin) return next()
    return next('/admin/login')
  }
  if (to.meta.requiresAuth) {
    if (auth.isLoggedIn) return next()
    return next('/login')
  }
  next()
})

export default router
