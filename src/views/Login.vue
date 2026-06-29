<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">◆</span>
        <h2>Ve Admin</h2>
        <p class="login-sub">管理后台</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            class="form-control"
            placeholder="请输入用户名"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            class="form-control"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="error" class="login-error">{{ error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
      <div class="login-footer">
        <span>默认账号: admin / admin123</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

onMounted(() => {
  if (auth.isLoggedIn) router.push('/')
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 40px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,.15);
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-logo {
  font-size: 36px;
  display: block;
  margin-bottom: 12px;
}
.login-header h2 { font-size: 22px; font-weight: 700; }
.login-sub { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
.login-btn {
  width: 100%;
  justify-content: center;
  padding: 10px;
  font-size: 15px;
  margin-top: 8px;
}
.login-btn:disabled { opacity: .7; cursor: not-allowed; }
.login-error {
  color: var(--danger);
  font-size: 13px;
  margin-bottom: 12px;
  text-align: center;
}
.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
