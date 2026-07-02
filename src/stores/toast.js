import { defineStore } from 'pinia'

let nextId = 1

export const useToastStore = defineStore('toast', {
  state: () => ({
    messages: [],
  }),

  actions: {
    show(message, type = 'info', duration = 3000) {
      const id = nextId++
      const item = { id, message, type }
      this.messages.push(item)

      if (duration > 0) {
        setTimeout(() => {
          this.remove(id)
        }, duration)
      }

      return id
    },

    remove(id) {
      this.messages = this.messages.filter(m => m.id !== id)
    },

    clear() {
      this.messages = []
    },
  },
})
