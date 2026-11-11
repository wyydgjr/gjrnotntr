import request from './request';

// ========== 认证 ==========
export const authApi = {
  register: (data) => request.post('/auth/register', data),
  login: (data) => request.post('/auth/login', data),
  profile: () => request.get('/auth/profile'),
  // 修改昵称（PUT /api/auth/profile）
  updateProfile: (data) => request.put('/auth/profile', data),
  changeNickname: (nickname) => request.post('/auth/change-nickname', { nickname }),
  // 修改密码（旧密码 + 新密码）
  changePassword: (data) => request.post('/auth/change-password', data),
};

// ========== 收货地址簿 ==========
export const addressApi = {
  list: () => request.get('/addresses'),
  create: (data) => request.post('/addresses', data),
  update: (id, data) => request.put(`/addresses/${id}`, data),
  remove: (id) => request.delete(`/addresses/${id}`),
  // 设为默认地址
  setDefault: (id) => request.post(`/addresses/${id}/default`),
};

// ========== 商品 ==========
export const productApi = {
  // 参数：page / pageSize / keyword / category / status
  list: (params) => request.get('/products', { params }),
  detail: (id) => request.get(`/products/${id}`),
  create: (data) => request.post('/products', data),
  update: (id, data) => request.put(`/products/${id}`, data),
  remove: (id) => request.delete(`/products/${id}`),
  toggleStatus: (id, status) => request.patch(`/products/${id}/status`, { status }),
  // 分类列表（登录用户可见）
  categories: () => request.get('/products/categories'),
};

// ========== 订单 ==========
export const orderApi = {
  // 管理员：全部订单
  all: (params) => request.get('/orders', { params }),
  // 用户：我的订单
  mine: (params) => request.get('/orders/mine', { params }),
  create: (data) => request.post('/orders', data),
  detail: (id) => request.get(`/orders/${id}`),
  cancel: (id) => request.post(`/orders/${id}/cancel`),
  // 用户支付自己的待支付订单
  pay: (id) => request.post(`/orders/${id}/pay`),
  // 用户确认收货（已发货→已完成）
  confirm: (id) => request.post(`/orders/${id}/confirm`),
  updateStatus: (id, status, extra = {}) => request.post(`/orders/${id}/status`, { status, ...extra }),
  // 保存订单备注（本人或管理员）
  updateRemark: (id, remark) => request.post(`/orders/${id}/remark`, { remark }),
  // 管理员：手动触发待支付超时检查（返回本次取消条数）
  expireCheck: () => request.post('/orders/expire-check'),
  // 管理员：归档订单（软删除，仅已完成/已取消，数据保留可追溯）
  archive: (id) => request.post(`/orders/${id}/archive`),
  // 管理员：取消归档（恢复列表展示）
  unarchive: (id) => request.post(`/orders/${id}/unarchive`),
};

// ========== 统计看板（管理员） ==========
export const statsApi = {
  overview: () => request.get('/stats/overview'),
  category: () => request.get('/stats/category'),
  // days: 7 / 30
  trend: (days) => request.get('/stats/trend', { params: { days } }),
  ordersTrend: (days) => request.get('/stats/orders-trend', { params: { days } }),
  lowStock: () => request.get('/stats/low-stock'),
  statusDistribution: () => request.get('/stats/status-distribution'),
  topProducts: () => request.get('/stats/top-products'),
};
