import express from 'express'
const router = express.Router()

// 日志类型
const logTypes = {
  login: { name: '登录', name_en: 'Login', icon: 'key', color: '#409eff' },
  logout: { name: '登出', name_en: 'Logout', icon: 'switch-button', color: '#909399' },
  control: { name: '设备控制', name_en: 'Control', icon: 'setting', color: '#67c23a' },
  config: { name: '配置变更', name_en: 'Config', icon: 'edit', color: '#e6a23c' },
  alert: { name: '告警操作', name_en: 'Alert', icon: 'warning', color: '#f56c6c' },
  user: { name: '用户管理', name_en: 'User', icon: 'user', color: '#9c27b0' },
  system: { name: '系统操作', name_en: 'System', icon: 'monitor', color: '#00d2ff' }
}

// Mock日志数据
const mockLogs = [
  { id: 1, type: 'login', userId: 1, username: 'admin', action: '用户登录', action_en: 'User logged in', ip: '192.168.1.100', details: '登录成功', timestamp: '2026-04-17T08:30:00Z' },
  { id: 2, type: 'control', userId: 1, username: 'admin', action: '调整空调温度', action_en: 'Adjust AC temperature', ip: '192.168.1.100', details: '1号空调: 24°C -> 26°C', timestamp: '2026-04-17T08:45:00Z' },
  { id: 3, type: 'control', userId: 1, username: 'admin', action: '开关灯光', action_en: 'Toggle lights', ip: '192.168.1.100', details: '大厅主灯: 关闭', timestamp: '2026-04-17T09:00:00Z' },
  { id: 4, type: 'alert', userId: 1, username: 'admin', action: '确认告警', action_en: 'Acknowledge alert', ip: '192.168.1.100', details: '告警ID: 2 - B栋能耗超标', timestamp: '2026-04-17T09:30:00Z' },
  { id: 5, type: 'config', userId: 1, username: 'admin', action: '修改系统设置', action_en: 'Modify settings', ip: '192.168.1.100', details: '刷新频率: 10s -> 30s', timestamp: '2026-04-17T10:00:00Z' },
  { id: 6, type: 'user', userId: 1, username: 'admin', action: '创建用户', action_en: 'Create user', ip: '192.168.1.100', details: '新用户: operator', timestamp: '2026-04-16T15:20:00Z' },
  { id: 7, type: 'logout', userId: 1, username: 'admin', action: '用户登出', action_en: 'User logged out', ip: '192.168.1.100', details: '正常登出', timestamp: '2026-04-16T18:00:00Z' },
  { id: 8, type: 'login', userId: 2, username: 'user', action: '用户登录', action_en: 'User logged in', ip: '192.168.1.101', details: '登录成功', timestamp: '2026-04-16T09:00:00Z' },
  { id: 9, type: 'control', userId: 2, username: 'user', action: '预约车位', action_en: 'Reserve parking', ip: '192.168.1.101', details: '预约B2-05车位', timestamp: '2026-04-16T09:15:00Z' },
  { id: 10, type: 'alert', userId: 2, username: 'user', action: '查看告警', action_en: 'View alert', ip: '192.168.1.101', details: '查看告警详情', timestamp: '2026-04-16T09:30:00Z' },
  { id: 11, type: 'system', userId: null, username: 'system', action: '系统启动', action_en: 'System started', ip: 'localhost', details: '后端服务启动成功', timestamp: '2026-04-16T08:00:00Z' },
  { id: 12, type: 'alert', userId: null, username: 'system', action: '自动告警', action_en: 'Auto alert', ip: 'localhost', details: '触发条件: 温度超过26°C', timestamp: '2026-04-17T10:15:00Z' },
  { id: 13, type: 'control', userId: 1, username: 'admin', action: '批量控制', action_en: 'Batch control', ip: '192.168.1.100', details: '关闭所有灯光', timestamp: '2026-04-15T20:00:00Z' },
  { id: 14, type: 'config', userId: 1, username: 'admin', action: '更新阈值', action_en: 'Update threshold', ip: '192.168.1.100', details: '能耗警告阈值: 120% -> 130%', timestamp: '2026-04-15T14:30:00Z' },
  { id: 15, type: 'user', userId: 1, username: 'admin', action: '更新用户', action_en: 'Update user', ip: '192.168.1.100', details: '更新用户权限', timestamp: '2026-04-14T11:00:00Z' }
]

// 获取日志列表
router.get('/logs', async (req, res) => {
  try {
    const { type, username, startDate, endDate, keyword, page = 1, pageSize = 20 } = req.query

    let filtered = [...mockLogs]

    if (type) {
      filtered = filtered.filter(l => l.type === type)
    }
    if (username) {
      filtered = filtered.filter(l => l.username.includes(username))
    }
    if (startDate) {
      filtered = filtered.filter(l => l.timestamp >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(l => l.timestamp <= endDate)
    }
    if (keyword) {
      filtered = filtered.filter(l =>
        l.action.includes(keyword) ||
        l.details.includes(keyword) ||
        l.action_en.includes(keyword)
      )
    }

    // 按时间倒序
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    const total = filtered.length
    const start = (parseInt(page) - 1) * parseInt(pageSize)
    const items = filtered.slice(start, start + parseInt(pageSize))

    res.json({
      success: true,
      data: {
        items,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        pages: Math.ceil(total / parseInt(pageSize))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 日志统计
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = mockLogs.filter(l => l.timestamp.startsWith(today))

    // 获取最近7天的数据
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7Days.push({
        date: dateStr,
        count: mockLogs.filter(l => l.timestamp.startsWith(dateStr)).length
      })
    }

    // 用户活动统计
    const userActivity = {}
    mockLogs.forEach(log => {
      if (log.username !== 'system') {
        userActivity[log.username] = (userActivity[log.username] || 0) + 1
      }
    })

    const stats = {
      total: mockLogs.length,
      today: todayLogs.length,
      byType: Object.keys(logTypes).map(key => ({
        type: key,
        ...logTypes[key],
        count: mockLogs.filter(l => l.type === key).length
      })),
      last7Days,
      userActivity: Object.entries(userActivity).map(([username, count]) => ({
        username,
        count
      })).sort((a, b) => b.count - a.count)
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 导出日志
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query

    let filtered = [...mockLogs]

    if (startDate) {
      filtered = filtered.filter(l => l.timestamp >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(l => l.timestamp <= endDate)
    }

    // 添加类型名称
    filtered = filtered.map(log => ({
      ...log,
      typeName: logTypes[log.type]?.name || log.type,
      typeNameEn: logTypes[log.type]?.name_en || log.type
    }))

    if (format === 'csv') {
      const headers = ['ID', '类型', 'Type', '用户', '操作', 'Action', 'IP', '详情', '时间']
      const csvRows = [headers.join(',')]

      filtered.forEach(log => {
        csvRows.push([
          log.id,
          log.typeName,
          log.typeNameEn,
          log.username,
          log.action,
          log.action_en,
          log.ip,
          `"${log.details}"`,
          log.timestamp
        ].join(','))
      })

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`)
      res.send(csvRows.join('\n'))
    } else {
      res.json({
        success: true,
        data: filtered,
        exportedAt: new Date().toISOString(),
        total: filtered.length
      })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
