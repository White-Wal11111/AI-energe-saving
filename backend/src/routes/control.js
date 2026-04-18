import express from 'express'
const router = express.Router()
import pool from '../config/database.js'
import { authenticateToken } from './auth.js'

// 设备类型及其可执行的控制动作配置
const CONTROL_ACTIONS = {
  smart_meter: {
    label: '智能电表',
    actions: [
      { value: 'reset_meter', label: '重置读数', icon: 'el-icon-refresh-right', type: 'button' },
      { value: 'set_alarm', label: '设置报警阈值', icon: 'el-icon-bell', type: 'input', inputLabel: '阈值(kW)', inputUnit: 'kW' },
      { value: 'toggle_display', label: '切换显示模式', icon: 'el-icon-monitor', type: 'select', options: ['功率模式', '电量模式', '费率模式'] },
      { value: 'read_data', label: '立即读取', icon: 'el-icon-data-line', type: 'button' }
    ]
  },
  smart_valve_air: {
    label: '智能风阀',
    actions: [
      { value: 'open_valve', label: '全开', icon: 'el-icon-top-right', type: 'button' },
      { value: 'close_valve', label: '全关', icon: 'el-icon-bottom-left', type: 'button' },
      { value: 'set_opening', label: '调节开度(%)', icon: 'el-icon-data-analysis', type: 'slider', min: 0, max: 100, unit: '%' }
    ]
  },
  smart_valve_water: {
    label: '智能水阀',
    actions: [
      { value: 'open_valve', label: '全开', icon: 'el-icon-top-right', type: 'button' },
      { value: 'close_valve', label: '全关', icon: 'el-icon-bottom-left', type: 'button' },
      { value: 'set_opening', label: '调节开度(%)', icon: 'el-icon-data-analysis', type: 'slider', min: 0, max: 100, unit: '%' },
      { value: 'set_flow_rate', label: '设置流量(m³/h)', icon: 'el-icon-water-perfect', type: 'input', inputUnit: 'm³/h' }
    ]
  },
  temp_sensor_water: {
    label: '水温传感器',
    actions: [
      { value: 'read_temp', label: '读取温度', icon: 'el-icon-thermometer', type: 'button' },
      { value: 'calibrate', label: '校准偏移值', icon: 'el-icon-edit-outline', type: 'input', inputUnit: '℃' },
      { value: 'set_interval', label: '采集间隔(秒)', icon: 'el-icon-timer', type: 'input', inputUnit: 's' },
      { value: 'set_high_alarm', label: '高温报警(℃)', icon: 'el-icon-warning', type: 'input', inputUnit: '℃' }
    ]
  },
  temp_sensor_air: {
    label: '风温传感器',
    actions: [
      { value: 'read_temp', label: '读取温度', icon: 'el-icon-thermometer', type: 'button' },
      { value: 'calibrate', label: '校准偏移值', icon: 'el-icon-edit-outline', type: 'input', inputUnit: '℃' },
      { value: 'set_interval', label: '采集间隔(秒)', icon: 'el-icon-timer', type: 'input', inputUnit: 's' }
    ]
  },
  pressure_sensor: {
    label: '压力传感器',
    actions: [
      { value: 'read_pressure', label: '读取压力', icon: 'el-icon-data-board', type: 'button' },
      { value: 'calibrate', label: '校准偏移', icon: 'el-icon-edit-outline', type: 'input', inputUnit: 'MPa' },
      { value: 'set_high_alarm', label: '高压报警(MPa)', icon: 'el-icon-warning', type: 'input', inputUnit: 'MPa' },
      { value: 'set_low_alarm', label: '低压报警(MPa)', icon: 'el-icon-warning-outline', type: 'input', inputUnit: 'MPa' }
    ]
  },
  chiller: {
    label: '冷机',
    actions: [
      { value: 'start', label: '启动', icon: 'el-icon-video-play', type: 'button' },
      { value: 'stop', label: '停止', icon: 'el-icon-video-pause', type: 'button' },
      { value: 'set_target_temp', label: '设定温度(℃)', icon: 'el-icon-cold-drink', type: 'slider', min: 5, max: 15, unit: '℃' },
      { value: 'set_capacity', label: '设定负载率(%)', icon: 'el-icon-sunset', type: 'slider', min: 10, max: 100, unit: '%' },
      { value: 'set_mode', label: '运行模式', icon: 'el-icon-set-up', type: 'select', options: ['制冷模式', '制热模式', '自动模式'] }
    ]
  },
  cooling_tower: {
    label: '冷却塔',
    actions: [
      { value: 'start', label: '启动风机', icon: 'el-icon-video-play', type: 'button' },
      { value: 'stop', label: '停风机', icon: 'el-icon-video-pause', type: 'button' },
      { value: 'set_fan_speed', label: '风机转速(rpm)', icon: 'el-icon-wind-power', type: 'input', inputUnit: 'rpm' },
      { value: 'set_fan_speed_pct', label: '风机频率(%)', icon: 'el-icon-data-line', type: 'slider', min: 20, max: 100, unit: '%' },
      { value: 'set_fill_water', label: '补水', icon: 'el-icon-water-cup', type: 'button' },
      { value: 'blowdown', label: '排污', icon: 'el-icon-delete-location', type: 'button' }
    ]
  },
  ahu: {
    label: '空调箱AHU',
    actions: [
      { value: 'start', label: '启动风机', icon: 'el-icon-video-play', type: 'button' },
      { value: 'stop', label: '停止风机', icon: 'el-icon-video-pause', type: 'button' },
      { value: 'ahu_set_fan_speed', label: '设定风速(%)', icon: 'el-icon-wind-power', type: 'slider', min: 0, max: 100, unit: '%' },
      { value: 'set_supply_temp', label: '送风温度(℃)', icon: 'el-icon-sunny', type: 'slider', min: 12, max: 28, unit: '℃' },
      { value: 'toggle_valve', label: '开关水阀', icon: 'el-icon-switch-button', type: 'select', options: ['开', '关'] },
      { value: 'set_mode', label: '运行模式', icon: 'el-icon-set-up', type: 'select', options: ['自动', '制冷', '制热', '通风'] }
    ]
  }
}

