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
 *
 * Vercel Serverless 是无状态的，db.json 每次冷启动重置。
 * 因此引入本地用户注册表 (localStorage)，让注册/登录在无状态环境下也能工作：
 * - 新用户注册时：先调后端 API（可能因冷启动重置失败），再写入本地注册表兜底
 * - 用户登录时：先尝试后端 API，失败则 fallback 到本地注册表验证
 */

const STORAGE_PREFIX = 've_'

// ── 本地用户注册表（解决 Vercel Serverless 无状态问题） ──
const LOCAL_USERS_KEY = 've_local_users'

function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  } catch { /* ignore */ }
}

function hashPasswordSimple(pwd) {
  // 简单哈希，仅用于本地存储比对（非安全场景）
  let h = 0
  for (let i = 0; i < pwd.length; i++) {
    h = ((h << 5) - h + pwd.charCodeAt(i)) | 0
  }
  return 'local_' + Math.abs(h).toString(16)
}

// ── sessionStorage 工具 ──

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
  } catch { /* quota exceeded, silently ignore */ }
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
    /** @type {'user' | 'admin' | null} */
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
    // ── 普通用户登录（后端优先 + 本地兜底） ──
    async login(credentials) {
      let res = null
      try {
        res = await loginApi(credentials)
      } catch (e) {
        // 后端登录失败，尝试本地注册表兜底
        const localRes = this._tryLocalLogin(credentials)
        if (!localRes) throw e
        res = localRes
      }
      this._applyLogin(res, 'user')
    },

    // ── 注册后自动登录（双写：后端 + 本地） ──
    async registerAndLogin(registerData) {
      const { username, password, email } = registerData
      const defaultNickname = username

      // 构造标准用户对象
      const newUser = {
        id: Date.now(),
        username,
        email: email || '',
        nickname: defaultNickname,
        avatar: '',
        phone: '',
        gender: 'other',
        birthday: '',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      }

      let res = null

      // 先尝试后端注册
      try {
        const { register: registerApi } = await import('../api/auth')
        res = await registerApi(registerData)
      } catch {
        // 后端注册失败（Vercel 冷启动重置等），用本地兜底
        const users = getLocalUsers()
        if (users.find(u => u.username === username)) {
          throw new Error('用户名已存在')
        }
        // 写入本地注册表
        newUser.password = hashPasswordSimple(password)
        users.push(newUser)
        saveLocalUsers(users)

        // 构造 mock 登录响应
        const { password: _, ...safeUser } = newUser
        res = {
          token: 'mock-local-token-' + newUser.id,
          refreshToken: 'mock-local-refresh-' + newUser.id,
          expiresIn: 86400 * 7,  // 7天有效期
          user: safeUser,
        }
      }

      this._applyLogin(res, 'user')
    },

    // ── 本地登录兜底 ──
    _tryLocalLogin({ username, password }) {
      const users = getLocalUsers()
      const user = users.find(
        u => u.username === username && u.password === hashPasswordSimple(password)
      )
      if (!user || user.status !== 'active') return null
      const { password: _, ...safeUser } = user
      return {
        token: 'mock-local-token-' + user.id,
        refreshToken: 'mock-local-refresh-' + user.id,
        expiresIn: 86400 * 7,
        user: safeUser,
      }
    },

    // ── 内部：应用登录响应 ──
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

    // ── 管理员登录 ──
    async adminLogin(credentials) {
      const res = await adminLoginApi(credentials)
      this._applyLogin(res, 'admin')
    },

    // ── 初始化认证状态（应用启动时调用） ──
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

    // ── 获取用户信息 ──
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
        // 后端不可用时静默忽略，不退出登录（因为可能是本地登录的用户）
      }
    },

    // ── 更新个人资料 ──
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
        // 同步更新本地注册表
        this._syncToLocal(data)
      } catch {
        // 即使后端失败也尝试本地更新
        this._syncToLocal(data)
        // 回滚
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

    // ── 同步到本地注册表 ──
    _syncToLocal(data) {
      if (!this.user?.id) return
      const users = getLocalUsers()
      const idx = users.findIndex(u => u.id === this.user.id)
      if (idx >= 0) {
        Object.assign(users[idx], data)
        saveLocalUsers(users)
      }
      // 同时更新内存中的 user 对象
      Object.assign(this.user, data)
      safeSet('user', { ...this.user })
    },

    // ── 退出登录 ──
    logout() {
      clearTokens()
      this._clearState()
    },

    // ── 内部：清除状态 ──
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
