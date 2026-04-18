/**
 * 能耗监测测试数据生成脚本
 * 往 energy_monitor_data 和 energy_daily_summary 插入今年+去年同期数据
 * 节能率约17%：今年值 = 去年值 * (1 - 0.17) ± 随机波动
 *
 * 用法：node scripts/seed-energy-data.js
 */
import pool from '../src/config/database.js'

const PROJECT_ID = '1'
const SAVING_RATE = 0.17        // 目标节能率 17%
const PRICE_PER_KWH = 0.85      // 电价 元/kWh
const CATEGORIES = ['total', 'chiller', 'chilled_pump', 'condenser_pump', 'cooling_tower', 'terminal', 'other']

// 各分项占比权重（总和=1）
const CATEGORY_WEIGHTS = {
  total:            { baseEnergy: 1.00, powerRatio: 1.00 },
  chiller:          { baseEnergy: 0.45, powerRatio: 0.45 },
  chilled_pump:     { baseEnergy: 0.12, powerRatio: 0.12 },
  condenser_pump:   { baseEnergy: 0.08, powerRatio: 0.08 },
  cooling_tower:    { baseEnergy: 0.10, powerRatio: 0.10 },
  terminal:         { baseEnergy: 0.18, powerRatio: 0.18 },
  other:            { baseEnergy: 0.07, powerRatio: 0.07 }
}

// 一天中每小时的负载系数
function hourLoadFactor(hour) {
  if (hour < 6)    return 0.25 + Math.random() * 0.10
  if (hour < 9)    return 0.60 + Math.random() * 0.15
  if (hour < 12)   return 0.75 + Math.random() * 0.15
  if (hour < 14)   return 0.55 + Math.random() * 0.12
  if (hour < 18)   return 0.80 + Math.random() * 0.15
  if (hour < 22)   return 0.60 + Math.random() * 0.15
  return 0.30 + Math.random() * 0.10
}

// 工作日/周末基础能耗倍率
function dayBase(date) {
  const dow = date.getDay()
  const isWeekend = dow === 0 || dow === 6
  // 季节因素：夏季(6-8月)高，过渡季中等，冬季略低
  const month = date.getMonth()
  let seasonFactor = 1.0
  if (month >= 5 && month <= 7) seasonFactor = 1.20   // 夏季
  else if (month >= 8 && month <= 10) seasonFactor = 1.05  // 秋季
  else if (month >= 11 || month <= 1) seasonFactor = 0.90  // 冬季
  else seasonFactor = 1.0                               // 春季

  const dayFactor = isWeekend ? 0.55 : 1.0
  return 320 * dayFactor * seasonFactor   // 日均基准 kWh
}

