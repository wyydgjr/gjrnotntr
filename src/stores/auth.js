import { defineStore } from 'pinia'
import {
  login as loginApi,
  adminLogin as adminLoginApi,
  getUserInfo,
  updateProfile as updateProfileApi,
} from '../api/auth'
import { setTokens, clearTokens, hasValidToken } from '../api/request'

/**
 * 认证 Store
 * - Token 存储在 sessionStorage 中
 * - 用户信息缓存在 sessionStorage
 * - 后端数据通过 JSONBin.io 云端持久化，不再需要本地兜底
 */

const STORAGE_PREFIX = 've_'

function safeGet(key) {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_PREFIX + key))
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch { /* ignore */ }
}

function safeRemove(key) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key)
  } catch { /* ignore */ }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: safeGet('user'),
    adminUser: safeGet('admin_user'),
    activeRole: safeGet('active_role') || null,
    _tokenValid: hasValidToken(),
  }),

  getters: {
    isLoggedIn: (state) => state._tokenValid && state.activeRole !== null,
    isAdmin: (state) => state._tokenValid && state.activeRole === 'admin',
    isRegularUser: (state) => state._tokenValid && state.activeRole === 'user',
    effectiveUser: (state) => state.adminUser || state.user,
    currentUser: (state) => (state.activeRole === 'admin' ? state.adminUser : state.user),
  },

  actions: {
    async login(credentials) {
      const res = await loginApi(credentials)
      this._applyLogin(res, 'user')
    },

    async registerAndLogin(registerData) {
      const { register: registerApi } = await import('../api/auth')
      const res = await registerApi(registerData)
      this._applyLogin(res, 'user')
    },

    _applyLogin(res, role) {
      setTokens(res.token, res.refreshToken, res.expiresIn)
      this.activeRole = role
      this._tokenValid = true
      safeSet('active_role', role)
      const userData = res.user || null
      if (role === 'admin') {
        this.adminUser = userData
        safeSet('admin_user', userData)
      } else {
        this.user = userData
        safeSet('user', userData)
      }
    },

    async adminLogin(credentials) {
      const res = await adminLoginApi(credentials)
      this._applyLogin(res, 'admin')
    },

    initFromStorage() {
      const role = safeGet('active_role')
      if (role && hasValidToken()) {
        this.activeRole = role
        this._tokenValid = true
        this.user = safeGet('user')
        this.adminUser = safeGet('admin_user')
      } else {
        this._clearState()
      }
    },

    async fetchUser() {
      try {
        const res = await getUserInfo()
        if (this.activeRole === 'admin') {
          this.adminUser = res.user || res
          safeSet('admin_user', this.adminUser)
        } else {
          this.user = res.user || res
          safeSet('user', this.user)
        }
      } catch {
        // 静默忽略
      }
    },

    async updateProfile(data) {
      const prevUser = this.activeRole === 'admin' ? { ...this.adminUser } : { ...this.user }
      try {
        const res = await updateProfileApi(data)
        if (this.activeRole === 'admin') {
          this.adminUser = res.user || res
          safeSet('admin_user', this.adminUser)
        } else {
          this.user = res.user || res
          safeSet('user', this.user)
        }
      } catch {
        if (this.activeRole === 'admin') {
          this.adminUser = prevUser
          safeSet('admin_user', prevUser)
        } else {
          this.user = prevUser
          safeSet('user', prevUser)
        }
        throw new Error('资料更新失败')
      }
    },

    logout() {
      clearTokens()
      this._clearState()
    },

    _clearState() {
      this.user = null
      this.adminUser = null
      this.activeRole = null
      this._tokenValid = false
      safeRemove('user')
      safeRemove('admin_user')
      safeRemove('active_role')
    },
  },
})
