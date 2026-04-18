/**
 * 节能分析API服务 - 调用后端
 */

const API_BASE = '/api/energy'

// 完整的表单数据结构
interface FormData {
  // 基础信息
  buildingType: string
  buildingArea: number
  isFullLoad: boolean
  operatingDays: number
  acType: string
  acCostRatio: number
  electricityPrice: number
  electricityBills: string
  expectedSaving: number
  
  // 冷机参数
  chiller: {
    brand: string
    model: string
    year: number
    capacity: number
    ratedPower: number
    cop: number
    iplv: number
    quantity: number
    compressorType: string
    refrigerant: string
    controlMode: string
  }
  
  // 冷冻水泵
  chilledPump: {
    brand: string
    model: string
    year: number
    flowRate: number
    head: number
    power: number
    voltage: number
    current: number
    rpm: number
    hasVfd: boolean
  }
  
  // 冷却水泵
  condenserPump: {
    flowRate: number
    head: number
    power: number
    hasVfd: boolean
  }
  
  // 冷却塔
  coolingTower: {
    brand: string
    model: string
    quantity: number
    year: number
    flowRate: number
    fanPower: number
    variableFan: boolean
    inletTemp: number
    outletTemp: number
    wetBulbTemp: number
  }
  
  // 末端设备
  terminal: {
    ahuQuantity: number
    fauQuantity: number
    totalQuantity: number
    flowDistribution: string
    hasValve: boolean
    thermostatType: string
    filterCondition: string
  }
  
  // 阀门与管路
  valves: {
    bypassValve: string
    balanceValve: string
    insulation: string
    hasSmartMeter: boolean
  }
  
  isCN: boolean
}

interface APIResult {
  success: boolean
  totalSaving: number
  yearlySaving: number
  yearlySavingKwh: number
  confidence: number
  method: 'deepseek' | 'local'
  breakdown?: Array<{
    name: string
    saving: number
    color: string
  }>
  recommendations?: string[]
  error?: string
}

// 节能分析
export async function analyzeEnergy(formData: FormData): Promise<APIResult> {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      totalSaving: 0,
      yearlySaving: 0,
      yearlySavingKwh: 0,
      confidence: 0.5,
      method: 'local'
    }
  }
}
