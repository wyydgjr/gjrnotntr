import { defineStore } from 'pinia'
import { login as loginApi, getUserInfo, updateProfile as updateProfileApi } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },
  actions: {
    async login(credentials) {
      const res = await loginApi(credentials)
      this.token = res.token
      localStorage.setItem('token', res.token)
      this.user = res.user || null
    },
    async fetchUser() {
      try {
        const res = await getUserInfo()
        this.user = res.user || res
      } catch {
        this.logout()
      }
    },
    async updateProfile(data) {
      const res = await updateProfileApi(data)
      this.user = res.user || res
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    },
  },
})
