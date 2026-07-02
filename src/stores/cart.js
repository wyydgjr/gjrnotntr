import { defineStore } from 'pinia'
import request from '../api/request'

const STORAGE_KEY = 've_cart_items'

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocal(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // quota exceeded, silently ignore
  }
}

/**
 * 购物车 Store
 * - 本地持久化兜底（localStorage）
 * - 登录后自动同步到服务端
 * - 防抖同步，避免频繁请求
 * - 修正合并策略：本地优先，服务端补充
 */
export const useCartStore = defineStore('cart', {
  state: () => ({
    items: loadLocal(),
    _syncTimer: null,
  }),

  getters: {
    count: (state) => state.items.reduce((s, i) => s + i.qty, 0),
    total: (state) => state.items.reduce((s, i) => s + i.price * i.qty, 0),
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    add(product, qty = 1) {
      const existing = this.items.find((i) => i.productId === product.id)
      if (existing) {
        existing.qty += qty
      } else {
        this.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image || '',
          qty,
        })
      }
      this._persist()
    },

    updateQty(productId, qty) {
      if (qty <= 0) {
        this.remove(productId)
        return
      }
      const item = this.items.find((i) => i.productId === productId)
      if (item) {
        item.qty = qty
        this._persist()
      }
    },

    remove(productId) {
      this.items = this.items.filter((i) => i.productId !== productId)
      this._persist()
    },

    clear() {
      this.items = []
      this._persist()
    },

    // ── 本地持久化 + 防抖服务端同步 ──
    _persist() {
      saveLocal(this.items)
      this._debouncedSync()
    },

    _debouncedSync() {
      if (this._syncTimer) clearTimeout(this._syncTimer)
      this._syncTimer = setTimeout(() => {
        this._syncTimer = null
        this.syncToServer()
      }, 500)
    },

    async syncToServer() {
      try {
        await request.put('/cart', this.items)
      } catch {
        // 静默失败，本地数据仍保留
      }
    },

    /**
     * 从服务端加载购物车并合并
     * 策略：本地数据为准，服务端数据补充本地没有的商品
     */
    async loadFromServer() {
      try {
        const serverItems = await request.get('/cart')
        if (!serverItems || !serverItems.length) return

        const localIds = new Set(this.items.map((i) => i.productId))
        let changed = false

        for (const si of serverItems) {
          if (localIds.has(si.productId)) {
            // 本地已有，取数量最大值（防止数据丢失）
            const local = this.items.find((i) => i.productId === si.productId)
            if (local && si.qty > local.qty) {
              local.qty = si.qty
              changed = true
            }
          } else {
            // 本地没有，从服务端补充
            this.items.push(si)
            changed = true
          }
        }

        if (changed) {
          saveLocal(this.items)
        }
      } catch {
        // 静默失败
      }
    },
  },
})
