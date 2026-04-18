import express from 'express'
const router = express.Router()
import pool from '../config/database.js'

// DeepSeek API 运行时配置（从数据库加载）
const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  apiKey: ''
}

// 启动时从数据库加载API Key
async function loadApiKeyFromDB() {
  try {
    const [rows] = await pool.query('SELECT * FROM api_keys WHERE provider = ? AND is_active = 1', ['deepseek'])
    if (rows.length > 0) {
      DEEPSEEK_CONFIG.apiKey = rows[0].api_key
      DEEPSEEK_CONFIG.apiUrl = rows[0].api_url || DEEPSEEK_CONFIG.apiUrl
      DEEPSEEK_CONFIG.model = rows[0].model || DEEPSEEK_CONFIG.model
      console.log('✅ DeepSeek API Key 已从数据库加载')
    }
  } catch (error) {
    console.log('⚠️ 从数据库加载API Key失败，使用内存配置:', error.message)
    DEEPSEEK_CONFIG.apiKey = process.env.DEEPSEEK_API_KEY || ''
  }
}

// 脱敏处理API Key
function maskApiKey(key) {
  if (!key) return ''
  if (key.length <= 8) return '****'
  const prefix = key.substring(0, 8)
  const suffix = key.substring(key.length - 4)
  return `${prefix}...${suffix}`
}

// 设置API Key - 保存到数据库
router.post('/api-key', async (req, res) => {
  const { apiKey } = req.body
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'API Key is required' })
  }

  try {
    // Upsert: 存在则更新，不存在则插入
    const [existing] = await pool.query('SELECT id FROM api_keys WHERE provider = ?', ['deepseek'])
    
    if (existing.length > 0) {
      await pool.query(
        'UPDATE api_keys SET api_key = ?, updated_at = NOW() WHERE provider = ?',
        [apiKey, 'deepseek']
      )
    } else {
      await pool.query(
        'INSERT INTO api_keys (provider, api_key, api_url, model, is_active) VALUES (?, ?, ?, ?, 1)',
        ['deepseek', apiKey, DEEPSEEK_CONFIG.apiUrl, DEEPSEEK_CONFIG.model]
      )
    }

    // 更新内存配置
    DEEPSEEK_CONFIG.apiKey = apiKey

    res.json({ success: true, message: 'API Key saved to database' })
  } catch (error) {
    console.error('Save API Key error:', error)
    // 数据库失败时回退到内存
    DEEPSEEK_CONFIG.apiKey = apiKey
    res.json({ success: true, message: 'API Key saved (memory fallback)' })
  }
})

// 检查API Key状态 - 从数据库读取
router.get('/api-key-status', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM api_keys WHERE provider = ? AND is_active = 1', ['deepseek'])
    
    if (rows.length > 0) {
      const row = rows[0]
      // 同步内存
      DEEPSEEK_CONFIG.apiKey = row.api_key
      DEEPSEEK_CONFIG.apiUrl = row.api_url || DEEPSEEK_CONFIG.apiUrl
      DEEPSEEK_CONFIG.model = row.model || DEEPSEEK_CONFIG.model

      res.json({
        success: true,
        hasKey: true,
        maskedKey: maskApiKey(row.api_key),
        method: 'deepseek',
        lastVerifiedAt: row.last_verified_at,
        lastVerifiedStatus: row.last_verified_status,
        model: row.model || DEEPSEEK_CONFIG.model,
        updatedAt: row.updated_at
      })
    } else {
      // 检查内存中的Key
      const hasMemoryKey = !!DEEPSEEK_CONFIG.apiKey
      res.json({
        success: true,
        hasKey: hasMemoryKey,
        maskedKey: hasMemoryKey ? maskApiKey(DEEPSEEK_CONFIG.apiKey) : '',
        method: hasMemoryKey ? 'deepseek' : 'local',
        lastVerifiedAt: null,
        lastVerifiedStatus: null,
        model: DEEPSEEK_CONFIG.model,
        updatedAt: null
      })
    }
  } catch (error) {
    // 数据库失败时回退到内存
    const hasMemoryKey = !!DEEPSEEK_CONFIG.apiKey
    res.json({
      success: true,
      hasKey: hasMemoryKey,
      maskedKey: hasMemoryKey ? maskApiKey(DEEPSEEK_CONFIG.apiKey) : '',
      method: hasMemoryKey ? 'deepseek' : 'local'
    })
  }
})

