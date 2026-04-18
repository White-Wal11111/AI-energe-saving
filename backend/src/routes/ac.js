import express from 'express'
const router = express.Router()

// 预定义设备数据（确保中文正确显示）
const mockDevices = [
  { id: 'ac-001', name: '1号空调', location: '1楼大厅', zone: 'A区', floor: 1, status: 'on', current_temp: 24, target_temp: 24, mode: 'cool', power: 1200, energy_today: 28.5 },
  { id: 'ac-002', name: '2号空调', location: '2楼办公区', zone: 'B区', floor: 2, status: 'on', current_temp: 23, target_temp: 24, mode: 'cool', power: 1500, energy_today: 35.2 },
  { id: 'ac-003', name: '3号空调', location: '3楼会议室', zone: 'C区', floor: 3, status: 'off', current_temp: 26, target_temp: 24, mode: 'cool', power: 0, energy_today: 12.8 },
  { id: 'ac-004', name: '4号空调', location: '地下车库', zone: 'D区', floor: -1, status: 'on', current_temp: 22, target_temp: 24, mode: 'fan', power: 800, energy_today: 18.6 },
  { id: 'ac-005', name: '5号空调', location: '1楼接待区', zone: 'A区', floor: 1, status: 'on', current_temp: 25, target_temp: 25, mode: 'cool', power: 1100, energy_today: 22.3 },
  { id: 'ac-006', name: '6号空调', location: '2楼休息区', zone: 'B区', floor: 2, status: 'standby', current_temp: 24, target_temp: 24, mode: 'auto', power: 0, energy_today: 8.5 }
]

// 预定义场景数据
const mockScenes = [
  { id: 1, code: 'eco', name: '节能模式', name_en: 'Eco Mode', icon: 'el-icon-leaf', is_default: true, settings: { power: true, target_temp: 26, mode: 'cool' } },
  { id: 2, code: 'comfort', name: '舒适模式', name_en: 'Comfort Mode', icon: 'el-icon-circle-check', is_default: false, settings: { power: true, target_temp: 24, mode: 'auto' } },
  { id: 3, code: 'meeting', name: '会议模式', name_en: 'Meeting Mode', icon: 'el-icon-user', is_default: false, settings: { power: true, target_temp: 22, mode: 'cool' } },
  { id: 4, code: 'night', name: '夜间模式', name_en: 'Night Mode', icon: 'el-icon-moon', is_default: false, settings: { power: true, target_temp: 26, mode: 'fan' } }
]

// 控制日志
let controlLogs = []

// 获取所有空调设备
router.get('/devices', async (req, res) => {
  res.json({ success: true, data: mockDevices })
})

// 获取单个设备详情
router.get('/devices/:id', async (req, res) => {
  const device = mockDevices.find(d => d.id === req.params.id)
  if (!device) {
    return res.status(404).json({ success: false, error: '设备未找到' })
  }
  res.json({ success: true, data: device })
})

