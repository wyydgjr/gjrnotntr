<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-header">
        <span class="register-logo">◆</span>
        <h2>{{ $t('auth.register') }} VeStore</h2>
        <p class="register-sub">{{ $t('auth.register') }}</p>
      </div>

      <div class="register-error" v-if="error">{{ error }}</div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>{{ $t('auth.username') }} <span class="required">*</span></label>
          <div class="input-wrap">
            <input
              v-model="form.username"
              class="form-control"
              :class="{ 'form-control-error': fieldErrors.username }"
              :placeholder="$t('validation.minLength', { min: 2 })"
              required
            />
            <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
            <span v-else class="input-hint">{{ $t('validation.minLength', { min: 2 }) }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>{{ $t('auth.email') }}</label>
          <div class="input-wrap">
            <input
              v-model="form.email"
              class="form-control"
              :class="{ 'form-control-error': fieldErrors.email }"
              type="email"
              :placeholder="$t('auth.email')"
            />
            <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>{{ $t('auth.password') }}</label>
          <div class="input-wrap">
            <input
              v-model="form.password"
              class="form-control"
              type="password"
              :placeholder="$t('auth.password')"
              required
            />
            <span class="input-hint">{{ $t('validation.passwordRule') }}</span>
          </div>
        </div>
        <div class="form-group">
          <label>{{ $t('auth.confirmPassword') }}</label>
          <div class="input-wrap">
            <input
              v-model="form.confirm"
              class="form-control"
              type="password"
              :placeholder="$t('auth.confirmPassword')"
              required
            />
            <span
              v-if="form.confirm && form.password !== form.confirm"
              class="input-hint input-hint-error"
              >{{ $t('validation.passwordMismatch') }}</span
            >
          </div>
        </div>
        <button type="submit" class="btn btn-primary register-btn" :disabled="loading">
          {{ loading ? $t('common.loading') : $t('auth.register') }}
        </button>
      </form>
      <div class="register-footer">
        <span>{{ $t('auth.hasAccount') }}</span>
        <router-link to="/login" class="register-link">{{ $t('auth.login') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToastStore } from '../../stores/toast'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const toast = useToastStore()
const auth = useAuthStore()
const { t } = useI18n()

const form = ref({ username: '', email: '', password: '', confirm: '' })
const loading = ref(false)
const error = ref('')
const fieldErrors = ref({ username: '', email: '' })

async function handleRegister() {
  error.value = ''
  fieldErrors.value = { username: '', email: '' }
  if (!form.value.username.trim()) {
    error.value = t('validation.required')
    return
  }
  if (form.value.username.trim().length < 2) {
    fieldErrors.value.username = t('validation.minLength', { min: 2 })
    return
  }
  if (form.value.password !== form.value.confirm) {
    error.value = t('validation.passwordMismatch')
    return
  }
  if (form.value.password.length < 8) {
    error.value = t('validation.passwordMinLength', { min: 8 })
    return
  }
  if (
    !/[a-z]/.test(form.value.password) ||
    !/[A-Z]/.test(form.value.password) ||
    !/[0-9]/.test(form.value.password)
  ) {
    error.value = t('validation.passwordRule')
    return
  }
  loading.value = true
  try {
    // 使用 auth store 统一方法：注册 + 自动登录
    await auth.registerAndLogin({
      username: form.value.username.trim(),
      password: form.value.password,
      email: form.value.email.trim(),
    })
    toast.show(t('auth.registerSuccess'), 'success')
    router.push('/')
  } catch (e) {
    const msg = e.response?.data?.message || e.message || t('auth.loginFailed')
    if (msg.includes('用户名')) fieldErrors.value.username = msg
    else if (msg.includes('邮箱')) fieldErrors.value.email = msg
    else error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 40px 24px;
}
.register-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 40px;
  width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border);
}
.register-header {
  text-align: center;
  margin-bottom: 28px;
}
.register-logo {
  font-size: 36px;
  display: block;
  margin-bottom: 12px;
}
.register-header h2 {
  font-size: 22px;
  font-weight: 700;
}
.register-sub {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.input-hint {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}
.input-hint-error {
  color: var(--danger);
}

.register-btn {
  width: 100%;
  justify-content: center;
  padding: 10px;
  font-size: 15px;
  margin-top: 12px;
}
.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.register-error {
  color: #fff;
  background: var(--danger);
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
}
.field-error {
  font-size: 12px;
  color: var(--danger);
  margin-top: 2px;
}
.form-control-error {
  border-color: var(--danger) !important;
}
.required {
  color: var(--danger);
}
.register-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}
.register-link {
  color: var(--primary);
  text-decoration: none;
  margin-left: 4px;
}
.register-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
    padding: 24px;
  }
}
</style>
