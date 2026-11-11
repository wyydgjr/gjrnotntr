<template>
  <div class="settings-page">
    <h2 class="page-title">个人设置</h2>
    <p class="page-sub">修改昵称与登录密码，密码修改后需使用新密码重新登录</p>

    <el-row :gutter="20">
      <!-- 修改昵称 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="set-card">
          <template #header>
            <div class="card-head">
              <el-icon><User /></el-icon>
              <span>基本资料</span>
            </div>
          </template>

          <div class="current-row">
            <span class="label">当前账号</span>
            <span class="value">{{ userStore.userInfo?.username || '-' }}</span>
            <el-tag size="small" :type="userStore.role === 'admin' ? 'danger' : 'success'" effect="plain">
              {{ userStore.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </div>

          <el-form ref="nickFormRef" :model="nickForm" :rules="nickRules" label-width="90px">
            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="nickForm.nickname"
                placeholder="请输入昵称"
                maxlength="50"
                show-word-limit
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="nickSaving" @click="submitNickname">保存昵称</el-button>
              <el-button @click="resetNickname">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 修改密码 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="set-card">
          <template #header>
            <div class="card-head">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </div>
          </template>

          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少 6 位，且不能与原密码相同" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="pwdSaving" @click="submitPassword">修改密码</el-button>
              <el-button @click="resetPassword">重置</el-button>
            </el-form-item>
          </el-form>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="安全提示"
            description="密码使用 bcrypt 加盐哈希存储，服务器不保存明文；修改成功后当前登录态会被清除，请用新密码重新登录。"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { authApi } from '../../api';
import { useUserStore } from '../../stores/user';

const router = useRouter();
const userStore = useUserStore();

const nickFormRef = ref(null);
const pwdFormRef = ref(null);
const nickSaving = ref(false);
const pwdSaving = ref(false);

const nickForm = reactive({ nickname: '' });
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

const nickRules = {
  nickname: [
    { required: true, message: '昵称不能为空', trigger: 'blur' },
    { max: 50, message: '昵称不能超过 50 个字符', trigger: 'blur' },
  ],
};

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '新密码长度需为 6-64 位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value && value === pwdForm.oldPassword) {
          callback(new Error('新密码不能与原密码相同'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的新密码不一致'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

function resetNickname() {
  nickForm.nickname = userStore.userInfo?.nickname || '';
}

async function submitNickname() {
  if (!nickFormRef.value) return;
  try {
    await nickFormRef.value.validate();
  } catch {
    return;
  }
  nickSaving.value = true;
  try {
    const user = await authApi.updateProfile({ nickname: nickForm.nickname.trim() });
    // 同步本地登录态：先写入接口返回，再拉取一次 profile 落盘 localStorage，顶栏/侧边栏昵称立即刷新
    userStore.userInfo = { ...(userStore.userInfo || {}), ...user };
    await userStore.refreshProfile();
    ElMessage.success('昵称修改成功');
  } catch {
    // 提示由请求拦截器统一处理
  } finally {
    nickSaving.value = false;
  }
}

function resetPassword() {
  pwdForm.oldPassword = '';
  pwdForm.newPassword = '';
  pwdForm.confirmPassword = '';
  pwdFormRef.value?.clearValidate();
}

async function submitPassword() {
  if (!pwdFormRef.value) return;
  try {
    await pwdFormRef.value.validate();
  } catch {
    return;
  }
  pwdSaving.value = true;
  try {
    await authApi.changePassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword,
    });
    ElMessage.success('密码修改成功，请使用新密码重新登录');
    resetPassword();
    // 密码已变更：清除本地登录态并回到登录页，避免使用旧 token 继续操作
    userStore.logout();
    router.push('/login');
  } catch {
    // 原密码错误等业务提示由拦截器弹出
  } finally {
    pwdSaving.value = false;
  }
}

onMounted(() => {
  resetNickname();
  // 拉取最新资料，保证昵称展示与数据库一致
  userStore.refreshProfile?.();
});
</script>

<style scoped>
.settings-page {
  max-width: 1100px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  color: #1f2d3d;
}

.page-sub {
  margin: 0 0 16px;
  font-size: 13px;
  color: #8c94a3;
}

.set-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #1f2d3d;
}

.current-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
}

.current-row .label {
  color: #8c94a3;
}

.current-row .value {
  color: #1f2d3d;
  font-weight: 600;
}
</style>
