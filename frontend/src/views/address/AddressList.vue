<template>
  <div class="address-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">收货地址</h2>
        <p class="page-sub">最多可保存 20 个地址，默认地址会在下单时自动带入</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增地址</el-button>
    </div>

    <div v-loading="loading" class="card-wrap">
      <el-row :gutter="16">
        <el-col v-for="a in list" :key="a.id" :xs="24" :sm="12" :lg="8" class="addr-col">
          <div class="addr-card" :class="{ 'is-default': a.is_default === 1 }">
            <div class="addr-head">
              <span class="addr-name">{{ a.receiver }}</span>
              <el-tag v-if="a.is_default === 1" type="success" size="small" effect="dark" round>默认</el-tag>
            </div>
            <div class="addr-phone">{{ a.phone }}</div>
            <div class="addr-detail">{{ a.address }}</div>
            <div class="addr-ops">
              <el-button
                v-if="a.is_default !== 1"
                link
                type="primary"
                :loading="defaultLoading === a.id"
                @click="handleSetDefault(a)"
              >
                设为默认
              </el-button>
              <el-button link type="primary" :icon="Edit" @click="openEdit(a)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(a)">删除</el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && list.length === 0" description="还没有收货地址，先新增一个吧" />
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑收货地址' : '新增收货地址'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="收货人" prop="receiver">
          <el-input v-model="form.receiver" placeholder="请输入收货人姓名" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入 11 位手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="收货地址" prop="address">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="3"
            placeholder="省市区 + 详细地址，如：广东省深圳市南山区科技园 1 号楼 801"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.isDefault" :disabled="list.length === 0" />
          <span class="tip-text">{{ list.length === 0 ? '首个地址将自动成为默认地址' : '开启后其它地址的默认状态会被取消' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { addressApi } from '../../api';

const loading = ref(false);
const saving = ref(false);
const defaultLoading = ref(null);
const list = ref([]);
const dialogVisible = ref(false);
const formRef = ref(null);

const form = reactive({ id: null, receiver: '', phone: '', address: '', isDefault: false });

const rules = {
  receiver: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入 11 位手机号', trigger: 'blur' },
  ],
  address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
};

async function loadList() {
  loading.value = true;
  try {
    list.value = await addressApi.list();
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.id = null;
  form.receiver = '';
  form.phone = '';
  form.address = '';
  form.isDefault = false;
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(a) {
  form.id = a.id;
  form.receiver = a.receiver;
  form.phone = a.phone;
  form.address = a.address;
  form.isDefault = a.is_default === 1;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    const payload = {
      receiver: form.receiver.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      isDefault: form.isDefault,
    };
    if (form.id) {
      await addressApi.update(form.id, payload);
      ElMessage.success('地址已更新');
    } else {
      await addressApi.create(payload);
      ElMessage.success('地址已新增');
    }
    dialogVisible.value = false;
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    saving.value = false;
  }
}

async function handleSetDefault(a) {
  defaultLoading.value = a.id;
  try {
    await addressApi.setDefault(a.id);
    ElMessage.success('已设为默认地址');
    loadList();
  } catch {
    // 忽略，提示由拦截器处理
  } finally {
    defaultLoading.value = null;
  }
}

async function handleDelete(a) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${a.receiver} ${a.address}」这条收货地址吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    );
  } catch {
    return; // 用户取消
  }
  try {
    await addressApi.remove(a.id);
    ElMessage.success('地址已删除');
    loadList();
  } catch {
    // 忽略
  }
}

onMounted(loadList);
</script>

<style scoped>
.address-page {
  max-width: 1180px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  color: #1f2d3d;
}

.page-sub {
  margin: 0;
  font-size: 13px;
  color: #8c94a3;
}

.card-wrap {
  min-height: 160px;
}

.addr-col {
  margin-bottom: 16px;
}

.addr-card {
  position: relative;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 16px 18px;
  height: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.addr-card:hover {
  border-color: #c6dcff;
  box-shadow: 0 6px 18px rgba(22, 119, 255, 0.12);
}

.addr-card.is-default {
  border-color: #67c23a;
  background: linear-gradient(180deg, #f6ffed 0%, #ffffff 60%);
}

.addr-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.addr-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.addr-phone {
  font-size: 13px;
  color: #5b6472;
  margin-bottom: 6px;
}

.addr-detail {
  font-size: 13px;
  color: #5b6472;
  line-height: 1.6;
  min-height: 42px;
}

.addr-ops {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.tip-text {
  margin-left: 10px;
  font-size: 12px;
  color: #9aa1ae;
}
</style>
