/**
 * ============================================================
 * 文件作用：前端应用入口——挂载 Pinia / Router / Element Plus
 * 讲解一句话：Vue3 应用的启动点，全局注册图标并安装三大核心插件。
 * 答辩点：先注册 Pinia（状态管理）再注册 Router（路由）；Element Plus 使用中文语言包并统一组件尺寸。
 * ============================================================
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';

const app = createApp(App);

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(createPinia());
app.use(router);
// 组件尺寸统一：default 为全站标准尺寸，避免混用 large/small 造成的视觉割裂
app.use(ElementPlus, { locale: zhCn, size: 'default' });

app.mount('#app');