// 控制空调（开关、温度、模式）
router.post('/control', async (req, res) => {
  try {
    const { deviceId, action, value } = req.body
    
    const deviceIndex = mockDevices.findIndex(d => d.id === deviceId)
    if (deviceIndex === -1) {
      return res.status(404).json({ success: false, error: '设备未找到' })
    }
    
    const device = mockDevices[deviceIndex]
    let oldValue = ''
    let newValue = ''

    switch (action) {
      case 'power':
        oldValue = device.status
        newValue = value === 'on' || value === true ? 'on' : 'off'
        mockDevices[deviceIndex].status = newValue
        mockDevices[deviceIndex].power = newValue === 'on' ? 1000 : 0
        break
        
      case 'temperature':
        oldValue = String(device.target_temp)
        newValue = String(value)
        mockDevices[deviceIndex].target_temp = value
        break
        
      case 'mode':
        oldValue = device.mode
        newValue = value
        mockDevices[deviceIndex].mode = value
        break
    }

    // 记录日志
    controlLogs.unshift({
      id: Date.now(),
      device_id: deviceId,
      device_name: device.name,
      action,
      old_value: oldValue,
      new_value: newValue,
      source: 'manual',
      created_at: new Date().toISOString()
    })

    res.json({
      success: true,
      message: `控制命令已执行: ${action} = ${newValue}`,
      data: mockDevices[deviceIndex]
    })
  } catch (error) {
    console.error('控制失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 批量控制（场景控制）
router.post('/batch-control', async (req, res) => {
  try {
    const { deviceIds, settings } = req.body
    
    let targetDevices = deviceIds || mockDevices.map(d => d.id)

    for (const deviceId of targetDevices) {
      const deviceIndex = mockDevices.findIndex(d => d.id === deviceId)
      if (deviceIndex === -1) continue
      
      if (settings.power !== undefined) {
        const powerValue = settings.power ? 'on' : 'off'
        mockDevices[deviceIndex].status = powerValue
        mockDevices[deviceIndex].power = settings.power ? 1000 : 0
      }
      if (settings.target_temp !== undefined) {
        mockDevices[deviceIndex].target_temp = settings.target_temp
      }
      if (settings.mode !== undefined) {
        mockDevices[deviceIndex].mode = settings.mode
      }
    }

    res.json({
      success: true,
      message: `场景已应用到 ${targetDevices.length} 台设备`,
      data: targetDevices
    })
  } catch (error) {
    console.error('批量控制失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取场景列表
router.get('/scenes', async (req, res) => {
  res.json({ success: true, data: mockScenes })
})

// 应用场景
router.post('/scenes/apply', async (req, res) => {
  try {
    const { sceneCode, deviceIds } = req.body
    
    const scene = mockScenes.find(s => s.code === sceneCode)
    if (!scene) {
      return res.status(404).json({ success: false, error: '场景未找到' })
    }
    
    const targetDevices = deviceIds && deviceIds.length > 0 ? deviceIds : mockDevices.map(d => d.id)

    for (const deviceId of targetDevices) {
      const deviceIndex = mockDevices.findIndex(d => d.id === deviceId)
      if (deviceIndex === -1) continue
      
      if (scene.settings.power !== undefined) {
        mockDevices[deviceIndex].status = scene.settings.power ? 'on' : 'off'
        mockDevices[deviceIndex].power = scene.settings.power ? 1000 : 0
      }
      if (scene.settings.target_temp !== undefined) {
        mockDevices[deviceIndex].target_temp = scene.settings.target_temp
      }
      if (scene.settings.mode !== undefined) {
        mockDevices[deviceIndex].mode = scene.settings.mode
      }
    }

    res.json({
      success: true,
      message: `场景 "${scene.name}" 已应用`,
      data: { sceneCode, deviceCount: targetDevices.length }
    })
  } catch (error) {
    console.error('应用场景失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取定时任务列表
router.get('/schedules', async (req, res) => {
  res.json({ success: true, data: [] })
})

// 创建定时任务
router.post('/schedules', async (req, res) => {
  res.json({ success: true, message: '定时任务已创建' })
})

// 更新定时任务
router.put('/schedules/:id', async (req, res) => {
  res.json({ success: true, message: '定时任务已更新' })
})

// 删除定时任务
router.delete('/schedules/:id', async (req, res) => {
  res.json({ success: true, message: '定时任务已删除' })
})

// 获取控制日志
router.get('/logs', async (req, res) => {
  try {
    const { device_id, limit = 50 } = req.query
    
    let logs = [...controlLogs]
    if (device_id) {
      logs = logs.filter(l => l.device_id === device_id)
    }
    
    res.json({ success: true, data: logs.slice(0, Number(limit)) })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取能耗统计
router.get('/energy/stats', async (req, res) => {
  res.json({
    success: true,
    data: {
      todayTotal: mockDevices.reduce((sum, d) => sum + d.energy_today, 0),
      weekData: [
        { date: '2026-04-10', total: 320 },
        { date: '2026-04-11', total: 280 },
        { date: '2026-04-12', total: 350 },
        { date: '2026-04-13', total: 290 },
        { date: '2026-04-14', total: 310 },
        { date: '2026-04-15', total: 270 },
        { date: '2026-04-16', total: 340 }
      ],
      devices: mockDevices.map(d => ({ id: d.id, name: d.name, location: d.location, energy_today: d.energy_today, power: d.power, status: d.status }))
    }
  })
})

// AI 预测分析
router.post('/ai/predict', async (req, res) => {
  try {
    const { deviceId } = req.body
    
    const device = mockDevices.find(d => d.id === deviceId)
    if (!device) {
      return res.status(404).json({ success: false, error: '设备未找到' })
    }
    
    let efficiency = 85
    const suggestions = []
    
    const tempDiff = Math.abs(device.current_temp - device.target_temp)
    if (tempDiff > 3) {
      efficiency -= 15
      suggestions.push('当前温度与目标温度差值较大，建议调整目标温度')
    }
    
    if (device.power > 1500) {
      efficiency -= 10
      suggestions.push('当前功率较高，建议适当调高目标温度以节能')
    }
    
    if (device.mode === 'cool' && device.current_temp < 23) {
      suggestions.push('检测到过度制冷，建议将目标温度调高')
    }
    
    if (suggestions.length === 0) {
      suggestions.push('设备运行状态良好，能效比正常')
    }
    suggestions.push('建议定期清洁过滤网，保持设备高效运行')
    
    res.json({
      success: true,
      data: {
        efficiency: Math.max(60, Math.min(95, efficiency)),
        suggestions,
        analysis: {
          tempDiff,
          currentMode: device.mode,
          currentPower: device.power
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DeepSeek AI 深度分析
router.post('/ai/deepseek-analysis', async (req, res) => {
  const suggestions = [
    { title: '优化2号空调运行参数', description: '2号空调功率过高(1500W)，建议调高目标温度2°C，预计节能15%，月节省约180元电费', saving: '-15% ¥180/月', confidence: 92, priority: 'high', icon: 'el-icon-odometer', color: '#f5576c' },
    { title: '启用预测性维护提醒', description: 'AI检测到部分设备效能下降趋势，建议本周进行滤网清洁，避免能耗持续上升', saving: '-8% ¥60/月', confidence: 88, priority: 'medium', icon: 'el-icon-tools', color: '#667eea' },
    { title: '调整工作时间表', description: '根据能耗峰值分析，建议将会议安排在14:00-16:00时段，此时设备负载较低', saving: '-12%', confidence: 85, priority: 'medium', icon: 'el-icon-clock', color: '#4facfe' },
    { title: '扩展夜间节能模式', description: '当前夜间模式22:00启动，建议提前至21:00执行，可额外节省5%夜间能耗', saving: '-5%', confidence: 78, priority: 'low', icon: 'el-icon-moon', color: '#764ba2' }
  ]
  
  res.json({
    success: true,
    data: { suggestions, model: 'simulated', timestamp: new Date().toISOString() }
  })
})

// 能耗预测
router.get('/ai/forecast', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7
    
    const forecast = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      const totalEnergy = mockDevices.reduce((sum, d) => sum + d.energy_today, 0)
      const variance = Math.random() * 0.2 - 0.1
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.round(totalEnergy * (1 + variance) * 100) / 100,
        confidence: 85 + Math.random() * 10
      })
    }
    
    res.json({
      success: true,
      data: { forecast, model: 'statistical', accuracy: 87 }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