// 实时校验API Key是否通畅
router.post('/verify-api-key', async (req, res) => {
  const { apiKey } = req.body
  const keyToVerify = apiKey || DEEPSEEK_CONFIG.apiKey

  if (!keyToVerify) {
    return res.json({
      success: false,
      status: 'failed',
      message: 'No API Key to verify'
    })
  }

  try {
    const startTime = Date.now()
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keyToVerify}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        max_tokens: 5
      }),
      signal: AbortSignal.timeout(15000) // 15秒超时
    })

    const latency = Date.now() - startTime

    if (response.ok) {
      // 更新数据库校验状态
      try {
        await pool.query(
          'UPDATE api_keys SET last_verified_at = NOW(), last_verified_status = ? WHERE provider = ?',
          ['success', 'deepseek']
        )
      } catch (dbError) {
        // ignore db error
      }

      res.json({
        success: true,
        status: 'success',
        message: 'API Key验证成功，连接正常',
        latency: latency,
        maskedKey: maskApiKey(keyToVerify)
      })
    } else {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || `HTTP ${response.status}`
      
      // 更新数据库校验状态
      try {
        await pool.query(
          'UPDATE api_keys SET last_verified_at = NOW(), last_verified_status = ? WHERE provider = ?',
          ['failed', 'deepseek']
        )
      } catch (dbError) {
        // ignore db error
      }

      res.json({
        success: false,
        status: 'failed',
        message: `API Key验证失败: ${errorMsg}`,
        latency: latency
      })
    }
  } catch (error) {
    // 更新数据库校验状态
    try {
      await pool.query(
        'UPDATE api_keys SET last_verified_at = NOW(), last_verified_status = ? WHERE provider = ?',
        ['failed', 'deepseek']
      )
    } catch (dbError) {
      // ignore db error
    }

    res.json({
      success: false,
      status: 'failed',
      message: `连接失败: ${error.message}`,
      latency: 0
    })
  }
})

// 删除API Key
router.delete('/api-key', async (req, res) => {
  try {
    await pool.query('DELETE FROM api_keys WHERE provider = ?', ['deepseek'])
    DEEPSEEK_CONFIG.apiKey = ''
    res.json({ success: true, message: 'API Key deleted' })
  } catch (error) {
    DEEPSEEK_CONFIG.apiKey = ''
    res.json({ success: true, message: 'API Key deleted (memory only)' })
  }
})

