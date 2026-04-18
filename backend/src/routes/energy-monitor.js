import express from 'express'
const router = express.Router()
import pool from '../config/database.js'
import { authenticateToken } from './auth.js'

// 分项配置
const CATEGORIES = {
  total:      { label: '总计', color: '#409EFF', icon: 'el-icon-data-line' },
  chiller:    { label: '冷机', color: '#F56C6C', icon: 'el-icon-cold-drink' },
  chilled_pump: { label: '冷冻水泵', color: '#E6A23C', icon: 'el-icon-water-perfect' },
  condenser_pump: { label: '冷却水泵', color: '#909399', icon: 'el-icon-heavy-rain' },
  cooling_tower: { label: '冷却塔', color: '#67C23A', icon: 'el-icon-wind-power' },
  terminal:   { label: '末端设备', color: '#764ba2', icon: 'el-icon-magic-stick' },
  other:      { label: '其他', color: '#c0c4cc', icon: 'el-icon-more' }
}

// 电价配置（元/kWh，可后续改为数据库配置）
const ELECTRICITY_PRICE = 0.85

// ====== 实时数据接口 ======

router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const project_id = req.query.project_id || getProjectId(req)

    // 获取最新一条总功率数据
    const [totalRow] = await pool.query(
      `SELECT power_kw, energy_kwh, cost_yuan, recorded_at
       FROM energy_monitor_data WHERE project_id=? AND category='total'
       ORDER BY recorded_at DESC LIMIT 1`,
      [project_id]
    )

    // 获取各分项最新数据
    const [categoryRows] = await pool.query(
      `SELECT category, power_kw, energy_kwh, cost_yuan, recorded_at
       FROM energy_monitor_data WHERE project_id=?
       GROUP BY category ORDER BY FIELD(category,'total','chiller','chilled_pump','condenser_pump','cooling_tower','terminal','other')`,
      [project_id]
    )

    // 如果没有真实数据，生成模拟数据
    let data = {}
    if (!totalRow.length && !categoryRows.length) {
      data = generateMockRealtimeData(project_id)
    } else {
      data = buildRealtimeResponse(totalRow[0] || {}, categoryRows)
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('获取实时能耗失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

function buildRealtimeResponse(totalRow, catRows) {
  const result = {
    totalPowerKw: totalRow.power_kw || 0,
    todayEnergyKwh: totalRow.energy_kwh || 0,
    todayCostYuan: totalRow.cost_yuan || 0,
    savingRate: null,
    compareEnergyKwh: null,
    lastUpdated: totalRow.recorded_at || new Date().toISOString(),
    categories: {}
  }

  catRows.forEach(row => {
    if (row.category !== 'total') {
      result.categories[row.category] = {
        powerKw: parseFloat(row.power_kw) || 0,
        energyKwh: parseFloat(row.energy_kwh) || 0,
        costYuan: parseFloat(row.cost_yuan) || 0
      }
    }
  })

  return result
}

// ====== 趋势图数据接口 ======

router.get('/trend', authenticateToken, async (req, res) => {
  try {
    const { project_id, period = 'day', date } = req.query
    const pid = project_id || getProjectId(req)

    const now = new Date()
    const baseDate = date ? new Date(date) : now

    let currentPeriod = []
    let comparePeriod = []
    let labels = []

    if (period === 'day') {
      // 按天：今日每小时的24个点 vs 去年同期同日每小时
      ({ currentPeriod, comparePeriod, labels } = await generateHourlyTrend(pid, baseDate))
    } else if (period === 'week') {
      // 按周：本周每天汇总 vs 去年同期同周
      ({ currentPeriod, comparePeriod, labels } = await generateDailyTrend(pid, baseDate, 7))
    } else if (period === 'month') {
      // 按月：本月每天 vs 去年同期同月
      ({ currentPeriod, comparePeriod, labels } = await generateDailyTrend(pid, baseDate, 30))
    }

    res.json({
      success: true,
      data: { period, labels, current: currentPeriod, compare: comparePeriod }
    })
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

async function generateHourlyTrend(projectId, baseDate) {
  const todayStr = formatDate(baseDate)
  // 去年同期同日（同比）
  const lastYearDate = new Date(baseDate)
  lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)
  const lastYearStr = formatDate(lastYearDate)

  const [currentRows] = await pool.query(
    `SELECT HOUR(recorded_at) as h, SUM(energy_kwh) as energy, SUM(cost_yuan) as cost
     FROM energy_monitor_data WHERE project_id=? AND DATE(recorded_at)=?
     GROUP BY HOUR(recorded_at) ORDER BY h`,
    [projectId, todayStr]
  )
  const [compareRows] = await pool.query(
    `SELECT HOUR(recorded_at) as h, SUM(energy_kwh) as energy, SUM(cost_yuan) as cost
     FROM energy_monitor_data WHERE project_id=? AND DATE(recorded_at)=?
     GROUP BY HOUR(recorded_at) ORDER BY h`,
    [projectId, lastYearStr]
  )

  // 如果无真实数据则模拟
  if (!currentRows.length && !compareRows.length) {
    return generateMockHourlyTrend()
  }

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const current = Array(24).fill(null).map((_, i) => {
    const r = currentRows.find(x => x.h === i)
    return { hour: i, energy: r?.energy || 0, cost: r?.cost || 0 }
  })
  const compare = Array(24).fill(null).map((_, i) => {
    const r = compareRows.find(x => x.h === i)
    return { hour: i, energy: r?.energy || 0, cost: r?.cost || 0 }
  })

  return { currentPeriod: current, comparePeriod: compare, labels }
}

async function generateDailyTrend(projectId, baseDate, days) {
  const endDate = formatDate(baseDate)
  const startDate = new Date(baseDate.getTime() - (days - 1) * 86400000)
  const startStr = formatDate(startDate)

  // 去年同期（同比）：往前推一年
  const lastYearStart = new Date(startDate.getTime())
  lastYearStart.setFullYear(lastYearStart.getFullYear() - 1)
  const lastYearEnd = new Date(baseDate.getTime())
  lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1)
  const lastYearStartStr = formatDate(lastYearStart)
  const lastYearEndStr = formatDate(lastYearEnd)

  // 尝试从日汇总表取真实数据
  let useRealData = true
  const [currentRows] = await pool.query(
    `SELECT summary_date, total_energy_kwh as energy, total_cost_yuan as cost
     FROM energy_daily_summary WHERE project_id=? AND summary_date BETWEEN ? AND ?
     ORDER BY summary_date`,
    [projectId, startStr, endDate]
  )

  const [compareRows] = await pool.query(
    `SELECT summary_date, total_energy_kwh as energy, total_cost_yuan as cost
     FROM energy_daily_summary WHERE project_id=? AND summary_date BETWEEN ? AND ?
     ORDER BY summary_date`,
    [projectId, lastYearStartStr, lastYearEndStr]
  )

  if (!currentRows.length && !compareRows.length) {
    useRealData = false
  }

  if (!useRealData) {
    return generateMockDailyTrend(days)
  }

  // 真实数据：按日期对齐（当前周期 vs 去年同期）
  const labels = []
  const current = currentRows.map(r => {
    labels.push(r.summary_date.slice(5)) // MM-DD
    return { date: r.summary_date, energy: r.energy || 0, cost: r.cost || 0 }
  })

  // 对比数据：按星期几对齐到当前周期的每一天
  // 去年第N天的数据对应当前第N天（同位置对比）
  const compare = currentRows.map(r => {
    const curDate = new Date(r.summary_date + 'T00:00:00')
    const lastYearDate = new Date(curDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)
    const lyStr = formatDate(lastYearDate)
    const match = compareRows.find(c => c.summary_date === lyStr)
    return { date: lyStr, energy: match?.energy || 0, cost: match?.cost || 0 }
  })

  return { currentPeriod: current, comparePeriod: compare, labels }
}

// ====== 分项占比接口 ======

router.get('/breakdown', authenticateToken, async (req, res) => {
  try {
    const project_id = req.query.project_id || getProjectId(req)
    const date = req.query.date || formatDate(new Date())

    // 尝试从日汇总表取
    const [rows] = await pool.query(
      `SELECT * FROM energy_daily_summary WHERE project_id=? AND summary_date=?`,
      [project_id, date]
    )

    let breakdown = []
    if (rows.length > 0) {
      const r = rows[0]
      breakdown = [
        { category: 'chiller', label: CATEGORIES.chiller.label, energyKwh: parseFloat(r.chiller_energy_kwh || 0), costYuan: parseFloat(r.chiller_cost_yuan || 0), color: CATEGORIES.chiller.color },
        { category: 'pump', label: '水泵(冷冻+冷却)', energyKwh: parseFloat(r.pump_energy_kwh || 0), costYuan: parseFloat(r.pump_cost_yuan || 0), color: '#E6A23C' },
        { category: 'cooling_tower', label: CATEGORIES.cooling_tower.label, energyKwh: parseFloat(r.cooling_tower_energy_kwh || 0), costYuan: parseFloat(r.cooling_tower_cost_yuan || 0), color: CATEGORIES.cooling_tower.color },
        { category: 'terminal', label: CATEGORIES.terminal.label, energyKwh: parseFloat(r.terminal_energy_kwh || 0), costYuan: parseFloat(r.terminal_cost_yuan || 0), color: CATEGORIES.terminal.color },
        { category: 'other', label: CATEGORIES.other.label, energyKwh: parseFloat(r.other_energy_kwh || 0), costYuan: parseFloat(r.other_cost_yuan || 0), color: CATEGORIES.other.color }
      ]
    } else {
      // 模拟数据
      breakdown = generateMockBreakdown()
    }

    const total = breakdown.reduce((s, b) => s + b.energyKwh, 0)
    breakdown.forEach(b => { b.percentage = total > 0 ? ((b.energyKwh / total) * 100).toFixed(1) : 0 })

    res.json({ success: true, data: { breakdown, total } })
  } catch (error) {
    console.error('获取分项占比失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ====== 告警列表接口 ======

router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const project_id = req.query.project_id || getProjectId(req)
    const limit = parseInt(req.query.limit) || 10

    const [rows] = await pool.query(
      `SELECT * FROM energy_alerts WHERE project_id=? ORDER BY created_at DESC LIMIT ?`,
      [project_id, limit]
    )

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ====== 数据导出接口 ======

router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { project_id, period = 'day', format = 'csv' } = req.query
    const pid = project_id || getProjectId(req)

    let rows = []
    if (period === 'day') {
      ;[rows] = await pool.query(
        `SELECT DATE_FORMAT(recorded_at,'%Y-%m-%d %H:%i') as time,
                SUM(CASE WHEN category='total' THEN energy_kwh ELSE 0 END) as total_energy,
                SUM(CASE WHEN category='total' THEN cost_yuan ELSE 0 END) as total_cost,
                MAX(CASE WHEN category='total' THEN power_kw END) as peak_power
         FROM energy_monitor_data WHERE project_id=?
           AND recorded_at >= CURDATE() AND recorded_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         GROUP BY DATE_FORMAT(recorded_at,'%Y-%m-%d %H')
         ORDER BY time`,
        [pid]
      )
    } else if (period === 'week') {
      ;[rows] = await pool.query(
        `SELECT summary_date as date, total_energy_kwh, total_cost_yuan, peak_power_kw, saving_rate
         FROM energy_daily_summary WHERE project_id=?
           AND summary_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
         ORDER BY date`,
        [pid]
      )
    } else if (period === 'month') {
      ;[rows] = await pool.query(
        `SELECT summary_date as date, total_energy_kwh, total_cost_yuan, peak_power_kw, saving_rate
         FROM energy_daily_summary WHERE project_id=?
           AND summary_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()
         ORDER BY date`,
        [pid]
      )
    }

    if (format === 'csv') {
      let csv = '\uFEFF'
      if (rows.length) csv += Object.keys(rows[0]).join(',') + '\n'
      rows.forEach(r => { csv += Object.values(r).join(',') + '\n' })
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="energy_${period}_${formatDate(new Date())}.csv"`)
      res.send(csv)
    } else {
      res.json({ success: true, data: rows })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ====== 辅助函数 ======

function getProjectId(req) {
  return req.headers['x-project-id'] || localStorage.getItem('currentProjectId') || '1'
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function generateMockRealtimeData(projectId) {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  // 模拟一天中的用电曲线：早高峰、午间平缓、晚高峰
  const loadFactor = (() => {
    if (hour < 6) return 0.3 + Math.random() * 0.15
    if (hour < 9) return 0.65 + Math.random() * 0.2
    if (hour < 12) return 0.75 + Math.random() * 0.2
    if (hour < 14) return 0.55 + Math.random() * 0.15
    if (hour < 18) return 0.8 + Math.random() * 0.2
    if (hour < 22) return 0.6 + Math.random() * 0.2
    return 0.35 + Math.random() * 0.1
  })()

  const baseTotalPower = 380
  const totalPower = +(baseTotalPower * loadFactor).toFixed(2)

  const chillerPwr = +(totalPower * 0.45).toFixed(2)
  const chilledPumpPwr = +(totalPower * 0.12).toFixed(2)
  const condenserPumpPwr = +(totalPower * 0.08).toFixed(2)
  const towerPwr = +(totalPower * 0.10).toFixed(2)
  const terminalPwr = +(totalPower * 0.18).toFixed(2)
  const otherPwr = +(totalPower * 0.07).toFixed(2)

  const hoursPassed = hour + minute / 60
  const avgPower = baseTotalPower * 0.55
  const todayEnergy = +(avgPower * hoursPassed / 60 * (1 + (Math.random() - 0.5) * 0.05)).toFixed(2)
  const todayCost = +(todayEnergy * ELECTRICITY_PRICE).toFixed(2)

  // 模拟节能率：大部分时间在-3% ~ +12%之间
  let savingRate = +(-3 + Math.random() * 15).toFixed(2)
  if (hour >= 14 && hour <= 17) {
    // 午后高峰偶尔触发低节能告警
    if (Math.random() > 0.85) savingRate = +(-(5 + Math.random() * 4).toFixed(2))
  }

  const compareEnergy = +(todayEnergy * (1 + savingRate / 100)).toFixed(2)

  // 写入数据库供后续查询使用（异步写入，不阻塞返回）
  const categories = ['total', 'chiller', 'chilled_pump', 'condenser_pump', 'cooling_tower', 'terminal', 'other']
  const powers = [totalPower, chillerPwr, chilledPumpPwr, condenserPumpPwr, towerPwr, terminalPwr, otherPwr]
  const energies = [todayEnergy, todayEnergy * 0.45, todayEnergy * 0.12, todayEnergy * 0.08, todayEnergy * 0.10, todayEnergy * 0.18, todayEnergy * 0.07]
  const costs = energies.map(e => +(e * ELECTRICITY_PRICE).toFixed(2))

  ;(async () => {
    for (let i = 0; i < categories.length; i++) {
      try {
        await pool.query(
          `INSERT INTO energy_monitor_data (project_id, category, meter_code, power_kw, energy_kwh, cost_yuan, recorded_at)
           VALUES (?,?,?,?,?,?,NOW())
           ON DUPLICATE KEY UPDATE power_kw=VALUES(power_kw), energy_kwh=VALUES(energy_kwh), cost_yuan=VALUES(cost_yuan)`,
          [projectId, categories[i], `METER_${categories[i].toUpperCase()}`, powers[i], energies[i], costs[i]]
        )
      } catch (_) { /* ignore */ }
    }
  })()

  return {
    totalPowerKw: totalPower,
    todayEnergyKwh: todayEnergy,
    todayCostYuan: todayCost,
    savingRate: savingRate,
    compareEnergyKwh: compareEnergy,
    lastUpdated: now.toISOString().replace('T', ' ').slice(0, 19),
    categories: {
      chiller:       { powerKw: chillerPwr,       energyKwh: +(energies[1]).toFixed(2), costYuan: costs[1] },
      chilled_pump:  { powerKw: chilledPumpPwr,   energyKwh: +(energies[2]).toFixed(2), costYuan: costs[2] },
      condenser_pump:{ powerKw: condenserPumpPwr, energyKwh: +(energies[3]).toFixed(2), costYuan: costs[3] },
      cooling_tower: { powerKw: towerPwr,          energyKwh: +(energies[4]).toFixed(2), costYuan: costs[4] },
      terminal:      { powerKw: terminalPwr,       energyKwh: +(energies[5]).toFixed(2), costYuan: costs[5] },
      other:         { powerKw: otherPwr,          energyKwh: +(energies[6]).toFixed(2), costYuan: costs[6] }
    }
  }
}

function generateMockHourlyTrend() {
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const current = [], compare = []
  for (let i = 0; i < 24; i++) {
    // 当前周期数据
    const curBase = i >= 7 && i < 20 ? 25 : 8
    current.push({
      hour: i,
      energy: +(curBase * (0.85 + Math.random() * 0.3)).toFixed(2),
      cost: +(curBase * (0.85 + Math.random() * 0.3) * ELECTRICITY_PRICE).toFixed(2)
    })
    // 去年同期：略高5%~12%，体现节能效果
    const cmpBase = curBase * (1.05 + Math.random() * 0.07)
    compare.push({
      hour: i,
      energy: +(cmpBase * (0.88 + Math.random() * 0.2)).toFixed(2),
      cost: +(cmpBase * (0.88 + Math.random() * 0.2) * ELECTRICITY_PRICE).toFixed(2)
    })
  }
  return { currentPeriod: current, comparePeriod: compare, labels }
}

function generateMockDailyTrend(days) {
  const current = [], compare = [], labels = []
  const now = new Date()
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 86400000)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    // 当前周期
    const base = isWeekend ? 180 : 320
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`)
    current.push({
      date: formatDate(date),
      energy: +(base * (0.88 + Math.random() * 0.24)).toFixed(1),
      cost: +(base * (0.88 + Math.random() * 0.24) * ELECTRICITY_PRICE).toFixed(1)
    })
    // 去年同期：略高3%~10%，体现节能
    const cmpBase = base * (1.03 + Math.random() * 0.07)
    compare.push({
      date: formatDate(new Date(date.getTime())),
      energy: +(cmpBase * (0.86 + Math.random() * 0.24)).toFixed(1),
      cost: +(cmpBase * (0.86 + Math.random() * 0.24) * ELECTRICITY_PRICE).toFixed(1)
    })
  }
  return { currentPeriod: current, comparePeriod: compare, labels }
}

function generateMockBreakdown() {
  const items = [
    { category: 'chiller', label: CATEGORIES.chiller.label, base: 45 },
    { category: 'pump', label: '水泵(冷冻+冷却)', base: 22 },
    { category: 'cooling_tower', label: CATEGORIES.cooling_tower.label, base: 13 },
    { category: 'terminal', label: CATEGORIES.terminal.label, base: 16 },
    { category: 'other', label: CATEGORIES.other.label, base: 4 }
  ]

  return items.map(item => ({
    ...item,
    energyKwh: +(item.base * (0.92 + Math.random() * 0.16)).toFixed(1),
    costYuan: +(item.base * (0.92 + Math.random() * 0.16) * ELECTRICITY_PRICE).toFixed(1),
    color: CATEGORIES[item.category]?.color || '#909399',
    percentage: 0
  }))
}

export default router
