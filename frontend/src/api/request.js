/**
 * ============================================================
 * 文件作用：Axios 实例封装——请求 / 响应拦截器（答辩重点）
 * 讲解一句话：所有接口调用统一走这里：请求时自动携带登录凭证，响应时统一处理业务码与 401。
 * 答辩点：请求拦截器注入 Bearer Token；约定 code===0 为成功；401 统一登出并跳转，收敛处理避免跳转风暴。
 * ============================================================
 */
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';
import router from '../router';

// 接口根地址：
// 开发环境下走 vite 代理的 /api；如果是双击本地 html 文件打开的页面（file:// 协议），
// 没有代理可用，必须直连后端服务地址，否则所有请求都会失败、页面按钮点击后毫无反应。
const isOpenedFromFile = typeof window !== 'undefined' && window.location.protocol === 'file:';
const baseURL = import.meta.env.VITE_API_BASE || (isOpenedFromFile ? 'http://localhost:3000/api' : '/api');

// 创建 axios 实例
const request = axios.create({
  baseURL,
  timeout: 10000,
});

// 请求拦截器：自动携带登录凭证
request.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`;
  }
  return config;
});

// 响应拦截器：统一处理业务码与错误
request.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 约定：code === 0 成功
    if (res && res.code === 0) return res.data;
    // 业务失败（如 400/403/404）
    ElMessage.error(res?.message || '请求失败');
    return Promise.reject(new Error(res?.message || '请求失败'));
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      // 未登录 / token 失效：清除登录态并跳转登录页
      const userStore = useUserStore();
      userStore.logout();
      ElMessage.warning(message || '登录已过期，请重新登录');
      router.push({ path: '/login' });
    } else {
      ElMessage.error(message || '网络异常，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default request;
