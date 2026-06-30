const jsonServer = require('json-server')
const path = require('path')
const express = require('express')

const server = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

const isProduction = process.env.NODE_ENV === 'production'

server.use(middlewares)
server.use(jsonServer.bodyParser)

if (isProduction) {
  server.use(express.static(path.join(__dirname, 'dist')))
}
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

server.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const db = router.db.getState()
  const user = db.users.find(
    (u) => u.username === username && u.password === password
  )
  if (!user) return res.status(401).json({ message: '用户名或密码错误' })

  const { password: _, ...safeUser } = user
  res.json({ token: 'mock-jwt-token-' + user.id, user: safeUser })
})

server.get('/api/auth/userinfo', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  const user = db.users.find((u) => u.id === Number(id))
  if (!user) return res.status(401).json({ message: '用户不存在' })
  const { password: _, ...safeUser } = user
  res.json({ user: safeUser })
})

server.put('/api/auth/profile', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ message: '未登录' })
  const id = auth.replace('Bearer mock-jwt-token-', '')
  const db = router.db.getState()
  const idx = db.users.findIndex((u) => u.id === Number(id))
  if (idx === -1) return res.status(401).json({ message: '用户不存在' })
  const { password, ...rest } = req.body
  Object.assign(db.users[idx], rest)
  if (password) db.users[idx].password = password
  router.db.write()
  const { password: _, ...safeUser } = db.users[idx]
  res.json({ user: safeUser })
})

server.get('/api/dashboard/stats', (req, res) => {
  const db = router.db.getState()
  const userCount = db.users.length
  const productCount = db.products.length
  const orderCount = db.orders.length
  const activeUsers = db.users.filter((u) => u.status === 'active').length
  const totalRevenue = db.orders
    .filter((o) => o.status === 'completed')
    .reduce((s, o) => s + o.total, 0)
  const pendingOrders = db.orders.filter((o) => o.status === 'pending').length
  const lowStock = db.products.filter((p) => p.stock > 0 && p.stock < 20).length
  res.json({ userCount, productCount, orderCount, activeUsers, totalRevenue, pendingOrders, lowStock })
})

server.get('/api/dashboard/activities', (req, res) => {
  const db = router.db.getState()
  const activities = []
  db.users.slice(-5).reverse().forEach((u) => {
    activities.push({ type: '新增用户', content: `用户「${u.username}」已注册`, time: u.createdAt })
  })
  db.orders.slice(-5).reverse().forEach((o) => {
    const statusMap = { pending: '待处理', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
    activities.push({ type: '新订单', content: `订单 #${o.id} - ${o.userName} (${statusMap[o.status] || o.status})`, time: o.createdAt })
  })
  db.products.slice(-3).reverse().forEach((p) => {
    activities.push({ type: '产品更新', content: `产品「${p.name}」信息已更新`, time: p.createdAt || p.updatedAt })
  })
  activities.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  res.json(activities.slice(0, 10))
})

server.get('/api/dashboard/revenue', (req, res) => {
  const db = router.db.getState()
  const monthMap = {}
  db.orders.filter((o) => o.status === 'completed').forEach((o) => {
    const m = (o.createdAt || '').slice(0, 7)
    if (m) monthMap[m] = (monthMap[m] || 0) + o.total
  })
  const months = Object.keys(monthMap).sort()
  res.json({ months, values: months.map((m) => monthMap[m]) })
})

server.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    const resource = req.path.replace('/api/', '').split('?')[0]
    if ((resource === 'users' || resource === 'products' || resource === 'categories' || resource === 'orders') && req.query.keyword) {
      const db = router.db.getState()
      const keyword = req.query.keyword.toLowerCase()
      let filtered = db[resource].filter((item) =>
        Object.values(item).some(
          (v) => String(v).toLowerCase().includes(keyword)
        )
      )
      const total = filtered.length
      const page = Number(req.query.page) || 1
      const pageSize = Number(req.query.pageSize) || 20
      const start = (page - 1) * pageSize
      filtered = filtered.slice(start, start + pageSize)
      return res.json({ list: filtered, total })
    }
  }
  next()
})

server.use(jsonServer.rewriter({
  '/api/*': '/$1',
}))

server.use((req, res, next) => {
  const originalJson = res.json.bind(res)
  res.json = function (body) {
    if (Array.isArray(body)) {
      const page = Number(req.query._page) || 1
      const pageSize = Number(req.query._limit) || 20
      const start = (page - 1) * pageSize
      const items = body.slice(start, start + pageSize)
      return originalJson({
        list: items,
        total: body.length,
      })
    }
    return originalJson(body)
  }
  next()
})

server.use(router)

if (isProduction) {
  server.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API not found' })
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3001

function tryListen(port) {
  server.listen(port, () => {
    console.log('Mock API server running at http://localhost:' + port)
  })
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' in use, trying to free it...')
      const { execSync } = require('child_process')
      try {
        const result = execSync(
          'netstat -ano | findstr ":' + port + '"',
          { encoding: 'utf8', timeout: 3000 }
        )
        const lines = result.trim().split('\n')
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && pid !== '0') {
            try {
              execSync('taskkill /f /pid ' + pid, { stdio: 'ignore', timeout: 3000 })
              console.log('Killed process ' + pid)
            } catch (_) {}
          }
        }
      } catch (_) {}
      setTimeout(() => tryListen(port), 500)
    } else {
      console.error('Server error:', e)
    }
  })
}

tryListen(PORT)
