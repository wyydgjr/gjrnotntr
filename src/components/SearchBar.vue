<template>
  <div class="search-bar">
    <input
      v-model="keyword"
      class="form-control"
      :placeholder="placeholder || '搜索...'"
      @keyup.enter="$emit('search', keyword)"
    />
    <button class="btn btn-primary" @click="$emit('search', keyword)">搜索</button>
    <button v-if="showReset && keyword" class="btn" @click="reset">重置</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  placeholder: String,
  showReset: { type: Boolean, default: true },
})
const emit = defineEmits(['search'])

const keyword = ref('')

function reset() {
  keyword.value = ''
  emit('search', '')
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.search-bar .form-control { width: 260px; }
</style>
