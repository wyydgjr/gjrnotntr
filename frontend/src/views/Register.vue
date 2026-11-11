<template>
  <div class="auth-page">
    <div class="auth-shell">
      <!-- 左侧品牌区 -->
      <div class="brand-panel">
        <div class="brand-glow b1"></div>
        <div class="brand-glow b2"></div>
        <div class="brand-glow b3"></div>
        <span class="brand-pill"><el-icon :size="13"><Medal /></el-icon>云商优选 · 商家后台</span>
        <div class="brand-logo">
          <el-icon :size="34" color="#fff"><ShoppingBag /></el-icon>
        </div>
        <h1 class="brand-title">云商优选后台</h1>
        <p class="brand-slogan">注册新账号 · 开启专属购物体验</p>
        <ul class="brand-features">
          <li><el-icon><CircleCheck /></el-icon>简单三步完成注册</li>
          <li><el-icon><UserFilled /></el-icon>注册即可浏览全站商品</li>
          <li><el-icon><DataLine /></el-icon>订单状态实时可查</li>
        </ul>
        <div class="brand-stats">
          <div class="mini-stat"><strong>10万+</strong><span>在售商品</span></div>
          <div class="mini-stat"><strong>99.9%</strong><span>正品保障</span></div>
          <div class="mini-stat"><strong>7×24</strong><span>专属客服</span></div>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-panel">
        <span class="form-pill">CREATE ACCOUNT</span>
        <h2 class="form-title">创建账号</h2>
        <p class="form-subtitle">填写以下信息完成注册</p>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名（登录使用）" :prefix-icon="User" clearable />
          </el-form-item>
          <el-form-item prop="nickname">
            <el-input v-model="form.nickname" placeholder="昵称（选填）" :prefix-icon="Postcard" clearable />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码（至少 6 位）" show-password :prefix-icon="Lock" />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" show-password :prefix-icon="Lock" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="onSubmit">
              注 册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="footer">
          已有账号？
          <router-link to="/login" class="link">直接登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Postcard, ShoppingBag, CircleCheck, UserFilled, DataLine, Medal } from '@element-plus/icons-vue';
import { authApi } from '../api';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref(null);
const loading = ref(false);
const form = reactive({ username: '', nickname: '', password: '', confirmPassword: '' });

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'));
        else callback();
      },
      trigger: 'blur',
    },
  ],
};

async function onSubmit() {
  try {
    await formRef.value.validate();
  } catch {
    return; // 表单校验未通过，错误项已在表单内提示
  }
  loading.value = true;
  try {
    await authApi.register({
      username: form.username,
      password: form.password,
      nickname: form.nickname || form.username,
    });
    ElMessage.success('注册成功，正在自动登录...');
    const data = await authApi.login({ username: form.username, password: form.password });
    userStore.setLogin(data.token, data.user);
    ElMessage.success('登录成功，正在进入首页');
    router.push(data.user.role === 'admin' ? '/dashboard' : '/shop');
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #0f1035 0%, #312e81 42%, #1677ff 82%, #06b6d4 100%);
}

/* ===== 背景光斑 ===== */
.auth-page::before,
.auth-page::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.auth-page::before {
  width: 560px;
  height: 560px;
  top: -180px;
  left: -140px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.55) 0%, transparent 70%);
  animation: floatY 7s ease-in-out infinite;
}

.auth-page::after {
  width: 480px;
  height: 480px;
  bottom: -170px;
  right: -120px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, transparent 70%);
  animation: floatY 8s ease-in-out infinite reverse;
}

/* ===== 玻璃外壳 ===== */
.auth-shell {
  width: 980px;
  max-width: 100%;
  min-height: 650px;
  display: flex;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.26);
  box-shadow: 0 28px 72px rgba(6, 12, 46, 0.5);
  animation: fadeInUp 0.55s ease both;
}

/* ===== 左侧品牌区 ===== */
.brand-panel {
  flex: 1.2;
  position: relative;
  overflow: hidden;
  color: #fff;
  padding: 40px 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(160deg, #312e81 0%, #6366f1 48%, #06b6d4 100%);
}

.brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  pointer-events: none;
}

.brand-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.brand-glow.b1 {
  width: 320px;
  height: 320px;
  right: -90px;
  top: -110px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 70%);
}

.brand-glow.b2 {
  width: 240px;
  height: 240px;
  left: -70px;
  bottom: 20px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.5) 0%, transparent 70%);
}

.brand-glow.b3 {
  width: 160px;
  height: 160px;
  right: 40px;
  bottom: -60px;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.35) 0%, transparent 70%);
}

.brand-pill {
  position: absolute;
  top: 26px;
  left: 34px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 999px;
}

.brand-logo {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 22px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  animation: floatY 3.5s ease-in-out infinite;
}

.brand-title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}

.brand-slogan {
  font-size: 14px;
  opacity: 0.88;
  margin-bottom: 30px;
  letter-spacing: 0.4px;
}

.brand-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.brand-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  opacity: 0.95;
  transition: transform 0.25s ease;
  animation: fadeInUp 0.5s ease both;
}

.brand-features li:nth-child(2) { animation-delay: 0.08s; }
.brand-features li:nth-child(3) { animation-delay: 0.16s; }

