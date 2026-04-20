import axios from 'axios'

// API 基础配置 - 生产环境指向 CloudRun 后端服务
const API_BASE = 'https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ============== 仪表盘 ==============
export const dashboardAPI = {
  // 获取总览数据
  getOverview: () => api.get('/dashboard/overview'),
  
  // 获取实时状态
  getRealtime: () => api.get('/dashboard/realtime')
}

// ============== 空调控制（冷机/变频器/风阀/水阀）==============
export const acAPI = {
  // 获取所有设备
  getDevices: () => api.get('/ac/devices'),
  
  // 获取单个设备
  getDevice: (id: string) => api.get(`/ac/devices/${id}`),
  
  // 控制设备启停
  control: (deviceId: string, action: string, value: any) => 
    api.post('/ac/control', { deviceId, action, value }),
  
  // 调整设备参数（频率/阀门开度）
  adjustParam: (deviceId: string, param: string, value: number) =>
    api.post('/ac/param', { deviceId, param, value }),
  
  // 获取能耗统计
  getEnergyStats: () => api.get('/ac/energy/stats'),
  
  // AI 冷负荷预测
  predict: (params: any) => api.post('/ac/ai/predict', params)
}

// ============== 设置 ==============
export const settingsAPI = {
  // 获取设置
  get: () => api.get('/settings'),

  // 更新设置
  update: (settings: any) => api.put('/settings', settings),

  // 获取系统信息
  getSystemInfo: () => api.get('/settings/system'),

  // 获取用户列表
  getUsers: () => api.get('/settings/users')
}

// 导出默认配置
export { api }