function fmt(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

// 带波动的随机数
function jitter(val, range = 0.08) {
  return val * (1 - range / 2 + Math.random() * range)
}

async function clearOldData() {
  console.log('🗑️  清理旧测试数据...')
  await pool.query('DELETE FROM energy_alerts WHERE project_id = ?', [PROJECT_ID])
  await pool.query('DELETE FROM energy_monitor_data WHERE project_id = ?', [PROJECT_ID])
  await pool.query('DELETE FROM energy_daily_summary WHERE project_id = ?', [PROJECT_ID])
  console.log('✅ 清理完成\n')
}

async function insertDailySummaries() {
  console.log('📊 生成日汇总数据...')

  const now = new Date()
  const todayStr = fmtDate(now)

  // 生成最近40天的日汇总（覆盖月视图）
  const daysToGenerate = 40
  const dailyValues = []

  for (let d = daysToGenerate - 1; d >= 0; d--) {
    const curDate = new Date(now.getTime() - d * 86400000)
    const curDateStr = fmtDate(curDate)

    // 去年同期
    const lyDate = new Date(curDate)
    lyDate.setFullYear(lyDate.getFullYear() - 1)
    const lyDateStr = fmtDate(lyDate)

    const base = dayBase(curDate)

    // 今年数据（已节能）
    const curTotalEnergy = jitter(base * (1 - SAVING_RATE), 0.12)
    const curTotalCost = +(curTotalEnergy * PRICE_PER_KWH).toFixed(2)

    // 去年同期数据
    const lyTotalEnergy = jitter(base, 0.12)
    const lyTotalCost = +(lyTotalEnergy * PRICE_PER_KWH).toFixed(2)

    // 计算实际节能率
    const actualSavingRate = +(((lyTotalEnergy - curTotalEnergy) / lyTotalEnergy) * 100).toFixed(2)

    // 分项能耗
    const curCategories = {}
    const lyCategories = {}

    CATEGORIES.forEach(cat => {
      if (cat === 'total') return
      const w = CATEGORY_WEIGHTS[cat].baseEnergy
      curCategories[cat] = {
        energy: +(jitter(curTotalEnergy * w, 0.15)).toFixed(2),
        cost: 0
      }
      curCategories[cat].cost = +(curCategories[cat].energy * PRICE_PER_KWH).toFixed(2)

      lyCategories[cat] = {
        energy: +(jitter(lyTotalEnergy * w, 0.15)).toFixed(2),
        cost: 0
      }
      lyCategories[cat].cost = +(lyCategories[cat].energy * PRICE_PER_KWH).toFixed(2)
    })

    // 插入今年的日汇总
    dailyValues.push([
      PROJECT_ID, curDateStr,
      curTotalEnergy.toFixed(2), curTotalCost,
      curCategories.chiller.energy, curCategories.chiller.cost,
      (+curCategories.chilled_pump.energy + +curCategories.condenser_pump.energy).toFixed(2),
      (+curCategories.chilled_pump.cost + +curCategories.condenser_pump.cost).toFixed(2),
      curCategories.cooling_tower.energy, curCategories.cooling_tower.cost,
      curCategories.terminal.energy, curCategories.terminal.cost,
      curCategories.other.energy, curCategories.other.cost,
      +(base * CATEGORY_WEIGHTS.total.powerRatio * (1 - SAVING_RATE) * 0.9 / 24).toFixed(2),  // peak
      +(curTotalEnergy / 24).toFixed(2),     // avg
      actualSavingRate,
      lyDateStr, lyTotalEnergy.toFixed(2)
    ])

    // 插入去年同期的日汇总
    dailyValues.push([
      PROJECT_ID, lyDateStr,
      lyTotalEnergy.toFixed(2), lyTotalCost,
      lyCategories.chiller.energy, lyCategories.chiller.cost,
      (+lyCategories.chilled_pump.energy + +lyCategories.condenser_pump.energy).toFixed(2),
      (+lyCategories.chilled_pump.cost + +lyCategories.condenser_pump.cost).toFixed(2),
      lyCategories.cooling_tower.energy, lyCategories.cooling_tower.cost,
      lyCategories.terminal.energy, lyCategories.terminal.cost,
      lyCategories.other.energy, lyCategories.other.cost,
      +(base * CATEGORY_WEIGHTS.total.powerRatio * 0.9 / 24).toFixed(2),  // peak
      +(lyTotalEnergy / 24).toFixed(2),     // avg
      0,                                   // 去年无对比
      null, null
    ])
  }

  // 批量写入
  const sql = `
    INSERT INTO energy_daily_summary (
      project_id, summary_date,
      total_energy_kwh, total_cost_yuan,
      chiller_energy_kwh, chiller_cost_yuan,
      pump_energy_kwh, pump_cost_yuan,
      cooling_tower_energy_kwh, cooling_tower_cost_yuan,
      terminal_energy_kwh, terminal_cost_yuan,
      other_energy_kwh, other_cost_yuan,
      peak_power_kw, avg_power_kw,
      saving_rate, compare_date, compare_energy_kwh
    ) VALUES ?
  `
  await pool.query(sql, [dailyValues])
  console.log(`✅ 日汇总完成：${dailyValues.length} 条（今年${daysToGenerate}天 + 去年同期${daysToGenerate}天）`)
}

async function insertHourlyData() {
  console.log('\n⏰  生成小时级监测数据...')

  const now = new Date()

  // ---- 今天的小时数据 ----
  const todayStr = fmtDate(now)
  const currentHour = now.getHours()
  const todayRows = []

  for (let h = 0; h <= currentHour; h++) {
    const load = hourLoadFactor(h)
    const basePower = 380 * load  // kW 基准功率

    CATEGORIES.forEach(cat => {
      const w = CATEGORY_WEIGHTS[cat]
      const power = +(basePower * w.powerRatio * (1 - SAVING_RATE * 0.5) * (0.92 + Math.random() * 0.16)).toFixed(2)
      const hourlyEnergy = +(power * 1 * (0.95 + Math.random() * 0.1)).toFixed(2)  // 每小时kWh
      const cost = +(hourlyEnergy * PRICE_PER_KWH).toFixed(2)
      const ts = `${todayStr} ${String(h).padStart(2, '0')}:30:00`

      todayRows.push([PROJECT_ID, cat, `METER_${cat.toUpperCase()}`, power, hourlyEnergy, cost, ts])
    })
  }

  // ---- 去年同期同日的小时数据（完整24小时）----
  const lyToday = new Date(now)
  lyToday.setFullYear(lyToday.getFullYear() - 1)
  const lyTodayStr = fmtDate(lyToday)
  const lyRows = []

  for (let h = 0; h < 24; h++) {
    const load = hourLoadFactor(h)
    const basePower = 380 * load

    CATEGORIES.forEach(cat => {
      const w = CATEGORY_WEIGHTS[cat]
      // 去年的功率更高（未节能）
      const power = +(basePower * w.powerRatio * (0.94 + Math.random() * 0.16)).toFixed(2)
      const hourlyEnergy = +(power * 1 * (0.93 + Math.random() * 0.14)).toFixed(2)
      const cost = +(hourlyEnergy * PRICE_PER_KWH).toFixed(2)
      const ts = `${lyTodayStr} ${String(h).padStart(2, '0')}:30:00`

      lyRows.push([PROJECT_ID, cat, `METER_${cat.toUpperCase()}`, power, hourlyEnergy, cost, ts])
    })
  }

  // ---- 最近7天每天的部分小时数据（用于周视图）----
  const weekRows = []
  for (let d = 1; d <= 7; d++) {
    const pastDate = new Date(now.getTime() - d * 86400000)
    const dateStr = fmtDate(pastDate)
    const base = dayBase(pastDate)

    for (let h = 0; h < 24; h++) {
      const load = hourLoadFactor(h)
      const basePower = 380 * load

      CATEGORIES.forEach(cat => {
        const w = CATEGORY_WEIGHTS[cat]
        const power = +(basePower * w.powerRatio * (1 - SAVING_RATE * 0.5) * (0.90 + Math.random() * 0.18)).toFixed(2)
        const hourlyEnergy = +(power * 1 * (0.92 + Math.random() * 0.14)).toFixed(2)
        const cost = +(hourlyEnergy * PRICE_PER_KWH).toFixed(2)
        const ts = `${dateStr} ${String(h).padStart(2, '0')}:15:00`

        weekRows.push([PROJECT_ID, cat, `METER_${cat.toUpperCase()}`, power, hourlyEnergy, cost, ts])
      })

      // 对应的去年同期
      const lyDate = new Date(pastDate)
      lyDate.setFullYear(lyDate.getFullYear() - 1)
      const lyDateStr = fmtDate(lyDate)
      const lyLoad = hourLoadFactor(h)
      const lyBasePower = 380 * lyLoad

      CATEGORIES.forEach(cat => {
        const w = CATEGORY_WEIGHTS[cat]
        const power = +(lyBasePower * w.powerRatio * (0.92 + Math.random() * 0.18)).toFixed(2)
        const hourlyEnergy = +(power * 1 * (0.90 + Math.random() * 0.18)).toFixed(2)
        const cost = +(hourlyEnergy * PRICE_PER_KWH).toFixed(2)
        const ts = `${lyDateStr} ${String(h).padStart(2, '0')}:15:00`

        weekRows.push([PROJECT_ID, cat, `METER_${cat.toUpperCase()}`, power, hourlyEnergy, cost, ts])
      })
    }
  }

  const allRows = [...todayRows, ...lyRows, ...weekRows]

  const sql = `
    INSERT INTO energy_monitor_data (project_id, category, meter_code, power_kw, energy_kwh, cost_yuan, recorded_at)
    VALUES ?
  `
  await pool.query(sql, [allRows])
  console.log(`✅ 小时级数据完成：${allRows.length} 条`)
  console.log(`   - 今日：${todayRows.length} 条（到当前${currentHour}点）`)
  console.log(`   - 去年今日：${lyRows.length} 条（24小时全量）`)
  console.log(`   - 近7天+去年同期：${weekRows.length} 条`)
}

async function insertAlerts() {
  console.log('\n🔔  生成告警数据...')

  const finalAlerts = [
    [PROJECT_ID, 'saving_low', 'warning',
      '节能率偏低提醒',
      '当前节能率为-6.2%，低于阈值-5%，请检查设备运行策略',
      -6.2, -5.0, '%',
      0, null, null, new Date()],
    [PROJECT_ID, 'power_peak', 'info',
      '功率接近峰值',
      '当前总功率412kW，接近今日峰值450kW',
      412.0, 450.0, 'kW',
      1, 'admin', new Date(), new Date(Date.now() - 14400000)]
  ]

  const sql = `
    INSERT INTO energy_alerts (project_id, alert_type, level, title, message, current_value, threshold_value, unit, is_acknowledged, acknowledged_by, acknowledged_at, created_at)
    VALUES ?
  `

  await pool.query(sql, [finalAlerts])
  console.log(`✅ 告警数据完成：${finalAlerts.length} 条`)
}

async function main() {
  try {
    console.log('═══════════════════════════════════════')
    console.log('  能耗监测测试数据生成工具')
    console.log(`  项目ID: ${PROJECT_ID}`)
    console.log(`  目标节能率: ${(SAVING_RATE * 100).toFixed(0)}%`)
    console.log('═══════════════════════════════════════\n')

    await clearOldData()
    await insertDailySummaries()
    await insertHourlyData()
    await insertAlerts()

    console.log('\n═══════════════════════════════════════')
    console.log('  🎉 所有测试数据生成完毕！')
    console.log('═══════════════════════════════════════')

    process.exit(0)
  } catch (error) {
    console.error('❌ 生成失败:', error)
    process.exit(1)
  }
}

main()
