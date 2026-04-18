import express from 'express'
const router = express.Router()
import pool from '../config/database.js'
import { authenticateToken } from './auth.js'

// 设备类型配置
const DEVICE_TYPES = {
  smart_meter: { label: '智能电表', icon: 'el-icon-reading', color: '#409EFF' },
  smart_valve_air: { label: '智能风阀', icon: 'el-icon-wind-power', color: '#67C23A' },
  smart_valve_water: { label: '智能水阀', icon: 'el-icon-water-cup', color: '#E6A23C' },
  temp_sensor_water: { label: '水温传感器', icon: 'el-icon-thermometer', color: '#F56C6C' },
  temp_sensor_air: { label: '风温传感器', icon: 'el-icon-sunny', color: '#909399' },
  pressure_sensor: { label: '压力传感器', icon: 'el-icon-data-board', color: '#764ba2' },
  chiller: { label: '冷机', icon: 'el-icon-cold-drink', color: '#1a6dbb' },
  cooling_tower: { label: '冷却塔', icon: 'el-icon-heavy-rain', color: '#2a8ae0' },
  ahu: { label: '空调箱AHU', icon: 'el-icon-wind-power', color: '#9b59b6' }
}

// 状态配置
const STATUS_MAP = {
  online: { label: '在线', type: 'success' },
  offline: { label: '离线', type: 'info' },
  fault: { label: '故障', type: 'danger' },
  maintenance: { label: '维护中', type: 'warning' }
}

// 获取设备类型配置
router.get('/types', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: Object.entries(DEVICE_TYPES).map(([key, val]) => ({
      value: key,
      label: val.label,
      icon: val.icon,
      color: val.color
    }))
  })
})

// 获取状态配置
router.get('/status-config', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: Object.entries(STATUS_MAP).map(([key, val]) => ({
      value: key,
      label: val.label,
      type: val.type
    }))
  })
})

