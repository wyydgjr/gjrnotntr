<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1 class="page-title">{{ $t('profile.personalCenter') }}</h1>

      <!-- 头像区域 -->
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar-wrapper" @click="triggerUpload">
            <img v-if="avatarPreview" :src="avatarPreview" class="avatar-img" alt="avatar" />
            <div v-else class="avatar-placeholder">{{ avatarLetter }}</div>
            <div class="avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <div class="avatar-info">
            <h3>{{ user.username }}</h3>
            <p class="user-role">{{ user.role === 'admin' ? $t('profile.admin') : $t('profile.member') }}</p>
            <p class="user-join">{{ $t('profile.joined') }}: {{ formatDate(user.createdAt) }}</p>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="file-input-hidden"
            @change="handleAvatarChange"
          />
        </div>
      </div>

      <!-- 基本信息编辑 -->
      <div class="profile-card">
        <h2 class="card-title">{{ $t('profile.basicInfo') }}</h2>
        <form @submit.prevent="saveProfile">
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('auth.username') }}</label>
              <input
                v-model="editForm.username"
                class="form-control"
                :class="{ 'form-control-error': errors.username }"
                :placeholder="$t('auth.username')"
              />
              <p v-if="errors.username" class="field-error">{{ errors.username }}</p>
            </div>
            <div class="form-group">
              <label>{{ $t('auth.email') }}</label>
              <input
                v-model="editForm.email"
                class="form-control"
                :class="{ 'form-control-error': errors.email }"
                type="email"
                :placeholder="$t('auth.email')"
              />
              <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('auth.phone') }}</label>
              <input
                v-model="editForm.phone"
                class="form-control"
                :class="{ 'form-control-error': errors.phone }"
                :placeholder="$t('auth.phone')"
              />
              <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? $t('common.loading') : $t('common.save') }}
            </button>
          </div>
        </form>
      </div>

      <!-- 修改密码 -->
      <div class="profile-card">
        <h2 class="card-title">{{ $t('profile.changePassword') }}</h2>
        <form @submit.prevent="changePassword">
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('profile.newPassword') }}</label>
              <input
                v-model="pwdForm.newPassword"
                class="form-control"
                :class="{ 'form-control-error': pwdErrors.newPassword }"
                type="password"
                :placeholder="$t('profile.newPasswordPlaceholder')"
              />
              <p v-if="pwdErrors.newPassword" class="field-error">{{ pwdErrors.newPassword }}</p>
            </div>
            <div class="form-group">
              <label>{{ $t('profile.confirmNewPassword') }}</label>
              <input
                v-model="pwdForm.confirmPassword"
                class="form-control"
                :class="{ 'form-control-error': pwdErrors.confirmPassword }"
                type="password"
                :placeholder="$t('auth.confirmPassword')"
              />
              <p v-if="pwdErrors.confirmPassword" class="field-error">{{ pwdErrors.confirmPassword }}</p>
            </div>
          </div>
          <p v-if="pwdMsg" class="pwd-msg" :class="pwdMsgType">{{ pwdMsg }}</p>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="changingPwd">
              {{ changingPwd ? $t('common.loading') : $t('profile.updatePassword') }}
            </button>
          </div>
        </form>
      </div>

      <!-- 账号统计 -->
      <div class="profile-card">
        <h2 class="card-title">{{ $t('profile.accountStats') }}</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ stats.orderCount }}</span>
            <span class="stat-label">{{ $t('nav.orders') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.wishlistCount }}</span>
            <span class="stat-label">{{ $t('nav.wishlist') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.couponCount }}</span>
            <span class="stat-label">{{ $t('nav.coupons') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.addressCount }}</span>
            <span class="stat-label">{{ $t('nav.addresses') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { profileSchema } from '../../utils/validation-schemas'
import request from '../../api/request'

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()

const user = computed(() => auth.user)
const avatarLetter = computed(() => (user.value?.username || 'U').charAt(0).toUpperCase())

const fileInput = ref(null)
const avatarPreview = ref(user.value?.avatar || '')
const saving = ref(false)
const changingPwd = ref(false)
const pwdMsg = ref('')
const pwdMsgType = ref('')

const editForm = reactive({
  username: user.value?.username || '',
  email: user.value?.email || '',
  phone: user.value?.phone || '',
})

const errors = reactive({ username: '', email: '', phone: '' })

const pwdForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

const pwdErrors = reactive({ newPassword: '', confirmPassword: '' })

const stats = reactive({
  orderCount: 0,
  wishlistCount: 0,
  couponCount: 0,
  addressCount: 0,
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.show(t('upload.hint'), 'error')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await request.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    avatarPreview.value = res.url
    await request.put('/auth/profile', { avatar: res.url })
    auth.user.avatar = res.url
    toast.show(t('profile.avatarUpdated'), 'success')
  } catch {
    // 降级：使用 base64 本地预览
    const reader = new FileReader()
    reader.onload = (ev) => {
      avatarPreview.value = ev.target.result
      request.put('/auth/profile', { avatar: ev.target.result }).catch(() => {})
      auth.user.avatar = ev.target.result
    }
    reader.readAsDataURL(file)
    toast.show(t('profile.avatarLocal'), 'success')
  }
}

async function saveProfile() {
  errors.username = ''
  errors.email = ''
  errors.phone = ''

  const result = profileSchema.safeParse({
    username: editForm.username,
    email: editForm.email,
    phone: editForm.phone,
  })

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (field === 'username') errors.username = issue.message
      if (field === 'email') errors.email = issue.message
      if (field === 'phone') errors.phone = issue.message
    }
    return
  }

  saving.value = true
  try {
    await auth.updateProfile({
      username: editForm.username,
      email: editForm.email,
      phone: editForm.phone,
    })
    toast.show(t('common.success'), 'success')
  } catch (e) {
    toast.show(e.message || t('common.failed'), 'error')
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  pwdErrors.newPassword = ''
  pwdErrors.confirmPassword = ''
  pwdMsg.value = ''

  if (!pwdForm.newPassword) {
    pwdErrors.newPassword = t('validation.required')
    return
  }
  if (pwdForm.newPassword.length < 8) {
    pwdErrors.newPassword = t('validation.passwordMinLength', { min: 8 })
    return
  }
  if (
    !/[a-z]/.test(pwdForm.newPassword) ||
    !/[A-Z]/.test(pwdForm.newPassword) ||
    !/[0-9]/.test(pwdForm.newPassword)
  ) {
    pwdErrors.newPassword = t('validation.passwordRule')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    pwdErrors.confirmPassword = t('validation.passwordMismatch')
    return
  }

  changingPwd.value = true
  try {
    await request.put('/auth/profile', { password: pwdForm.newPassword })
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdMsg.value = t('profile.passwordChanged')
    pwdMsgType.value = 'pwd-msg-success'
    toast.show(t('profile.passwordChanged'), 'success')
  } catch (e) {
    pwdMsg.value = e.message || t('common.failed')
    pwdMsgType.value = 'pwd-msg-error'
  } finally {
    changingPwd.value = false
  }
}

async function loadStats() {
  try {
    const [ordersRes, wishlistRes, couponsRes, addressesRes] = await Promise.allSettled([
      request.get('/orders/my'),
      request.get('/wishlist'),
      request.get('/user/coupons'),
      request.get('/addresses'),
    ])
    if (ordersRes.status === 'fulfilled') stats.orderCount = (ordersRes.value.list || ordersRes.value).length || 0
    if (wishlistRes.status === 'fulfilled') stats.wishlistCount = (wishlistRes.value.list || wishlistRes.value).length || 0
    if (couponsRes.status === 'fulfilled') stats.couponCount = (couponsRes.value.list || couponsRes.value).length || 0
    if (addressesRes.status === 'fulfilled') stats.addressCount = (addressesRes.value.list || addressesRes.value).length || 0
  } catch {
    // stats remain 0
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.profile-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 28px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.card-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

/* ── 头像区域 ── */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}
.avatar-wrapper {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 32px;
  font-weight: 700;
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 24px;
}
.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}
.avatar-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}
.user-role {
  font-size: 13px;
  color: var(--primary);
  margin-top: 2px;
}
.user-join {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.file-input-hidden {
  display: none;
}

/* ── 表单 ── */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}
.form-control {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
}
.form-control:focus {
  border-color: var(--primary);
}
.form-control-error {
  border-color: var(--danger) !important;
}
.field-error {
  font-size: 12px;
  color: var(--danger);
}
.form-actions {
  margin-top: 8px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover {
  background: var(--primary-hover);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── 密码消息 ── */
.pwd-msg {
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}
.pwd-msg-success {
  background: #f0fdf4;
  color: #16a34a;
}
.pwd-msg-error {
  background: #fef2f2;
  color: #dc2626;
}

/* ── 统计 ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
@media (max-width: 500px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: var(--bg);
  border-radius: 10px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