// 构建提示词 - 支持新的嵌套字段结构
function buildPrompt(formData, isCN) {
  const buildingTypes = {
    office: { zh: '写字楼', en: 'Office Building' },
    mall: { zh: '商场', en: 'Shopping Mall' },
    hotel: { zh: '酒店', en: 'Hotel' },
    hospital: { zh: '医院', en: 'Hospital' },
    data: { zh: '数据中心', en: 'Data Center' },
    industrial: { zh: '工业厂房', en: 'Industrial' }
  }
  
  const acTypes = {
    air_chiller: { zh: '风冷冷水机组', en: 'Air-cooled Chiller' },
    water_chiller: { zh: '水冷冷水机组', en: 'Water-cooled Chiller' },
    vrf: { zh: 'VRF多联机', en: 'VRF System' },
    heat_pump: { zh: '水源热泵', en: 'Water Source Heat Pump' }
  }
  
  const compressorTypes = {
    centrifugal: { zh: '离心式', en: 'Centrifugal' },
    screw: { zh: '螺杆式', en: 'Screw' },
    piston: { zh: '活塞式', en: 'Piston' }
  }
  
  const controlModes = {
    manual: { zh: '本地手动', en: 'Manual' },
    plc: { zh: '简单PLC', en: 'Simple PLC' },
    comm: { zh: '有通讯接口', en: 'Communication' }
  }
  
  const chiller = formData.chiller || {}
  const chilledPump = formData.chilledPump || {}
  const condenserPump = formData.condenserPump || {}
  const coolingTower = formData.coolingTower || {}
  const terminal = formData.terminal || {}
  const valves = formData.valves || {}
  
  const typeName = buildingTypes[formData.buildingType]?.[isCN ? 'zh' : 'en'] || formData.buildingType
  const acTypeName = acTypes[formData.acType]?.[isCN ? 'zh' : 'en'] || formData.acType
  const compressorName = compressorTypes[chiller.compressorType]?.[isCN ? 'zh' : 'en'] || chiller.compressorType
  const controlModeName = controlModes[chiller.controlMode]?.[isCN ? 'zh' : 'en'] || chiller.controlMode

  const systemPrompt = isCN ? 
`你是专业的暖通空调工程师，精通建筑中央空调系统节能分析。

## 基础信息
- 建筑类型: ${typeName}
- 建筑面积: ${formData.buildingArea || 0} m²
- 是否满载运行: ${formData.isFullLoad ? '是' : '否'}
- 运行天数: ${formData.operatingDays || 0} 天/年
- 空调类型: ${acTypeName}
- 空调费用占比: ${formData.acCostRatio || 0}%
- 电单价: ${formData.electricityPrice || 0} ¥/kWh
- 近12月电费: ${formData.electricityBills || '未提供'}
- 客户预期节能率: ${formData.expectedSaving || 0}%

## 冷水机组参数
- 品牌: ${chiller.brand || '未知'}
- 型号: ${chiller.model || '未知'}
- 出厂年份: ${chiller.year || '未知'}
- 铭牌制冷量: ${chiller.capacity || 0} RT
- 额定输入功率: ${chiller.ratedPower || 0} kW
- COP: ${chiller.cop || 0}
- IPLV: ${chiller.iplv || 0}
- 压缩机类型: ${compressorName}
- 冷媒种类: ${chiller.refrigerant || '未知'}
- 现有控制方式: ${controlModeName}
- 冷机数量: ${chiller.quantity || 1} 台

## 冷冻水泵参数
- 额定流量: ${chilledPump.flowRate || 0} m³/h
- 额定扬程: ${chilledPump.head || 0} m
- 额定功率: ${chilledPump.power || 0} kW
- 电机额定电压: ${chilledPump.voltage || 0} V
- 额定电流: ${chilledPump.current || 0} A
- 额定转速: ${chilledPump.rpm || 0} rpm
- 是否有变频器: ${chilledPump.hasVfd ? '有' : '无'}

## 冷却水泵参数
- 额定流量: ${condenserPump.flowRate || 0} m³/h
- 额定扬程: ${condenserPump.head || 0} m
- 额定功率: ${condenserPump.power || 0} kW
- 是否有变频器: ${condenserPump.hasVfd ? '有' : '无'}

## 冷却塔参数
- 品牌: ${coolingTower.brand || '未知'}
- 型号: ${coolingTower.model || '未知'}
- 台数: ${coolingTower.quantity || 0} 台
- 额定处理流量: ${coolingTower.flowRate || 0} m³/h
- 风机电机功率: ${coolingTower.fanPower || 0} kW
- 设计进水温度: ${coolingTower.inletTemp || 37} °C
- 设计出水温度: ${coolingTower.outletTemp || 32} °C
- 设计湿球温度: ${coolingTower.wetBulbTemp || 28} °C
- 风机是否变频: ${coolingTower.variableFan ? '是' : '否'}

## 末端设备参数
- AHU/FCU台数: ${terminal.ahuQuantity || 0}
- 新风机组台数: ${terminal.fauQuantity || 0}
- 总末端台数: ${terminal.totalQuantity || 0}
- 是否有电动二通阀: ${terminal.hasValve ? '有' : '无'}
- 温控器类型: ${terminal.thermostatType || '未知'}
- 滤网清洁状况: ${terminal.filterCondition || '未知'}

## 阀门与管路
- 旁通阀类型: ${valves.bypassValve === 'electric' ? '电动旁通阀' : '手动阀'}
- 平衡阀类型: ${valves.balanceValve === 'dynamic' ? '动态平衡阀' : '静态平衡阀'}
- 管路保温状况: ${valves.insulation || '未知'}
- 是否有智能电表: ${valves.hasSmartMeter ? '有' : '无'}

## 分析任务
根据以上参数，分析中央空调系统的节能潜力，并返回JSON格式结果：
{
    "totalSaving": 总节能率 (0-50),
    "yearlySavingKwh": 年节电量 (kWh),
    "confidence": 可信度 (0.5-1.0),
    "breakdown": [
        {"name": "冷水机组", "saving": 节能率, "color": "#409eff"},
        {"name": "水泵系统", "saving": 节能率, "color": "#67c23a"},
        {"name": "冷却塔", "saving": 节能率, "color": "#909399"},
        {"name": "末端设备", "saving": 节能率, "color": "#e6a23c"},
        {"name": "智能控制", "saving": 节能率, "color": "#6f42c1"}
    ],
    "recommendations": ["建议1", "建议2", "建议3"]
}
只返回JSON，不要其他内容。` :
`You are a professional HVAC engineer specializing in building central air conditioning energy analysis.

## Basic Information
- Building Type: ${typeName}
- Building Area: ${formData.buildingArea || 0} m²
- Full Load Operation: ${formData.isFullLoad ? 'Yes' : 'No'}
- Operating Days: ${formData.operatingDays || 0} days/year
- AC Type: ${acTypeName}
- AC Cost Ratio: ${formData.acCostRatio || 0}%
- Electricity Price: ${formData.electricityPrice || 0} ¥/kWh
- Last 12 Months Bills: ${formData.electricityBills || 'Not provided'}
- Expected Saving Rate: ${formData.expectedSaving || 0}%

## Chiller Parameters
- Brand: ${chiller.brand || 'Unknown'}
- Model: ${chiller.model || 'Unknown'}
- Year: ${chiller.year || 'Unknown'}
- Rated Capacity: ${chiller.capacity || 0} RT
- Rated Power: ${chiller.ratedPower || 0} kW
- COP: ${chiller.cop || 0}
- IPLV: ${chiller.iplv || 0}
- Compressor Type: ${compressorName}
- Refrigerant: ${chiller.refrigerant || 'Unknown'}
- Control Mode: ${controlModeName}
- Quantity: ${chiller.quantity || 1} units

## Chilled Water Pump
- Flow Rate: ${chilledPump.flowRate || 0} m³/h
- Head: ${chilledPump.head || 0} m
- Power: ${chilledPump.power || 0} kW
- Has VFD: ${chilledPump.hasVfd ? 'Yes' : 'No'}

## Condenser Water Pump
- Flow Rate: ${condenserPump.flowRate || 0} m³/h
- Head: ${condenserPump.head || 0} m
- Power: ${condenserPump.power || 0} kW
- Has VFD: ${condenserPump.hasVfd ? 'Yes' : 'No'}

## Cooling Tower
- Brand: ${coolingTower.brand || 'Unknown'}
- Quantity: ${coolingTower.quantity || 0} units
- Flow Rate: ${coolingTower.flowRate || 0} m³/h
- Fan Power: ${coolingTower.fanPower || 0} kW
- Inlet Temp: ${coolingTower.inletTemp || 37} °C
- Outlet Temp: ${coolingTower.outletTemp || 32} °C
- Wet Bulb Temp: ${coolingTower.wetBulbTemp || 28} °C
- Variable Fan: ${coolingTower.variableFan ? 'Yes' : 'No'}

## Terminal Equipment
- AHU/FCU Count: ${terminal.ahuQuantity || 0}
- Fresh Air Unit Count: ${terminal.fauQuantity || 0}
- Total Terminals: ${terminal.totalQuantity || 0}
- Has Electric Valve: ${terminal.hasValve ? 'Yes' : 'No'}
- Thermostat Type: ${terminal.thermostatType || 'Unknown'}
- Filter Condition: ${terminal.filterCondition || 'Unknown'}

## Valves & Piping
- Bypass Valve: ${valves.bypassValve === 'electric' ? 'Electric' : 'Manual'}
- Balance Valve: ${valves.balanceValve === 'dynamic' ? 'Dynamic' : 'Static'}
- Insulation: ${valves.insulation || 'Unknown'}
- Has Smart Meter: ${valves.hasSmartMeter ? 'Yes' : 'No'}

## Task
Analyze the energy-saving potential and return JSON:
{
    "totalSaving": number (0-50),
    "yearlySavingKwh": number,
    "confidence": number (0.5-1.0),
    "breakdown": [
        {"name": "Chiller", "saving": number, "color": "#409eff"},
        {"name": "Pump", "saving": number, "color": "#67c23a"},
        {"name": "Tower", "saving": number, "color": "#909399"},
        {"name": "Terminal", "saving": number, "color": "#e6a23c"},
        {"name": "Control", "saving": number, "color": "#6f42c1"}
    ],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}
Only return JSON, no other content.`

  return systemPrompt
}

