/**
 * JSONBin.io 数据持久化层
 *
 * JSONBin.io 是一个免费云端 JSON 存储服务，适合小规模项目。
 * 免费套餐：10 个 bins，每个最多 512KB，无限请求。
 *
 * 工作原理：
 * - 项目数据存储在一个 JSONBin bin 中
 * - 每次数据变更后自动同步到 JSONBin
 * - Vercel 冷启动时从 JSONBin 拉取最新数据
 * - 商城和 admin 共享同一个 bin（同一份数据源）
 *
 * 你需要在 JSONBin.io 注册后，把 API Key 和 Bin ID 填入下方。
 * 注册地址：https://jsonbin.io
 */

// ═══════════════ 配置（部署前请替换为你自己的 key） ═══════════════
// 1. 去 https://jsonbin.io 注册账号
// 2. 创建 API Key（Dashboard → API Keys）
// 3. 创建一个 Bin（POST /b），记下 Bin ID
// 4. 把 BIN_ID 和 MASTER_KEY 填到 Vercel 环境变量中：
//    JSONBIN_ID=你的bin-id
//    JSONBIN_MASTER_KEY=$2a$10$...

const JSONBIN_ID = process.env.JSONBIN_ID || '67e6f8a88a456b796683c6b5'
const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY || ''
const JSONBIN_BASE = 'https://api.jsonbin.io/v3'

// 是否启用 JSONBin（有 key 才启用）
const enabled = () => !!JSONBIN_MASTER_KEY

// 读取：从 JSONBin 拉取最新数据
async function read() {
  if (!enabled()) return null
  try {
    const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_MASTER_KEY },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.record
  } catch {
    return null
  }
}

// 写入：把数据推送到 JSONBin
async function write(data) {
  if (!enabled()) return false
  try {
    const res = await fetch(`${JSONBIN_BASE}/b/${JSONBIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_MASTER_KEY,
      },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch {
    return false
  }
}

export default { enabled, read, write }
