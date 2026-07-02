<template>
  <div class="profile-page">
    <div class="profile-layout">
      <!-- 左侧导航 -->
      <aside class="profile-sidebar">
        <div class="sidebar-user">
          <div class="sidebar-avatar" @click="activeTab = 'info'">
            <img v-if="user.avatar" :src="user.avatar" alt="" />
            <span v-else class="sidebar-avatar-letter">{{ avatarLetter }}</span>
          </div>
          <div class="sidebar-user-info">
            <h3>{{ user.username }}</h3>
            <p>{{ user.email || '未设置邮箱' }}</p>
          </div>
        </div>
        <nav class="sidebar-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="sidebar-nav-item"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 右侧内容 -->
      <div class="profile-content">
        <!-- 个人信息 -->
        <div v-if="activeTab === 'info'" class="content-card">
          <h2 class="card-title">👤 个人信息</h2>

          <!-- 头像上传 -->
          <div class="avatar-upload-section">
            <div class="avatar-upload" @click="triggerUpload">
              <img v-if="avatarPreview" :src="avatarPreview" class="avatar-upload-img" alt="" />
              <div v-else class="avatar-upload-placeholder">{{ avatarLetter }}</div>
              <div class="avatar-upload-overlay">
                <span>📷 更换头像</span>
              </div>
            </div>
            <div class="avatar-upload-hint">
              <p>点击头像上传新图片</p>
              <p class="hint-sub">支持 JPG、PNG、WebP，最大 5MB</p>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="file-hidden" @change="handleAvatarChange" />
          </div>

          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="editForm.username" class="form-control" :class="{ error: errors.username }" />
              <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="editForm.email" class="form-control" :class="{ error: errors.email }" type="email" />
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>
            <div class="form-group">
              <label>手机号</label>
              <input v-model="editForm.phone" class="form-control" :class="{ error: errors.phone }" />
              <span v-if="errors.phone" class="field-error">{{ errors.phone }}</span>
            </div>
            <div class="form-group">
              <label>性别</label>
              <div class="gender-options">
                <label class="gender-opt" :class="{ active: editForm.gender === 'male' }">
                  <input type="radio" v-model="editForm.gender" value="male" /> 👨 男
                </label>
                <label class="gender-opt" :class="{ active: editForm.gender === 'female' }">
                  <input type="radio" v-model="editForm.gender" value="female" /> 👩 女
                </label>
                <label class="gender-opt" :class="{ active: editForm.gender === 'other' }">
                  <input type="radio" v-model="editForm.gender" value="other" /> 🌈 保密
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>生日</label>
              <input v-model="editForm.birthday" class="form-control" type="date" />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存修改' }}
            </button>
          </form>
        </div>

        <!-- 收货地址 -->
        <div v-if="activeTab === 'address'" class="content-card">
          <div class="card-header">
            <h2 class="card-title">📍 收货地址</h2>
            <button class="btn btn-primary btn-sm" @click="openAddrForm()">+ 新增地址</button>
          </div>

          <div v-if="!showAddrForm" class="addr-list">
            <div v-for="addr in addresses" :key="addr.id" class="addr-card">
              <div class="addr-card-top">
                <span class="addr-name">{{ addr.name }}</span>
                <span class="addr-phone">{{ addr.phone }}</span>
                <span v-if="addr.isDefault" class="addr-tag">默认</span>
              </div>
              <div class="addr-card-detail">
                {{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}
              </div>
              <div class="addr-card-actions">
                <button class="btn btn-sm" @click="editAddr(addr)">编辑</button>
                <button v-if="!addr.isDefault" class="btn btn-sm" @click="setDefault(addr)">设为默认</button>
                <button class="btn btn-sm btn-danger" @click="delAddr(addr)">删除</button>
              </div>
            </div>
            <div v-if="!addresses.length" class="empty-state">暂无收货地址，点击上方按钮添加</div>
          </div>

          <div v-else class="addr-form-wrap">
            <h3>{{ editingAddr ? '编辑地址' : '新增地址' }}</h3>
            <form @submit.prevent="saveAddr" class="addr-form">
              <div class="form-row">
                <div class="form-group">
                  <label>收件人 *</label>
                  <input v-model="addrForm.name" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>手机号 *</label>
                  <input v-model="addrForm.phone" class="form-control" required />
                </div>
              </div>
              <div class="form-row form-row-3">
                <div class="form-group">
                  <label>省 *</label>
                  <input v-model="addrForm.province" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>市 *</label>
                  <input v-model="addrForm.city" class="form-control" required />
                </div>
                <div class="form-group">
                  <label>区</label>
                  <input v-model="addrForm.district" class="form-control" />
                </div>
              </div>
              <div class="form-group">
                <label>详细地址 *</label>
                <input v-model="addrForm.detail" class="form-control" required />
              </div>
              <div class="form-group-inline">
                <label><input type="checkbox" v-model="addrForm.isDefault" /> 设为默认地址</label>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="addrSaving">
                  {{ addrSaving ? '保存中...' : '保存' }}
                </button>
                <button type="button" class="btn" @click="showAddrForm = false">取消</button>
              </div>
            </form>
          </div>
        </div>

        <!-- 修改密码 -->
        <div v-if="activeTab === 'password'" class="content-card">
          <h2 class="card-title">🔒 修改密码</h2>
          <form @submit.prevent="changePassword" class="profile-form" style="max-width: 420px">
            <div class="form-group">
              <label>新密码</label>
              <input v-model="pwdForm.newPassword" class="form-control" :class="{ error: pwdErrors.newPassword }" type="password" placeholder="8位以上，含大小写字母和数字" />
              <span v-if="pwdErrors.newPassword" class="field-error">{{ pwdErrors.newPassword }}</span>
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="pwdForm.confirmPassword" class="form-control" :class="{ error: pwdErrors.confirmPassword }" type="password" />
              <span v-if="pwdErrors.confirmPassword" class="field-error">{{ pwdErrors.confirmPassword }}</span>
            </div>
            <p v-if="pwdMsg" class="pwd-msg" :class="pwdMsgType">{{ pwdMsg }}</p>
            <button type="submit" class="btn btn-primary" :disabled="changingPwd">
              {{ changingPwd ? '修改中...' : '更新密码' }}
            </button>
          </form>
        </div>

        <!-- 账户统计 -->
        <div v-if="activeTab === 'stats'" class="content-card">
          <h2 class="card-title">📊 账户统计</h2>
          <div class="stats-grid">
            <div class="stat-card" @click="activeTab = 'orders'">
              <span class="stat-value">{{ stats.orderCount }}</span>
              <span class="stat-label">我的订单</span>
            </div>
            <div class="stat-card" @click="$router.push('/wishlist')">
              <span class="stat-value">{{ stats.wishlistCount }}</span>
              <span class="stat-label">收藏商品</span>
            </div>
            <div class="stat-card" @click="$router.push('/coupons')">
              <span class="stat-value">{{ stats.couponCount }}</span>
              <span class="stat-label">优惠券</span>
            </div>
            <div class="stat-card" @click="activeTab = 'address'">
              <span class="stat-value">{{ stats.addressCount }}</span>
              <span class="stat-label">收货地址</span>
            </div>
          </div>
          <div class="user-meta">
            <p>注册时间：{{ formatDate(user.createdAt) }}</p>
            <p>账号角色：{{ user.role === 'admin' ? '管理员' : '普通用户' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { profileSchema } from '../../utils/validation-schemas'
import { getAddresses, saveAddress, deleteAddress } from '../../api/address'
import request from '../../api/request'

const { t } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()
const $router = useRouter()

const user = computed(() => auth.user || {})
const avatarLetter = computed(() => (user.value?.username || 'U').charAt(0).toUpperCase())

const activeTab = ref('info')
const fileInput = ref(null)
const avatarPreview = ref(user.value?.avatar || '')
const saving = ref(false)
const pageReady = ref(true)  // 页面默认就绪，不阻塞渲染

const tabs = [
  { key: 'info', label: '个人信息', icon: '👤' },
  { key: 'address', label: '收货地址', icon: '📍' },
  { key: 'password', label: '修改密码', icon: '🔒' },
  { key: 'stats', label: '账户统计', icon: '📊' },
]

// ── 基本信息表单 ──
const editForm = reactive({
  username: user.value?.username || '',
  email: user.value?.email || '',
  phone: user.value?.phone || '',
  gender: user.value?.gender || 'other',
  birthday: user.value?.birthday || '',
})
const errors = reactive({ username: '', email: '', phone: '' })

// ── 头像上传 ──
function triggerUpload() {
  fileInput.value?.click()
}

async function handleAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.show('图片大小不能超过 5MB', 'error')
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
    toast.show('头像更新成功', 'success')
  } catch {
    const reader = new FileReader()
    reader.onload = (ev) => {
      avatarPreview.value = ev.target.result
      request.put('/auth/profile', { avatar: ev.target.result }).catch(() => {})
      auth.user.avatar = ev.target.result
    }
    reader.readAsDataURL(file)
    toast.show('头像已本地保存', 'success')
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
      gender: editForm.gender,
      birthday: editForm.birthday,
    })
    toast.show('保存成功', 'success')
  } catch (e) {
    toast.show(e.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

// ── 地址管理 ──
const addresses = ref([])
const showAddrForm = ref(false)
const editingAddr = ref(null)
const addrSaving = ref(false)
const addrForm = reactive({
  name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false,
})

function openAddrForm() { showAddrForm.value = true; editingAddr.value = null }
function editAddr(a) {
  editingAddr.value = a
  Object.assign(addrForm, a)
  showAddrForm.value = true
}
async function saveAddr() {
  addrSaving.value = true
  try {
    const data = { ...addrForm }
    if (editingAddr.value) data.id = editingAddr.value.id
    await saveAddress(data)
    toast.show('保存成功', 'success')
    showAddrForm.value = false
    editingAddr.value = null
    Object.assign(addrForm, { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false })
    await loadAddresses()
  } catch { toast.show('保存失败', 'error') }
  addrSaving.value = false
}
async function setDefault(a) {
  try {
    await saveAddress({ ...a, isDefault: true })
    toast.show('已设为默认', 'success')
    await loadAddresses()
  } catch { toast.show('操作失败', 'error') }
}
async function delAddr(a) {
  if (!confirm(`删除 ${a.name} 的地址？`)) return
  try {
    await deleteAddress(a.id)
    toast.show('已删除', 'success')
    await loadAddresses()
  } catch { toast.show('删除失败', 'error') }
}
async function loadAddresses() {
  try { addresses.value = await getAddresses() } catch {}
}

// ── 修改密码 ──
const changingPwd = ref(false)
const pwdMsg = ref('')
const pwdMsgType = ref('')
const pwdForm = reactive({ newPassword: '', confirmPassword: '' })
const pwdErrors = reactive({ newPassword: '', confirmPassword: '' })

async function changePassword() {
  pwdErrors.newPassword = ''
  pwdErrors.confirmPassword = ''
  pwdMsg.value = ''
  if (!pwdForm.newPassword) { pwdErrors.newPassword = '请输入新密码'; return }
  if (pwdForm.newPassword.length < 8) { pwdErrors.newPassword = '密码至少 8 个字符'; return }
  if (!/[a-z]/.test(pwdForm.newPassword) || !/[A-Z]/.test(pwdForm.newPassword) || !/[0-9]/.test(pwdForm.newPassword)) {
    pwdErrors.newPassword = '密码必须包含大小写字母和数字'; return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) { pwdErrors.confirmPassword = '两次密码不一致'; return }
  changingPwd.value = true
  try {
    await request.put('/auth/profile', { password: pwdForm.newPassword })
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdMsg.value = '密码修改成功'
    pwdMsgType.value = 'success'
    toast.show('密码修改成功', 'success')
  } catch (e) {
    pwdMsg.value = e.message || '修改失败'
    pwdMsgType.value = 'error'
  } finally { changingPwd.value = false }
}

// ── 统计 ──
const stats = reactive({ orderCount: 0, wishlistCount: 0, couponCount: 0, addressCount: 0 })
async function loadStats() {
  try {
    const [ordersRes, wishlistRes, couponsRes, addressesRes] = await Promise.allSettled([
      request.get('/orders'), request.get('/wishlist'),
      request.get('/coupons'), request.get('/addresses'),
    ])
    if (ordersRes.status === 'fulfilled') {
      const list = ordersRes.value.list || ordersRes.value || []
      stats.orderCount = Array.isArray(list) ? list.length : 0
    }
    if (wishlistRes.status === 'fulfilled') {
      const list = wishlistRes.value.list || wishlistRes.value || []
      stats.wishlistCount = Array.isArray(list) ? list.length : 0
    }
    if (couponsRes.status === 'fulfilled') {
      const list = couponsRes.value.list || couponsRes.value || []
      stats.couponCount = Array.isArray(list) ? list.length : 0
    }
    if (addressesRes.status === 'fulfilled') {
      const list = addressesRes.value.list || addressesRes.value || []
      stats.addressCount = Array.isArray(list) ? list.length : 0
    }
  } catch {}
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.slice(0, 10)
}

onMounted(() => {
  // 异步加载，失败不阻塞页面渲染
  loadAddresses().catch(() => {})
  loadStats().catch(() => {})
})
</script>

<style scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}
.profile-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 28px;
  align-items: start;
}

