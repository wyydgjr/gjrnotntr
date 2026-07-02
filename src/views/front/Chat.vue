<template>
  <div class="chat-page">
    <h1>在线客服</h1>
    <div class="chat-box">
      <div class="chat-msgs" ref="msgBox">
        <div
          v-for="m in messages"
          :key="m.id"
          class="chat-msg"
          :class="m.role === 'admin' ? 'msg-admin' : 'msg-user'"
        >
          <div class="msg-bubble">{{ m.content }}</div>
          <div class="msg-time">{{ (m.createdAt || '').slice(11, 16) }}</div>
        </div>
      </div>
      <div class="chat-input">
        <input v-model="text" class="form-control" placeholder="输入消息..." @keyup.enter="send" />
        <button class="btn btn-primary" @click="send">发送</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, nextTick } from 'vue'
import request from '../../api/request'
const messages = ref([])
const text = ref('')
const msgBox = ref(null)
onMounted(async () => {
  try {
    messages.value = await request.get('/chat/messages')
  } catch {}
  setTimeout(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  }, 100)
})
async function send() {
  if (!text.value.trim()) return
  try {
    const msg = await request.post('/chat/messages', { content: text.value, role: 'user' })
    messages.value.push(msg)
    text.value = ''
    nextTick(() => {
      if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
    })
    setTimeout(async () => {
      try {
        const reply = await request.post('/chat/messages', {
          content: '您好，我是客服小Ve，请问有什么可以帮您？',
          role: 'admin',
        })
        messages.value.push(reply)
        nextTick(() => {
          if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
        })
      } catch {}
    }, 800)
  } catch {}
}
</script>
<style scoped>
.chat-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px 24px;
}
.chat-page h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
}
.chat-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.chat-msgs {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-msg {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.msg-user {
  align-self: flex-end;
  align-items: flex-end;
}
.msg-admin {
  align-self: flex-start;
  align-items: flex-start;
}
.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.msg-user .msg-bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.msg-admin .msg-bubble {
  background: var(--bg);
  border-bottom-left-radius: 4px;
}
.msg-time {
  font-size: 11px;
  color: var(--text-secondary);
}
.chat-input {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid var(--border);
}
</style>