// 获取设备列表（支持按项目、类型、状态筛选）
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { project_id, device_type, status, keyword, page = 1, pageSize = 20 } = req.query

    let where = ['1=1']
    let params = []

    if (project_id && project_id !== 'all') {
      where.push('d.project_id = ?')
      params.push(project_id)
    }
    if (device_type) {
      where.push('d.device_type = ?')
      params.push(device_type)
    }
    if (status) {
      where.push('d.status = ?')
      params.push(status)
    }
    if (keyword) {
      where.push('(d.name LIKE ? OR d.device_code LIKE ? OR d.location LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    const whereClause = where.join(' AND ')

    // 总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM devices d WHERE ${whereClause}`,
      params
    )
    const total = countResult[0].total

    // 分页数据
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const [rows] = await pool.query(
      `SELECT d.*,
        (SELECT COUNT(*) FROM device_realtime_data drd WHERE drd.device_id = d.id) as data_count
      FROM devices d
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    )

    // 附加类型和状态标签
    const devices = rows.map(row => ({
      ...row,
      type_label: DEVICE_TYPES[row.device_type]?.label || row.device_type,
      type_icon: DEVICE_TYPES[row.device_type]?.icon || '',
      type_color: DEVICE_TYPES[row.device_type]?.color || '#909399',
      status_label: STATUS_MAP[row.status]?.label || row.status,
      status_type: STATUS_MAP[row.status]?.type || 'info'
    }))

    res.json({
      success: true,
      data: {
        list: devices,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    })
  } catch (error) {
    console.error('获取设备列表失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取设备详情
router.get('/detail/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM devices WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' })
    }

    const device = rows[0]
    device.type_label = DEVICE_TYPES[device.device_type]?.label || device.device_type
    device.type_icon = DEVICE_TYPES[device.device_type]?.icon || ''
    device.type_color = DEVICE_TYPES[device.device_type]?.color || '#909399'
    device.status_label = STATUS_MAP[device.status]?.label || device.status
    device.status_type = STATUS_MAP[device.status]?.type || 'info'

    // 获取最新实时数据
    const [realtimeData] = await pool.query(
      `SELECT data_type, value, unit, recorded_at
       FROM device_realtime_data
       WHERE device_id = ?
       ORDER BY recorded_at DESC
       LIMIT 20`,
      [req.params.id]
    )

    device.realtimeData = realtimeData

    res.json({ success: true, data: device })
  } catch (error) {
    console.error('获取设备详情失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 新增设备
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const {
      project_id, device_code, name, device_type,
      location, floor, brand, model,
      rated_power, rated_flow, rated_pressure,
      install_date, warranty_date, status, description
    } = req.body

    if (!project_id || !device_code || !name || !device_type) {
      return res.status(400).json({ success: false, error: '项目ID、设备编号、设备名称、设备类型为必填项' })
    }

    // 检查编号唯一性
    const [existing] = await pool.query(
      'SELECT id FROM devices WHERE project_id = ? AND device_code = ?',
      [project_id, device_code]
    )
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: '该项目下设备编号已存在' })
    }

    // 验证设备类型
    if (!DEVICE_TYPES[device_type]) {
      return res.status(400).json({ success: false, error: '无效的设备类型' })
    }

    const [result] = await pool.query(
      `INSERT INTO devices (project_id, device_code, name, device_type, location, floor, brand, model,
        rated_power, rated_flow, rated_pressure, install_date, warranty_date, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id, device_code, name, device_type,
        location || null, floor || null, brand || null, model || null,
        rated_power || null, rated_flow || null, rated_pressure || null,
        install_date || null, warranty_date || null, status || 'online', description || null]
    )

    res.json({
      success: true,
      data: { id: result.insertId, device_code, name, device_type },
      message: '设备添加成功'
    })
  } catch (error) {
    console.error('添加设备失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新设备
router.put('/update/:id', authenticateToken, async (req, res) => {
  try {
    const deviceId = req.params.id
    const {
      project_id, device_code, name, device_type,
      location, floor, brand, model,
      rated_power, rated_flow, rated_pressure,
      install_date, warranty_date, status, description
    } = req.body

    // 检查设备是否存在
    const [existing] = await pool.query('SELECT id FROM devices WHERE id = ?', [deviceId])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' })
    }

    // 如果修改了编号，检查唯一性
    if (device_code) {
      const [dup] = await pool.query(
        'SELECT id FROM devices WHERE project_id = ? AND device_code = ? AND id != ?',
        [project_id || existing[0].project_id, device_code, deviceId]
      )
      if (dup.length > 0) {
        return res.status(400).json({ success: false, error: '该项目下设备编号已存在' })
      }
    }

    if (device_type && !DEVICE_TYPES[device_type]) {
      return res.status(400).json({ success: false, error: '无效的设备类型' })
    }

    await pool.query(
      `UPDATE devices SET
        project_id = COALESCE(?, project_id),
        device_code = COALESCE(?, device_code),
        name = COALESCE(?, name),
        device_type = COALESCE(?, device_type),
        location = ?, floor = ?, brand = ?, model = ?,
        rated_power = ?, rated_flow = ?, rated_pressure = ?,
        install_date = ?, warranty_date = ?,
        status = COALESCE(?, status),
        description = ?
      WHERE id = ?`,
      [project_id || null, device_code || null, name || null, device_type || null,
       location || null, floor || null, brand || null, model || null,
       rated_power || null, rated_flow || null, rated_pressure || null,
       install_date || null, warranty_date || null,
       status || null, description || null,
       deviceId]
    )

    res.json({ success: true, message: '设备更新成功' })
  } catch (error) {
    console.error('更新设备失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 删除设备
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM devices WHERE id = ?', [req.params.id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' })
    }

    // 关联的实时数据也会因外键 CASCADE 自动删除
    await pool.query('DELETE FROM devices WHERE id = ?', [req.params.id])

    res.json({ success: true, message: '设备已删除' })
  } catch (error) {
    console.error('删除设备失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 批量删除设备
router.post('/batch-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: '请选择要删除的设备' })
    }

    const placeholders = ids.map(() => '?').join(',')
    await pool.query(`DELETE FROM devices WHERE id IN (${placeholders})`, ids)

    res.json({ success: true, message: `已删除 ${ids.length} 台设备` })
  } catch (error) {
    console.error('批量删除失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 上报设备实时数据
router.post('/realtime-data', authenticateToken, async (req, res) => {
  try {
    const { device_id, data } = req.body

    if (!device_id || !data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, error: '参数错误' })
    }

    const [existing] = await pool.query('SELECT id FROM devices WHERE id = ?', [device_id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: '设备不存在' })
    }

    const values = data.map(d => [device_id, d.data_type, d.value, d.unit || null])
    await pool.query(
      'INSERT INTO device_realtime_data (device_id, data_type, value, unit) VALUES ?',
      [values]
    )

    // 更新设备最后数据上报时间
    await pool.query('UPDATE devices SET last_data_time = NOW() WHERE id = ?', [device_id])

    res.json({ success: true, message: `已录入 ${data.length} 条数据` })
  } catch (error) {
    console.error('录入实时数据失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取设备实时数据历史
router.get('/realtime-data/:id', authenticateToken, async (req, res) => {
  try {
    const { data_type, start_time, end_time, limit = 100 } = req.query
    let where = ['device_id = ?']
    let params = [req.params.id]

    if (data_type) {
      where.push('data_type = ?')
      params.push(data_type)
    }
    if (start_time) {
      where.push('recorded_at >= ?')
      params.push(start_time)
    }
    if (end_time) {
      where.push('recorded_at <= ?')
      params.push(end_time)
    }

    const [rows] = await pool.query(
      `SELECT * FROM device_realtime_data WHERE ${where.join(' AND ')}
       ORDER BY recorded_at DESC LIMIT ?`,
      [...params, parseInt(limit)]
    )

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取实时数据失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// 设备运行状态统计（按项目）
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query
    let projectFilter = ''
    let params = []

    if (project_id && project_id !== 'all') {
      projectFilter = 'WHERE project_id = ?'
      params = [project_id]
    }

    // 按状态统计
    const [statusStats] = await pool.query(
      `SELECT status, COUNT(*) as count FROM devices ${projectFilter} GROUP BY status`,
      params
    )

    // 按类型统计
    const [typeStats] = await pool.query(
      `SELECT device_type, COUNT(*) as count FROM devices ${projectFilter} GROUP BY device_type`,
      params
    )

    // 总数
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM devices ${projectFilter}`,
      params
    )

    res.json({
      success: true,
      data: {
        total: totalResult[0].total,
        byStatus: statusStats.map(s => ({
          ...s,
          label: STATUS_MAP[s.status]?.label || s.status,
          type: STATUS_MAP[s.status]?.type || 'info'
        })),
        byType: typeStats.map(s => ({
          ...s,
          label: DEVICE_TYPES[s.device_type]?.label || s.device_type,
          color: DEVICE_TYPES[s.device_type]?.color || '#909399'
        }))
      }
    })
  } catch (error) {
    console.error('获取设备统计失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
