/**
 * ============================================================
 * 文件作用：用户登录态 Pinia store（全局唯一状态源）
 * 讲解一句话：token 与用户信息持久化到 localStorage，刷新页面不丢失，所有页面用它判断登录与角色。
 * 答辩点：getters 派生 isLogin/role；logout 幂等清理；refreshProfile 从后端拉取最新用户信息。
 * ============================================================
 */
import { defineStore } from 'pinia';
import { authApi } from '../api';

/**
 * 用户登录态 store
 * token 与用户信息持久化到 localStorage，刷新不丢失
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  }),

  getters: {
    isLogin: (state) => !!state.token,
    role: (state) => state.userInfo?.role || '',
    nickname: (state) => state.userInfo?.nickname || '',
  },

  actions: {
    /** 登录成功保存状态 */
    setLogin(token, userInfo) {
      this.token = token;
      this.userInfo = userInfo;
      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    },

    /** 退出登录 */
    logout() {
      this.token = '';
      this.userInfo = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    },

    /** 拉取并刷新用户信息 */
    async refreshProfile() {
      const data = await authApi.profile();
      this.userInfo = data;
      localStorage.setItem('userInfo', JSON.stringify(data));
    },
  },
});