.brand-features li:hover {
  transform: translateX(6px);
}

.brand-features li .el-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
}

/* 品牌底部指标条 */
.brand-stats {
  display: flex;
  gap: 12px;
  margin-top: 34px;
}

.mini-stat {
  flex: 1;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 12px 8px;
  text-align: center;
  animation: fadeInUp 0.55s ease both;
}

.mini-stat strong {
  display: block;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
}

.mini-stat span {
  font-size: 12px;
  opacity: 0.82;
}

/* ===== 右侧表单区 ===== */
.form-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 44px 46px;
  background: rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.form-pill {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  font-size: 11px;
  letter-spacing: 2.5px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.28);
  padding: 5px 13px;
  border-radius: 999px;
  margin-bottom: 18px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.form-subtitle {
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  margin-bottom: 26px;
}

.form-panel :deep(.el-input__wrapper) {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), 0 3px 10px rgba(6, 12, 46, 0.08);
  padding: 5px 14px;
  transition: box-shadow 0.25s ease;
}

.form-panel :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.45), 0 3px 12px rgba(6, 12, 46, 0.12);
}

.form-panel :deep(.el-input__prefix .el-icon) {
  color: #6366f1;
  font-size: 16px;
}

.form-panel :deep(.el-form-item) {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 999px;
  letter-spacing: 6px;
  font-weight: 600;
  font-size: 15px;
  background: linear-gradient(90deg, #6366f1 0%, #1677ff 100%);
  box-shadow: 0 8px 22px rgba(99, 102, 241, 0.35);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.5);
}

.footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
  margin-top: 6px;
  font-size: 14px;
}

.link {
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  position: relative;
  transition: color 0.2s;
}

.link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 2px;
  border-radius: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}

.link:hover {
  color: #a5e8ff;
}

.link:hover::after {
  transform: scaleX(1);
}

@media (max-width: 820px) {
  .brand-panel {
    display: none;
  }
  .auth-shell {
    width: 440px;
  }
  .form-panel {
    padding: 36px 28px;
  }
}

/* ========== 2026-11-04 · 注册页质感升级 ========== */

/* ---- 背景：星尘网格 + 更丰富的深色渐变 ---- */
.auth-page {
  background:
    radial-gradient(900px 600px at 20% -10%, rgba(99, 102, 241, 0.4), transparent 65%),
    radial-gradient(700px 500px at 90% 110%, rgba(6, 182, 212, 0.32), transparent 65%),
    linear-gradient(135deg, #070b2e 0%, #1b1f6e 38%, #2f3bc4 70%, #0e7490 100%);
}

.auth-page::before {
  background: radial-gradient(circle, rgba(129, 140, 248, 0.5) 0%, transparent 70%);
  animation: floatY 8s ease-in-out infinite;
}

.auth-page::after {
  background: radial-gradient(circle, rgba(34, 211, 238, 0.45) 0%, transparent 70%);
}

/* ---- 外壳：更深邃的玻璃 ---- */
.auth-shell {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(32px) saturate(170%);
  -webkit-backdrop-filter: blur(32px) saturate(170%);
  box-shadow: 0 40px 100px rgba(4, 8, 40, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* ---- 品牌区：光效扫过 ---- */
.brand-panel {
  background:
    radial-gradient(420px 320px at 90% -5%, rgba(255, 255, 255, 0.2), transparent 70%),
    linear-gradient(165deg, #312e81 0%, #6366f1 46%, #06b6d4 100%);
}

.brand-panel::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 90px;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: translateX(-160%) skewX(-18deg);
  animation: shineSweep 6s ease-in-out infinite;
  pointer-events: none;
}

.brand-logo {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.08));
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.brand-title {
  font-size: 32px;
  background: linear-gradient(90deg, #ffffff, #c7d2fe);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mini-stat {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.32);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.mini-stat strong {
  background: linear-gradient(90deg, #fff, #a5f3fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ---- 表单区：更实的玻璃白 ---- */
.form-panel {
  background: rgba(255, 255, 255, 0.94);
  border-left: 1px solid rgba(255, 255, 255, 0.45);
}

.form-pill {
  color: #6366f1;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border: 1px solid #c7d2fe;
}

.form-title {
  font-size: 30px;
  background: linear-gradient(90deg, #1677ff, #7b5cff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.form-subtitle {
  color: #7a8499;
}

.form-panel :deep(.el-input__wrapper) {
  background: #fbfcfe;
  box-shadow: 0 0 0 1px #e3e8f2 inset, 0 2px 6px rgba(15, 31, 77, 0.04);
}

.form-panel :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4) inset, 0 6px 18px rgba(99, 102, 241, 0.12);
}

.form-panel :deep(.el-input__prefix .el-icon) {
  color: #6366f1;
}

.submit-btn {
  background: linear-gradient(90deg, #1677ff 0%, #6366f1 55%, #7b5cff 100%);
  background-size: 180% 180%;
  box-shadow: 0 10px 28px rgba(99, 102, 241, 0.4);
}

.submit-btn:hover {
  background-position: 100% 50%;
  box-shadow: 0 14px 36px rgba(99, 102, 241, 0.55);
}

.footer {
  color: #7a8499;
}

.link {
  color: #1677ff;
}

.link:hover {
  color: #7b5cff;
}
</style>
