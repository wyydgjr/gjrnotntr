/**
 * ============================================================
 * 文件作用：购物车 Pinia Store（第二批新增，答辩重点）
 * 讲解一句话：购物车从"页面内存数组"升级为"全局 Store + localStorage 持久化"，刷新/切页不丢，且库存上限在 Store 层统一兜底。
 * 答辩点：① 状态集中管理，任何页面（商城/详情页）都能加购，无需组件间传参；
 *         ② localStorage 持久化，纯前端方案，无需新增购物车表，降低后端复杂度；
 *         ③ 数量变更统一走 setQuantity/increase，夹取在 [1, stock] 区间，防止超出库存下单被后端拒绝。
 * ============================================================
 */
import { defineStore } from 'pinia';

const STORAGE_KEY = 'yunshang_cart';

/** 读取本地缓存（容错：脏数据/被手工改成非数组时回退为空车） */
function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((it) => it && Number.isInteger(Number(it.id)))
      .map((it) => ({
        id: Number(it.id),
        name: String(it.name ?? ''),
        price: Number(it.price) || 0,
        stock: Number(it.stock) || 0,
        category: it.category || '',
        image_url: it.image_url || null,
        quantity: Math.max(1, Math.min(Number(it.quantity) || 1, Math.max(Number(it.stock) || 1, 1))),
      }));
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: readCache(),
  }),

  getters: {
    /** 商品总件数（用于角标） */
    count: (state) => state.items.reduce((sum, it) => sum + it.quantity, 0),
    /** 合计金额（字符串，保留两位） */
    total: (state) => state.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
    /** 下单用明细（只提交 productId + quantity） */
    orderItems: (state) => state.items.map((it) => ({ productId: it.id, quantity: it.quantity })),
  },

  actions: {
    /** 每次变更后落盘，保证刷新不丢 */
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {
        // 隐私模式/配额满时忽略，购物车仍可在本次会话内使用
      }
    },

    /** 加入购物车；返回 'added' | 'increased' | 'limit' | 'soldout' */
    add(product) {
      const id = Number(product.id);
      const stock = Number(product.stock) || 0;
      if (stock <= 0) return 'soldout';

      const exist = this.items.find((it) => it.id === id);
      if (exist) {
        if (exist.quantity >= stock) return 'limit';
        exist.quantity += 1;
        exist.stock = stock; // 同步最新库存
        exist.price = Number(product.price) || exist.price;
      } else {
        this.items.push({
          id,
          name: product.name,
          price: Number(product.price) || 0,
          stock,
          category: product.category || '',
          image_url: product.image_url || null,
          quantity: 1,
        });
      }
      this.persist();
      return exist ? 'increased' : 'added';
    },

    /** 设置指定商品数量，自动夹取到 [1, stock] */
    setQuantity(id, quantity) {
      const it = this.items.find((x) => x.id === id);
      if (!it) return;
      const max = Math.max(it.stock, 1);
      const qty = Math.min(Math.max(Math.floor(Number(quantity) || 1), 1), max);
      it.quantity = qty;
      this.persist();
    },

    increase(id) {
      const it = this.items.find((x) => x.id === id);
      if (!it) return;
      this.setQuantity(id, it.quantity + 1);
    },

    decrease(id) {
      const it = this.items.find((x) => x.id === id);
      if (!it) return;
      this.setQuantity(id, it.quantity - 1);
    },

    /** 删除单个商品 */
    remove(id) {
      this.items = this.items.filter((it) => it.id !== id);
      this.persist();
    },

    /** 清空购物车（下单成功后调用） */
    clear() {
      this.items = [];
      this.persist();
    },

    /** 下单成功后移除已下单的商品（保留加购失败未提交的其它项场景） */
    removeMany(ids) {
      const set = new Set((ids || []).map(Number));
      this.items = this.items.filter((it) => !set.has(it.id));
      this.persist();
    },
  },
});
