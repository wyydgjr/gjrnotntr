// Vitest 测试环境初始化
// 解决 Node 24 + vitest 4 + axios 的兼容性问题

import { vi } from 'vitest'

// 提供 axios 需要的浏览器全局 API
if (typeof globalThis.XMLHttpRequest === 'undefined') {
  globalThis.XMLHttpRequest = class {
    constructor() {
      this.readyState = 0
      this.status = 0
      this.responseText = ''
    }
    open() {}
    send() {}
    setRequestHeader() {}
    abort() {}
    getResponseHeader() {
      return null
    }
    getAllResponseHeaders() {
      return ''
    }
  }
}

if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = class {
    append() {}
  }
}