// 获取设备控制动作配置
router.get('/actions-config', authenticateToken, async (req, res) => {
  const config = Object.entries(CONTROL_ACTIONS).map(([type, info]) => ({
    type,
    label: info.label,
    actions: info.actions
  }))
  res.json({ success: true, data: config })
})

// 获取当前项目下可控设备列表
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const project_id = req.query.project_id || req.headers['x-project-id']
    const [rows] = await pool.query(
      `SELECT d.* FROM devices d WHERE d.project_id = ? ORDER BY d.device_type, d.name`,
      [project_id]
    )

    const devices = rows.map(d => ({
      ...d,
      actions: CONTROL_ACTIONS[d.device_type]?.actions || []
    }))

    res.json({ success: true, data: devices })
  } catch (error) {
    console.error('获取可控设备列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 发送控制指令
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { device_id, device_code, device_name, device_type, action, params } = req.body
    const user = JSON.parse(Buffer.from(req.token.split('.')[1], 'base64').toString())
    const username = user.username || user.name || 'unknown'

    if (!device_id || !action) {
      return res.status(400).json({ success: false, error: '缺少必要参数' })
    }

    // 验证设备存在
    const [deviceRows] = await pool.query('SELECT * FROM devices WHERE id = ?', [device_id])
    if (deviceRows.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' })
    }

    // 模拟执行控制指令（实际场景中这里会调用PLC/BACnet/MQTT等协议发送真实指令）
    let resultMessage = ''
    let isSuccess = true

    switch (action) {
      case 'open_valve':
        resultMessage = `风阀/水阀已打开`
        break
      case 'close_valve':
        resultMessage = `风阀/水阀已关闭`
        break
      case 'set_opening':
        resultMessage = `开度已设置为 ${params?.value}%`
        break
      case 'start':
        resultMessage = `${CONTROL_ACTIONS[device_type]?.label || '设备'}已启动`
        break
      case 'stop':
        resultMessage = `${CONTROL_ACTIONS[device_type]?.label || '设备'}已停止`
        break
      case 'set_target_temp':
        resultMessage = `目标温度已设为 ${params?.value}℃`
        break
      case 'set_capacity':
        resultMessage = `负载率已设为 ${params?.value}%`
        break
      case 'set_fan_speed':
        resultMessage = `风机转速已设为 ${params?.value} rpm`
        break
      case 'set_fan_speed_pct':
        resultMessage = `风机频率已设为 ${params?.value}%`
        break
      case 'set_mode':
        resultMessage = `运行模式已切换为 ${params?.value}`
        break
      case 'set_flow_rate':
        resultMessage = `流量已设为 ${params?.value} m³/h`
        break
      case 'reset_meter':
        resultMessage = `电表读数已重置`
        break
      case 'set_alarm':
        resultMessage = `报警阈值已设为 ${params?.value} kW`
        break
      case 'toggle_display':
        resultMessage = `显示模式已切换为 ${params?.value}`
        break
      case 'read_data':
      case 'read_temp':
      case 'read_pressure':
        resultMessage = `数据读取完成`
        break
      case 'calibrate':
        resultMessage = `校准偏移值已设为 ${params?.value}`
        break
      case 'set_interval':
        resultMessage = `采集间隔已设为 ${params?.value}s`
        break
      case 'set_high_alarm':
        resultMessage = `高限报警已设为 ${params?.value}`
        break
      case 'set_low_alarm':
        resultMessage = `低限报警已设为 ${params?.value}`
        break
      case 'set_fill_water':
        resultMessage = `补水指令已发送`
        break
      case 'blowdown':
        resultMessage = `排污指令已发送`
        break
      case 'ahu_set_fan_speed':
        resultMessage = `风机风速已设为 ${params?.value}%`
        break
      case 'set_supply_temp':
        resultMessage = `送风温度已设为 ${params?.value}℃`
        break
      case 'toggle_valve':
        resultMessage = `水阀已${params?.value === '开' ? '打开' : '关闭'}`
        break
      default:
        resultMessage = `未知操作: ${action}`
        break
    }

    // 记录操作日志
    await pool.query(
      `INSERT INTO device_control_logs (device_id, device_name, device_code, device_type, action, action_label, params, operator, result, result_message, project_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [device_id, device_name, deviceRows[0].device_code, deviceRows[0].device_code, device_type,
        action, JSON.stringify(params || {}), username, isSuccess ? 'success' : 'fail', resultMessage, deviceRows[0].project_id]
    )

    res.json({
      success: true,
      data: {
        result: isSuccess ? 'success' : 'fail',
        message: resultMessage,
        executedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('发送控制指令失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 查询操作日志
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { project_id, device_type, device_id, action, result, start_date, end_date, keyword, page = 1, pageSize = 20 } = req.query

    let where = ['1=1']
    let params = []

    if (project_id && project_id !== 'all') {
      where.push('cl.project_id = ?')
      params.push(project_id)
    }
    if (device_type) {
      where.push('cl.device_type = ?')
      params.push(device_type)
    }
    if (device_id) {
      where.push('cl.device_id = ?')
      params.push(device_id)
    }
    if (action) {
      where.push('cl.action = ?')
      params.push(action)
    }
    if (result) {
      where.push('cl.result = ?')
      params.push(result)
    }
    if (keyword) {
      where.push('(cl.device_name LIKE ? OR cl.operator LIKE ? OR cl.result_message LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }
    if (start_date) {
      where.push('cl.created_at >= ?')
      params.push(start_date)
    }
    if (end_date) {
      where.push('cl.created_at <= ?')
      params.push(end_date + ' 23:59:59')
    }

    const whereClause = where.join(' AND ')

    // 总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM device_control_logs cl WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    // 分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const [rows] = await pool.query(
      `SELECT cl.*, 
              dt.label as device_type_label, dt.color as device_type_color
       FROM device_control_logs cl
       LEFT JOIN (
         SELECT 'smart_meter' as type, '智能电表' as label, '#409EFF' as color UNION ALL
         SELECT 'smart_valve_air', '智能风阀', '#67C23A' UNION ALL
         SELECT 'smart_valve_water', '智能水阀', '#E6A23C' UNION ALL
         SELECT 'temp_sensor_water', '水温传感器', '#F56C6C' UNION ALL
         SELECT 'temp_sensor_air', '风温传感器', '#909399' UNION ALL
         SELECT 'pressure_sensor', '压力传感器', '#764ba2' UNION ALL
         SELECT 'chiller', '冷机', '#1a6dbb' UNION ALL
         SELECT 'cooling_tower', '冷却塔', '#2a8ae0' UNION ALL
         SELECT 'ahu', '空调箱AHU', '#9b59b6'
       ) dt ON dt.type = cl.device_type
       WHERE ${whereClause}
       ORDER BY cl.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    res.json({
      success: true,
      data: {
        list: rows,
        total: parseInt(total),
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('查询操作日志失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
