import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import { testConnection, initDatabase } from './config/database.js'
import dashboardRoutes from './routes/dashboard.js'
import acRoutes from './routes/ac.js'
import settingsRoutes from './routes/settings.js'
import energyRoutes from './routes/energy.js'
import authRoutes from './routes/auth.js'
import deviceRoutes from './routes/device.js'
import controlRoutes from './routes/control.js'
import energyMonitorRoutes from './routes/energy-monitor.js'
import portalRoutes from './routes/portal.js'
import alertsRoutes from './routes/alerts.js'
import auditRoutes from './routes/audit.js'
import { auditLogger } from './middleware/auditLogger.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// 中间件
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务 - 让上传的文件可通过 /uploads/ 路径访问
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Disposition', 'inline')
  next()
}, express.static(path.resolve(__dirname, '../public/uploads')))

// 设置响应头字符集（仅对 API 路由设置，静态文件由 express.static 自动处理 Content-Type）
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    return next()
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

// 请求日志
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`)
  next()
})

// 审计日志中间件 - 自动记录所有API请求
app.use(auditLogger)

// API 路由
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/ac', acRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/energy', energyRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/device', deviceRoutes)
app.use('/api/control', controlRoutes)
app.use('/api/energy-monitor', energyMonitorRoutes)
app.use('/api/portal', portalRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/audit', auditRoutes)

// 将 io 实例保存到 app 中，供路由使用
app.set('io', io)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'System is running', timestamp: new Date().toISOString() })
})

// Socket.IO 实时通信
io.on('connection', (socket) => {
  console.log('🔌 客户端连接:', socket.id)

  // 定时发送设备状态更新
  const deviceInterval = setInterval(() => {
    socket.emit('deviceUpdate', {
      timestamp: new Date().toISOString(),
      acDevices: getMockACDevices(),
      lightingCircuits: getMockLightingCircuits()
    })
  }, 5000)

  // 模拟告警推送 - 每30秒随机生成一个告警
  const alertInterval = setInterval(() => {
    const alertTypes = ['temperature', 'occupancy', 'motion', 'offline', 'energy']
    const alertLevels = ['critical', 'warning', 'info']
    const locations = ['1楼大厅', '2楼办公区', '3楼会议室', '地下车库', '室外']
    const devices = ['ac-001', 'ac-002', 'cam-001', 'energy-001']
    const deviceNames = ['1号空调', '2号空调', '摄像头1', '能耗监测']

    const randomIndex = Math.floor(Math.random() * alertTypes.length)
    const mockAlert = {
      id: `ALT-${Date.now()}`,
      type: alertTypes[randomIndex],
      level: alertLevels[Math.floor(Math.random() * alertLevels.length)],
      status: 'pending',
      title: `模拟告警 / Mock Alert ${Date.now()}`,
      message: `来自 ${locations[randomIndex]} 的模拟告警`,
      location: locations[randomIndex],
      deviceId: devices[randomIndex],
      deviceName: deviceNames[randomIndex],
      value: Math.random() * 100,
      threshold: 50,
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      notes: ''
    }

    // 推送新告警到所有连接的客户端
    socket.emit('newAlert', mockAlert)
  }, 30000)

  // 客户端可以订阅特定类型的告警
  socket.on('subscribeAlerts', (data) => {
    console.log('📡 客户端订阅告警:', socket.id, data)
    socket.join('alerts')
  })

  // 客户端取消订阅
  socket.on('unsubscribeAlerts', () => {
    socket.leave('alerts')
  })

  socket.on('disconnect', () => {
    console.log('❌ 客户端断开:', socket.id)
    clearInterval(deviceInterval)
    clearInterval(alertInterval)
  })
})

// 模拟数据生成函数
function getMockACDevices() {
  return [
    { id: 'ac-001', name: '1号空调', location: '1楼大厅', status: 'on', temperature: 24, power: 1200, energyToday: 28.5 },
    { id: 'ac-002', name: '2号空调', location: '2楼办公区', status: 'on', temperature: 23, power: 1500, energyToday: 35.2 },
    { id: 'ac-003', name: '3号空调', location: '3楼会议室', status: 'off', temperature: 26, power: 0, energyToday: 12.8 },
    { id: 'ac-004', name: '4号空调', location: '地下车库', status: 'on', temperature: 22, power: 800, energyToday: 18.6 }
  ]
}

function getMockLightingCircuits() {
  return [
    { id: 'L001', name: '大厅主灯', status: 'on', brightness: 80, power: 400 },
    { id: 'L002', name: '大厅辅灯', status: 'off', brightness: 60, power: 0 },
    { id: 'L003', name: '办公区主灯', status: 'on', brightness: 100, power: 600 },
    { id: 'L004', name: '地下车库灯', status: 'on', brightness: 60, power: 800 }
  ]
}

// 前端静态文件服务（生产环境部署时使用）
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
const appDist = path.resolve(__dirname, '../public/app')
// 优先检查 appDist（Docker 部署时构建产物在这里），否则用 frontendDist
const servePath = fs.existsSync(appDist) ? appDist : (fs.existsSync(frontendDist) ? frontendDist : null)
if (servePath) {
  // 前端静态资源
  app.use('/assets', express.static(path.join(servePath, 'assets'), { maxAge: '7d' }))
  app.use(express.static(servePath, { index: false }))
  // SPA fallback: 所有非 API/非静态文件请求返回 index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(servePath, 'index.html'))
    }
  })
  console.log(`📁 前端静态文件目录: ${servePath}`)
}

// 错误处理
app.use((err, req, res, next) => {
  console.error('❌ 服务器错误:', err)
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  })
})

// 启动服务器
const PORT = process.env.PORT || 4000
const DEPLOY_VERSION = '2026042014' // 部署版本标记

async function startServer() {
  // 测试数据库连接
  const dbConnected = await testConnection()
  
  if (dbConnected) {
    // 初始化数据库表
    await initDatabase()
  } else {
    console.log('⚠️  数据库连接失败，将使用模拟数据运行')
  }

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║     AI预测节能管理系统后端服务已启动                 ║
║     AI Energy Management System Backend Running    ║
╠═══════════════════════════════════════════════════╣
║  🚀 服务器地址: http://localhost:${PORT}              ║
║  🔌 Socket.IO: ws://localhost:${PORT}                ║
║  📊 健康检查: http://localhost:${PORT}/api/health    ║
╚═══════════════════════════════════════════════════╝
    `)
  })
}

startServer()
