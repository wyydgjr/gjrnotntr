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
      // 前台 404 兜底
      { path: ':pathMatch(.*)*', name: 'FrontNotFound', component: () => import('../views/NotFound.vue'), meta: { title: '404 - VeStore' } },
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
  if (to.name === 'FrontHome') {
    setWebsiteSchema(window.location.origin)
    setOrganizationSchema({ url: window.location.origin })
    setBreadcrumbSchema([{ name: '首页', url: window.location.origin + '/' }])
  }

  if (to.meta.guest) {
    if (auth.isRegularUser) return next('/')
    return next()
  }
  if (to.meta.requiresAuth) {
    if (auth.isLoggedIn) return next()
    return next('/login')
  }
  next()
})

export default router