/* ── 侧边栏 ── */
.profile-sidebar {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  position: sticky;
  top: 80px;
}
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px;
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-bottom: 1px solid var(--border);
}
.sidebar-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sidebar-avatar-letter {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
}
.sidebar-user-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}
.sidebar-user-info p {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}
.sidebar-nav {
  padding: 8px;
}
.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.sidebar-nav-item:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--text);
}
.sidebar-nav-item.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}
.nav-icon { font-size: 16px; flex-shrink: 0; }

/* ── 右侧内容 ── */
.profile-content {
  min-width: 0;
}
.content-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px;
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header .card-title {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* ── 头像上传 ── */
.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.avatar-upload {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar-upload-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-upload-placeholder {
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
.avatar-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}
.avatar-upload:hover .avatar-upload-overlay {
  opacity: 1;
}
.avatar-upload-hint p {
  font-size: 14px;
  color: var(--text);
}
.avatar-upload-hint .hint-sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.file-hidden { display: none; }

/* ── 表单 ── */
.profile-form { max-width: 480px; }
.form-group { margin-bottom: 18px; }
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.form-control:focus { border-color: var(--primary); }
.form-control.error { border-color: var(--danger); }
.field-error { font-size: 12px; color: var(--danger); margin-top: 4px; display: block; }

.gender-options {
  display: flex;
  gap: 12px;
}
.gender-opt {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.15s;
}
.gender-opt input { display: none; }
.gender-opt.active {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(99, 102, 241, 0.05);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form-row-3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.form-group-inline {
  margin-bottom: 18px;
}
.form-group-inline label {
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-actions { display: flex; gap: 10px; margin-top: 16px; }

/* ── 按钮 ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}
.btn:hover { background: var(--bg-hover, #f1f5f9); }
.btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn-primary:hover { background: var(--primary-hover, #4f46e5); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-sm { padding: 6px 14px; font-size: 13px; }
.btn-danger { color: var(--danger); border-color: var(--danger); }
.btn-danger:hover { background: #fef2f2; }

/* ── 地址列表 ── */
.addr-list { display: flex; flex-direction: column; gap: 12px; }
.addr-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
.addr-card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.addr-name { font-weight: 600; font-size: 15px; }
.addr-phone { color: var(--text-secondary); font-size: 14px; }
.addr-tag { font-size: 11px; background: var(--primary); color: #fff; padding: 2px 8px; border-radius: 4px; }
.addr-card-detail { font-size: 14px; color: var(--text-secondary); margin-bottom: 10px; }
.addr-card-actions { display: flex; gap: 8px; }
.addr-form-wrap h3 { font-size: 16px; font-weight: 600; margin-bottom: 18px; }
.addr-form { max-width: 560px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-secondary); font-size: 14px; }

/* ── 密码 ── */
.pwd-msg { font-size: 13px; padding: 8px 12px; border-radius: 6px; margin-top: 8px; }
.pwd-msg.success { background: #f0fdf4; color: #16a34a; }
.pwd-msg.error { background: #fef2f2; color: #dc2626; }

/* ── 统计 ── */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 16px;
  background: var(--bg);
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.15s;
  border: 1px solid transparent;
}
.stat-card:hover { transform: translateY(-2px); border-color: var(--primary); }
.stat-value { font-size: 26px; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.user-meta { padding-top: 16px; border-top: 1px solid var(--border); }
.user-meta p { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }

/* ── 响应式 ── */
@media (max-width: 768px) {
  .profile-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .profile-sidebar { position: static; }
  .sidebar-nav { display: flex; flex-wrap: wrap; gap: 4px; }
  .sidebar-nav-item { width: auto; flex: 1; min-width: 80px; justify-content: center; font-size: 12px; padding: 10px 8px; }
  .sidebar-user { padding: 16px; }
  .form-row, .form-row-3 { grid-template-columns: 1fr; }
  .gender-options { flex-direction: column; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .avatar-upload-section { flex-direction: column; text-align: center; }
}
@media (max-width: 480px) {
  .profile-page { padding: 16px 12px 40px; }
  .content-card { padding: 20px; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
</style>
