import express from 'express'
const router = express.Router()

// 告警类型
const alertTypes = {
  temperature: { name: '温度异常', name_en: 'Temperature', icon: 'thermometer', color: '#f56c6c' },
  occupancy: { name: '车位已满', name_en: 'Parking Full', icon: 'truck', color: '#e6a23c' },
  motion: { name: '异常移动', name_en: 'Motion', icon: 'video-camera', color: '#9c27b0' },
  offline: { name: '设备离线', name_en: 'Offline', icon: 'close', color: '#909399' },
  energy: { name: '能耗超标', name_en: 'Energy Overuse', icon: 'lightning', color: '#f56c6c' },
  fire: { name: '火警', name_en: 'Fire', icon: 'warning', color: '#ff0000' },
  security: { name: '安防告警', name_en: 'Security', icon: 'lock', color: '#e6a23c' }
}

// 告警级别
const alertLevels = {
  critical: { name: '严重', name_en: 'Critical', color: '#f56c6c' },
  warning: { name: '警告', name_en: 'Warning', color: '#e6a23c' },
  info: { name: '提示', name_en: 'Info', color: '#409eff' }
}

// Mock告警数据
let mockAlerts = [
  { id: 1, type: 'temperature', level: 'critical', title: '1号空调温度异常', title_en: 'AC #1 Temperature Anomaly', location: '1楼大厅', message: '当前温度28°C，超过设定阈值26°C', message_en: 'Current temp 28°C, exceeds threshold 26°C', timestamp: '2026-04-17T10:15:00Z', status: 'pending', acknowledged: false },
  { id: 2, type: 'energy', level: 'warning', title: 'B栋能耗超标', title_en: 'Building B Energy Overuse', location: 'B栋', message: '当前时段能耗超过日均值的120%', message_en: 'Current period energy exceeds 120% of daily average', timestamp: '2026-04-17T09:30:00Z', status: 'acknowledged', acknowledged: true },
  { id: 3, type: 'motion', level: 'info', title: '检测到人员移动', title_en: 'Motion Detected', location: '地下停车场入口', message: '检测到异常人员移动', message_en: 'Abnormal motion detected', timestamp: '2026-04-17T08:45:00Z', status: 'resolved', acknowledged: true },
  { id: 4, type: 'offline', level: 'warning', title: '3号摄像头离线', title_en: 'Camera #3 Offline', location: '3楼走廊', message: '设备连接中断，请检查网络', message_en: 'Connection lost, please check network', timestamp: '2026-04-17T07:20:00Z', status: 'pending', acknowledged: false },
  { id: 5, type: 'occupancy', level: 'info', title: '车位即将满', title_en: 'Parking Almost Full', location: 'B2层', message: '剩余车位不足10个', message_en: 'Less than 10 spaces remaining', timestamp: '2026-04-17T06:00:00Z', status: 'resolved', acknowledged: true },
  { id: 6, type: 'fire', level: 'critical', title: '烟感报警', title_en: 'Smoke Detector Alarm', location: '5楼厨房', message: '检测到烟雾浓度异常', message_en: 'Abnormal smoke level detected', timestamp: '2026-04-16T22:30:00Z', status: 'resolved', acknowledged: true },
  { id: 7, type: 'security', level: 'critical', title: '门禁异常', title_en: 'Access Control Anomaly', location: '主入口', message: '检测到未授权访问尝试', message_en: 'Unauthorized access attempt detected', timestamp: '2026-04-16T18:15:00Z', status: 'acknowledged', acknowledged: true },
  { id: 8, type: 'temperature', level: 'warning', title: '服务器房间温度偏高', title_en: 'Server Room High Temp', location: '机房', message: '当前温度24°C，建议检查空调', message_en: 'Current temp 24°C, recommend checking AC', timestamp: '2026-04-16T15:00:00Z', status: 'pending', acknowledged: false }
]

// 获取告警列表
router.get('/', async (req, res) => {
  try {
    const { status, level, type, startDate, endDate, page = 1, pageSize = 10 } = req.query

    let filtered = [...mockAlerts]

    if (status) {
      filtered = filtered.filter(a => a.status === status)
    }
    if (level) {
      filtered = filtered.filter(a => a.level === level)
    }
    if (type) {
      filtered = filtered.filter(a => a.type === type)
    }

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

// 告警统计
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const stats = {
      total: mockAlerts.length,
      today: mockAlerts.filter(a => a.timestamp.startsWith(today)).length,
      pending: mockAlerts.filter(a => a.status === 'pending').length,
      critical: mockAlerts.filter(a => a.level === 'critical' && a.status === 'pending').length,
      byType: Object.keys(alertTypes).map(key => ({
        type: key,
        ...alertTypes[key],
        count: mockAlerts.filter(a => a.type === key).length
      })),
      byLevel: Object.keys(alertLevels).map(key => ({
        level: key,
        ...alertLevels[key],
        count: mockAlerts.filter(a => a.level === key).length
      }))
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 确认告警
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params

    const alert = mockAlerts.find(a => a.id === parseInt(id))

    if (!alert) {
      return res.status(404).json({ success: false, error: '告警不存在' })
    }

    alert.status = 'acknowledged'
    alert.acknowledged = true

    res.json({
      success: true,
      message: '告警已确认',
      data: alert
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 处理告警
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params
    const { resolution } = req.body

    const alert = mockAlerts.find(a => a.id === parseInt(id))

    if (!alert) {
      return res.status(404).json({ success: false, error: '告警不存在' })
    }

    alert.status = 'resolved'
    alert.resolution = resolution || '已处理'
    alert.resolvedAt = new Date().toISOString()

    res.json({
      success: true,
      message: '告警已处理',
      data: alert
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取告警设置
router.get('/settings', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        email: { enabled: true, recipients: ['admin@smartbuilding.com'] },
        sms: { enabled: false },
        push: { enabled: true },
        thresholds: {
          temperature: { min: 18, max: 26 },
          energy: { warning: 120, critical: 150 }
        },
        autoResolve: { enabled: false, hours: 24 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新告警设置
router.put('/settings', async (req, res) => {
  try {
    res.json({
      success: true,
      message: '设置已更新'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
