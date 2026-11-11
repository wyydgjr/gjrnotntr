<template>
  <div class="page-wrap">
    <!-- 搜索筛选区 -->
    <el-card shadow="never" class="toolbar">
      <el-form inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="商品名称/描述"
            clearable
            style="width: 220px"
            :prefix-icon="Search"
            @keyup.enter="loadList"
            @clear="loadList"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px" @change="loadList">
            <el-option label="上架" value="on" />
            <el-option label="下架" value="off" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="query.sort" placeholder="默认" style="width: 170px" @change="loadList">
            <el-option v-for="s in sortOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item class="pull-right">
          <el-button type="success" :icon="Plus" @click="openDialog()">新增商品</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商品表格 -->
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="product-cell">
              <div class="thumb" @click="goDetail(row)">
                <img v-if="row.image_url" :src="row.image_url" :alt="row.name" />
                <span v-else class="thumb-ph">{{ (row.category || '商').charAt(0) }}</span>
              </div>
              <div class="cell-main">
                <div class="cell-name link" :title="row.name" @click="goDetail(row)">{{ row.name }}</div>
                <div class="cell-desc">{{ row.description || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="110">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="110">
          <template #default="{ row }">
            <span class="price">¥{{ Number(row.price).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="100" sortable :sort-method="(a, b) => a.stock - b.stock">
          <template #default="{ row }">
            <el-tag :type="row.stock <= 10 ? (row.stock <= 0 ? 'danger' : 'warning') : 'success'" size="small" effect="light">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'on' ? 'success' : 'info'" size="small" effect="dark">
              {{ row.status === 'on' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="查看详情" placement="top">
              <el-button size="small" circle type="info" plain :icon="View" @click="goDetail(row)" />
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button size="small" circle type="primary" plain :icon="Edit" @click="openDialog(row)" />
            </el-tooltip>
            <el-tooltip :content="row.status === 'on' ? '下架' : '上架'" placement="top">
              <el-button
                size="small"
                circle
                :type="row.status === 'on' ? 'warning' : 'success'"
                plain
                :icon="row.status === 'on' ? Top : Bottom"
                @click="toggleStatus(row)"
              />
            </el-tooltip>
            <el-tooltip content="删除（已被订单引用的商品无法删除，请改为下架）" placement="top">
              <el-button size="small" circle type="danger" plain :icon="Delete" @click="removeProduct(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无商品数据" :image-size="90" />
        </template>
      </el-table>

      <el-pagination
        class="pager"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50]"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="商品名称" :prefix-icon="Goods" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="如：数码外设 / 生活家电 / 办公文具" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" :controls-position="'right'" style="width: 200px" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" :controls-position="'right'" style="width: 200px" />
        </el-form-item>
        <el-form-item label="图片地址" prop="image_url">
          <el-input v-model="form.image_url" placeholder="可选，填写图片 URL" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio value="on">上架</el-radio>
            <el-radio value="off">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Top, Bottom, Goods, View } from '@element-plus/icons-vue';
import { productApi } from '../../api';

const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const list = ref([]);
const dialogVisible = ref(false);
const formRef = ref(null);

const query = reactive({ keyword: '', status: '', page: 1, pageSize: 10, sort: 'newest' });
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

// 排序下拉（第二批新增）：值直传后端 sort 白名单
const sortOptions = [
  { label: '综合排序（最新）', value: 'newest' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
  { label: '库存从多到少', value: 'stock_desc' },
  { label: '库存从少到多', value: 'stock_asc' },
  { label: '销量从高到低', value: 'sales_desc' },
];

/** 跳转商品详情页 */
function goDetail(row) {
  router.push(`/product/${row.id}`);
}

const emptyForm = () => ({
  id: null,
  name: '',
  category: '其他',
  price: 0,
  stock: 0,
  image_url: '',
  status: 'on',
  description: '',
});
const form = reactive(emptyForm());

const rules = {
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度 2-50 个字符', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请输入商品分类', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'change' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'change' }],
};

async function loadList() {
  loading.value = true;
  try {
    const data = await productApi.list({ ...query });
    list.value = data.list || [];
    pagination.page = data.pagination.page;
    pagination.pageSize = data.pagination.pageSize;
    pagination.total = data.pagination.total;
  } catch {
    // 接口异常时清空列表，错误提示由请求拦截器统一弹出
    list.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.keyword = '';
  query.status = '';
  query.sort = 'newest';
  query.page = 1;
  loadList();
}

function onPageChange(page) {
  query.page = page;
  loadList();
}

function onSizeChange(size) {
  query.pageSize = size;
  query.page = 1;
  loadList();
}

function openDialog(row) {
  Object.assign(form, row ? { ...row } : emptyForm());
  dialogVisible.value = true;
}

async function onSave() {
  try {
    await formRef.value.validate();
  } catch {
    return; // 表单校验未通过，错误项已在表单内提示
  }
  saving.value = true;
  try {
    if (form.id) {
      await productApi.update(form.id, form);
      ElMessage.success('商品更新成功');
    } else {
      await productApi.create(form);
      ElMessage.success('商品创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(row) {
  const next = row.status === 'on' ? 'off' : 'on';
  try {
    await productApi.toggleStatus(row.id, next);
    ElMessage.success(next === 'on' ? '商品已上架' : '商品已下架');
    loadList();
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

async function removeProduct(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除商品「${row.name}」吗？已被订单引用的商品无法删除，可改为下架。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    );
  } catch {
    return; // 用户放弃删除
  }
  try {
    await productApi.remove(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch {
    // 后端会返回"已被订单引用，建议下架"，错误提示已由 axios 拦截器统一弹出
  }
}

onMounted(loadList);
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
  border-radius: 10px;
}

.toolbar :deep(.el-form-item) {
  margin-bottom: 0;
}

.pull-right {
  margin-left: auto;
}

.pager {
  margin-top: 14px;
  justify-content: flex-end;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-ph {
  color: #1677ff;
  font-size: 18px;
  font-weight: 600;
}

.cell-main {
  min-width: 0;
}

.cell-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-desc {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.price {
  color: #f5222d;
  font-weight: 600;
}

/* ========== 管理页细节 ========== */
.toolbar {
  border: 1px solid #eef0f4;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  transition: box-shadow 0.25s ease;
}

.toolbar::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, #1677ff, #36cfc9, transparent);
}

.toolbar:hover {
  box-shadow: 0 6px 18px rgba(15, 31, 77, 0.08);
}

.el-card {
  border-radius: 12px;
  border-color: #eef0f4;
}

.thumb {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 2px 6px rgba(15, 31, 77, 0.08);
}

.product-cell:hover .thumb {
  transform: scale(1.06);
}

.cell-name {
  color: #1f2329;
}

.price {
  font-family: 'Bahnschrift', 'Segoe UI', sans-serif;
}

/* 操作按钮微动效 */
.el-button.is-circle {
  transition: all 0.2s ease;
}

.el-button.is-circle:hover {
  transform: translateY(-2px) scale(1.08);
}

.el-button.is-circle:active {
  transform: scale(0.95);
}

/* ===== 渐变表头 + 行 hover ===== */
:deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(135deg, #f0f4ff 0%, #f7f9ff 100%);
  color: #4a5468;
  font-weight: 600;
}

:deep(.el-table .el-table__row) {
  transition: background 0.2s ease;
  animation: fadeInUp 0.35s ease both;
}

:deep(.el-table .el-table__row:nth-child(2)) { animation-delay: 0.03s; }
:deep(.el-table .el-table__row:nth-child(3)) { animation-delay: 0.06s; }
:deep(.el-table .el-table__row:nth-child(4)) { animation-delay: 0.09s; }
:deep(.el-table .el-table__row:nth-child(5)) { animation-delay: 0.12s; }
:deep(.el-table .el-table__row:nth-child(6)) { animation-delay: 0.15s; }
:deep(.el-table .el-table__row:nth-child(7)) { animation-delay: 0.18s; }
:deep(.el-table .el-table__row:nth-child(8)) { animation-delay: 0.21s; }
:deep(.el-table .el-table__row:nth-child(9)) { animation-delay: 0.24s; }
:deep(.el-table .el-table__row:nth-child(10)) { animation-delay: 0.27s; }

:deep(.el-table .el-table__row:hover > td.el-table__cell) {
  background: #f5f8ff;
}

/* ===== 缩略图质感升级 ===== */
.thumb {
  border: 1px solid #e3e9f2;
  border-radius: 10px;
  background: linear-gradient(135deg, #eef4ff, #f6f8ff);
}

.thumb-ph {
  background: linear-gradient(135deg, #1677ff, #36cfc9);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ===== 徽章统一圆润 ===== */
:deep(.el-table .el-tag) {
  border-radius: 999px;
  padding: 0 10px;
}

/* ========== 2026-11-04 · 商品管理质感升级 ========== */

/* 筛选卡片：玻璃质感 */
.toolbar {
  background: linear-gradient(180deg, #ffffff, #f8faff);
  border: 1px solid rgba(22, 119, 255, 0.09);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 10px 30px rgba(15, 31, 77, 0.06);
}

.toolbar::before {
  height: 3px;
  background: linear-gradient(90deg, #1677ff, #36cfc9 60%, #7b5cff);
}

/* 表格容器卡片 */
.page-wrap .el-card:not(.toolbar) {
  border-radius: 14px;
  border: 1px solid rgba(22, 119, 255, 0.09);
  box-shadow: 0 1px 2px rgba(15, 31, 77, 0.04), 0 10px 30px rgba(15, 31, 77, 0.06);
}

/* 表格：细分化 */
:deep(.el-table__header-wrapper th.el-table__cell) {
  background: linear-gradient(180deg, #f8faff 0%, #edf2fb 100%);
  letter-spacing: 0.4px;
}

:deep(.el-table .el-table__row:hover > td.el-table__cell) {
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.06), rgba(124, 92, 255, 0.03)) !important;
}

/* 缩略图 */
.thumb {
  border-radius: 12px;
  box-shadow: 0 3px 10px rgba(22, 119, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.product-cell:hover .thumb {
  transform: scale(1.08) rotate(-2deg);
}

/* 价格 */
.price {
  font-size: 15px;
  background: linear-gradient(90deg, #f43f5e, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 第二批新增：缩略图/名称可点击跳转详情 */
.thumb,
.cell-name.link {
  cursor: pointer;
}

.cell-name.link:hover {
  color: #1677ff;
  text-decoration: underline;
}
</style>
