// 共享类型定义

// ========== 空调模块 ==========
export interface ACDevice {
  id: string
  name: string
  location: string
  status: 'on' | 'off'
  temperature: number
  targetTemp: number
  mode: 'cool' | 'heat' | 'fan' | 'auto'
  power: number
  energyToday: number
  aiPrediction?: {
    efficiency: number
    suggestions: string[]
  }
}

export interface ACControlParams {
  deviceId: string
  action: 'power' | 'temperature' | 'mode'
  value: string | number
}

export interface EnergyStats {
  today: number
  week: number[]
  month: number[]
  year: number[]
  peakHour: number
  avgEfficiency: number
}

// ========== 停车场模块 ==========
export interface ParkingSpace {
  id: string
  floor: number
  zone: string
  number: string
  status: 'available' | 'occupied' | 'reserved' | 'disabled'
  plateNumber?: string
  entryTime?: string
}

export interface ParkingLot {
  id: string
  name: string
  totalSpaces: number
  availableSpaces: number
  spaces: ParkingSpace[]
}

export interface ParkingRecord {
  id: string
  plateNumber: string
  entryTime: string
  exitTime?: string
  duration?: number
  fee?: number
  status: 'parking' | 'exited'
}

// ========== 灯光模块 ==========
export interface LightingCircuit {
  id: string
  name: string
  zone: string
  floor: number
  status: 'on' | 'off'
  brightness: number
  power: number
  mode: 'normal' | 'eco' | 'off-peak' | 'off'
}

export interface LightingZone {
  id: string
  name: string
  floor: number
  circuits: LightingCircuit[]
}

// ========== 监控模块 ==========
export interface Camera {
  id: string
  name: string
  location: string
  floor: number
  status: 'online' | 'offline'
  streamUrl?: string
  hasAI: boolean
  lastMotion?: string
  alerts: number
}

export interface MonitorAlert {
  id: string
  cameraId: string
  type: 'motion' | 'intrusion' | 'disconnect' | 'ai'
  message: string
  timestamp: string
  acknowledged: boolean
}

// ========== 仪表盘 ==========
export interface DashboardSummary {
  totalDevices: number
  activeDevices: number
  totalEnergy: number
  energyChange: number
  alerts: number
  parking: {
    total: number
    available: number
  }
  weather?: {
    temp: number
    humidity: number
    condition: string
  }
}

// ========== API 响应格式 ==========
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// ========== 系统设置 ==========
export interface SystemSettings {
  language: 'zh-CN' | 'en-US'
  theme: 'dark' | 'light'
  apiKey?: string
  serverUrl: string
  refreshInterval: number
}