// 基于输入参数的确定性伪随机函数（替代Math.random，保证同样输入同样输出）
function deterministicHash(...args) {
  let hash = 0
  const str = args.join('-')
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // 映射到 0-1 之间
  return (Math.abs(hash) % 10000) / 10000
}

// 本地备用计算 - 完全确定性，同样输入必定产生同样输出
function localCalculation(formData) {
  const chiller = formData.chiller || {}
  const chilledPump = formData.chilledPump || {}
  const condenserPump = formData.condenserPump || {}
  const coolingTower = formData.coolingTower || {}
  const terminal = formData.terminal || {}
  const valves = formData.valves || {}

  // ========== 1. 冷水机组节能分析 ==========
  // COP越低，节能空间越大；旧设备节能空间更大
  const chillerCop = chiller.cop || 5.0
  const chillerYear = chiller.year || 2020
  const chillerAge = Math.max(0, 2026 - chillerYear)
  // COP效率因子：COP越低，改善空间越大
  const copFactor = Math.max(0.3, (6.0 - chillerCop) / 3.0)
  // 设备老化因子：每多1年+2%，上限20%
  const ageFactor = 1 + Math.min(0.2, chillerAge * 0.02)
  // 控制方式因子
  const controlModeFactor = chiller.controlMode === 'comm' ? 0.8 : chiller.controlMode === 'plc' ? 0.9 : 1.0
  // 压缩机类型：螺杆比离心节能空间稍大
  const compressorFactor = chiller.compressorType === 'screw' ? 1.1 : chiller.compressorType === 'piston' ? 1.15 : 1.0
  
  const chillerSaving = Math.min(22, Math.max(2, 
    8 * copFactor * ageFactor * controlModeFactor * compressorFactor
  ))

  // ========== 2. 水泵系统节能分析 ==========
  // 无变频器的水泵节能空间大；大功率水泵节能价值更高
  const chilledVfdFactor = chilledPump.hasVfd ? 0.4 : 1.0  // 有VFD则已节省，空间小
  const condenserVfdFactor = condenserPump.hasVfd ? 0.4 : 1.0
  // 水泵功率越大，变频节能效果越明显
  const pumpPowerFactor = Math.min(1.5, 1 + ((chilledPump.power || 30) + (condenserPump.power || 25)) / 200)
  // 扬程越高，变频收益越大
  const headFactor = Math.min(1.3, 1 + ((chilledPump.head || 30) + (condenserPump.head || 25)) / 100)
  // 满载运行时水泵节能空间更大
  const loadFactor = formData.isFullLoad ? 1.2 : 0.8
  
  const pumpSaving = Math.min(18, Math.max(2,
    8 * chilledVfdFactor * condenserVfdFactor * pumpPowerFactor * headFactor * loadFactor
  ))

  // ========== 3. 冷却塔节能分析 ==========
  // 进出水温差越大说明散热需求高，变频空间大
  const inletTemp = coolingTower.inletTemp || 37
  const outletTemp = coolingTower.outletTemp || 32
  const tempDiff = inletTemp - outletTemp
  const tempFactor = Math.min(1.5, 0.8 + tempDiff / 10)
  // 风机无变频，节能空间大
  const variableFanFactor = coolingTower.variableFan ? 0.5 : 1.0
  // 湿球温度高时冷却塔效率低，优化空间大
  const wetBulb = coolingTower.wetBulbTemp || 28
  const wetBulbFactor = Math.min(1.3, 0.8 + (wetBulb - 25) / 15)
  // 台数多则总节能价值大
  const quantityFactor = Math.min(1.4, 1 + (coolingTower.quantity || 2) / 10)
  
  const towerSaving = Math.min(14, Math.max(1.5,
    6 * tempFactor * variableFanFactor * wetBulbFactor * quantityFactor
  ))

  // ========== 4. 末端设备节能分析 ==========
  // 无电动二通阀 = 水路常通，浪费大
  const valveFactor = terminal.hasValve ? 0.5 : 1.0
  // 温控器类型
  const thermostatFactor = terminal.thermostatType === 'ba' ? 0.4 : terminal.thermostatType === 'ddc' ? 0.6 : 1.0
  // 滤网脏堵 = 换热效率低，清洗后节能明显
  const filterFactor = terminal.filterCondition === 'severe' ? 1.4 : terminal.filterCondition === 'slight' ? 1.1 : 0.8
  // 末端数量多则总节能量大
  const terminalCount = (terminal.ahuQuantity || 0) + (terminal.fauQuantity || 0)
  const countFactor = Math.min(1.3, 1 + terminalCount / 200)
  
  const terminalSaving = Math.min(15, Math.max(1.5,
    6 * valveFactor * thermostatFactor * filterFactor * countFactor
  ))

  // ========== 5. 智能控制节能分析 ==========
  // 有智能电表 = 可精准监控，智能控制收益大
  const smartMeterFactor = valves.hasSmartMeter ? 1.3 : 0.7
  // 电动旁通阀 = 已有部分自动化基础
  const bypassValveFactor = valves.bypassValve === 'electric' ? 0.7 : 1.0
  // 动态平衡阀 = 水力平衡好，智能控制效果更佳
  const balanceValveFactor = valves.balanceValve === 'dynamic' ? 1.1 : 0.9
  // 保温差 = 冷量损失大，智能调度收益高
  const insulationFactor = valves.insulation === 'poor' ? 1.3 : valves.insulation === 'normal' ? 1.0 : 0.7
  // 建筑面积大 = 节能总量大
  const areaFactor = Math.min(1.3, 1 + (formData.buildingArea || 50000) / 200000)
  // 运行天数多 = 年节能量大
  const daysFactor = Math.min(1.2, 1 + (formData.operatingDays || 300) / 600)
  
  const controlSaving = Math.min(12, Math.max(1.5,
    5 * smartMeterFactor * bypassValveFactor * balanceValveFactor * insulationFactor * areaFactor * daysFactor
  ))

  // ========== 汇总 ==========
  const totalSaving = chillerSaving + pumpSaving + towerSaving + terminalSaving + controlSaving
  
  // 年能耗估算：面积 × 单位面积能耗系数 × 运行天数/365
  // 不同建筑类型单位面积能耗不同
  const areaEnergyFactor = {
    office: 0.08,
    commercial: 0.12,
    hotel: 0.10,
    hospital: 0.11,
    datacenter: 0.25,
    industrial: 0.15
  }
  const factor = areaEnergyFactor[formData.buildingType] || 0.1
  const yearlyEnergy = (formData.buildingArea || 50000) * factor * (formData.operatingDays || 300)
  const acEnergy = yearlyEnergy * (formData.acCostRatio || 40) / 100
  const yearlySavingKwh = acEnergy * (totalSaving / 100)
  const yearlySaving = yearlySavingKwh * (formData.electricityPrice || 0.85)

  // 可信度基于数据完整度
  const hasChillerData = chiller.cop && chiller.ratedPower
  const hasPumpData = chilledPump.power && condenserPump.power
  const hasTowerData = coolingTower.flowRate && coolingTower.fanPower
  const dataCompleteScore = [hasChillerData, hasPumpData, hasTowerData, terminal.hasValve !== undefined, valves.hasSmartMeter !== undefined]
    .filter(Boolean).length / 5
  const confidence = 0.55 + dataCompleteScore * 0.30

  // 动态建议
  const recommendations = []
  if (isCN(formData)) {
    if (!chilledPump.hasVfd) recommendations.push('冷冻水泵加装变频器，预计可节省水泵能耗20-40%')
    if (!condenserPump.hasVfd) recommendations.push('冷却水泵加装变频器，预计可节省水泵能耗15-35%')
    if (chiller.controlMode === 'manual') recommendations.push('冷水机组升级为智能群控系统，实现根据负荷自动调节')
    if (!terminal.hasValve) recommendations.push('末端设备加装电动二通阀，实现按需供冷')
    if (terminal.filterCondition !== 'normal') recommendations.push('清洗或更换滤网，提升换热效率')
    if (!coolingTower.variableFan) recommendations.push('冷却塔风机加装变频器，根据冷却水温自动调节')
    if (!valves.hasSmartMeter) recommendations.push('安装智能电表，实现能耗实时监控和精细化管理')
    if (valves.insulation === 'poor') recommendations.push('修复管路保温，减少冷量输送损失')
    if (valves.bypassValve !== 'electric') recommendations.push('将手动旁通阀更换为电动旁通阀，实现压差旁通自动控制')
    if (recommendations.length === 0) recommendations.push('系统配置较为完善，建议进一步优化控制策略参数')
  } else {
    if (!chilledPump.hasVfd) recommendations.push('Install VFD on chilled water pumps, estimated 20-40% pump energy savings')
    if (!condenserPump.hasVfd) recommendations.push('Install VFD on condenser water pumps, estimated 15-35% pump energy savings')
    if (chiller.controlMode === 'manual') recommendations.push('Upgrade chiller to intelligent group control for automatic load adjustment')
    if (!terminal.hasValve) recommendations.push('Install electric 2-way valves on terminals for on-demand cooling')
    if (terminal.filterCondition !== 'normal') recommendations.push('Clean or replace filters to improve heat exchange efficiency')
    if (!coolingTower.variableFan) recommendations.push('Install VFD on cooling tower fans for automatic speed adjustment')
    if (!valves.hasSmartMeter) recommendations.push('Install smart meters for real-time energy monitoring')
    if (valves.insulation === 'poor') recommendations.push('Repair pipe insulation to reduce cooling distribution losses')
    if (valves.bypassValve !== 'electric') recommendations.push('Replace manual bypass valve with electric valve for automatic differential pressure control')
    if (recommendations.length === 0) recommendations.push('System is well configured, consider further optimizing control strategy parameters')
  }

  function isCN(fd) {
    return fd.isCN !== false
  }

  return {
    totalSaving: parseFloat(totalSaving.toFixed(1)),
    yearlySavingKwh: Math.round(yearlySavingKwh),
    yearlySaving: Math.round(yearlySaving),
    confidence: parseFloat(confidence.toFixed(2)),
    method: 'local',
    breakdown: [
      { name: isCN(formData) ? '冷水机组' : 'Chiller', saving: parseFloat(chillerSaving.toFixed(1)), color: '#409eff' },
      { name: isCN(formData) ? '水泵系统' : 'Pump', saving: parseFloat(pumpSaving.toFixed(1)), color: '#67c23a' },
      { name: isCN(formData) ? '冷却塔' : 'Tower', saving: parseFloat(towerSaving.toFixed(1)), color: '#909399' },
      { name: isCN(formData) ? '末端设备' : 'Terminal', saving: parseFloat(terminalSaving.toFixed(1)), color: '#e6a23c' },
      { name: isCN(formData) ? '智能控制' : 'Control', saving: parseFloat(controlSaving.toFixed(1)), color: '#6f42c1' }
    ],
    recommendations
  }
}

// 解析AI响应
function parseAIResponse(content) {
  try {
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    const result = JSON.parse(jsonStr)
    return {
      totalSaving: Math.min(Math.max(parseFloat(result.totalSaving) || 0, 0), 50),
      yearlySavingKwh: parseFloat(result.yearlySavingKwh) || 0,
      yearlySaving: parseFloat(result.yearlySaving || result.yearlySavingKwh * 0.85) || 0,
      confidence: Math.min(Math.max(parseFloat(result.confidence) || 0.7, 0.5), 1.0),
      breakdown: Array.isArray(result.breakdown) ? result.breakdown : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
    }
  } catch (e) {
    throw new Error('Failed to parse AI response')
  }
}

// 节能分析API
router.post('/analyze', async (req, res) => {
  try {
    const formData = req.body
    const isCN = formData.isCN !== false

    // 确保从数据库加载最新Key
    await loadApiKeyFromDB()

    if (!DEEPSEEK_CONFIG.apiKey) {
      const localResult = localCalculation(formData)
      return res.json({
        success: true,
        ...localResult,
        method: 'local',
        message: isCN ? '使用本地计算，建议配置DeepSeek API Key提高准确度' : 'Using local calculation'
      })
    }

    const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: isCN ? 
              '你是一个专业的暖通空调工程师。请根据提供的数据进行准确的节能预测分析，只返回JSON格式的结果。' :
              'You are a professional HVAC engineer. Analyze the data and provide accurate energy-saving predictions in JSON format only.'
          },
          {
            role: 'user',
            content: buildPrompt(formData, isCN)
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const result = parseAIResponse(content)

    res.json({
      success: true,
      ...result,
      method: 'deepseek'
    })

  } catch (error) {
    console.error('Energy analysis error:', error)
    
    const localResult = localCalculation(req.body)
    res.json({
      success: false,
      error: error.message,
      ...localResult,
      method: 'local',
      message: req.body.isCN !== false ? 'API调用失败，使用本地计算' : 'API failed, using local calculation'
    })
  }
})

// 启动时加载
loadApiKeyFromDB()

export default router
