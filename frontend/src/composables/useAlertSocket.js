import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import { ElNotification } from 'element-plus'

// Socket.IO 实例
let socket: Socket | null = null

// 响应式状态
const isConnected = ref(false)
const lastAlert = ref<any>(null)
const alertUpdates = ref<any[]>([])

// 回调函数
type AlertCallback = (alert: any) => void
const alertCallbacks: AlertCallback[] = []
const updateCallbacks: AlertCallback[] = []

/**
 * 初始化 Socket.IO 连接
 */
export function initSocket() {
  if (socket?.connected) {
    return socket
  }

  socket = io('http://localhost:4000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  })

  // 连接成功
  socket.on('connect', () => {
    console.log('🔌 Alert Socket connected:', socket?.id)
    isConnected.value = true
    
    // 订阅告警
    socket?.emit('subscribeAlerts', { type: 'all' })
  })

  // 连接断开
  socket.on('disconnect', () => {
    console.log('❌ Alert Socket disconnected')
    isConnected.value = false
  })

  // 接收新告警
  socket.on('newAlert', (alert) => {
    console.log('📢 New alert received:', alert)
    lastAlert.value = alert
    alertUpdates.value.unshift(alert)
    
    // 保持最新50条记录
    if (alertUpdates.value.length > 50) {
      alertUpdates.value = alertUpdates.value.slice(0, 50)
    }
    
    // 显示通知
    showAlertNotification(alert)
    
    // 触发回调
    alertCallbacks.forEach(callback => callback(alert))
  })

  // 接收告警更新
  socket.on('alertUpdate', (data) => {
    console.log('🔄 Alert update received:', data)
    
    // 更新最后一条告警
    if (lastAlert.value?.id === data.alert.id) {
      lastAlert.value = data.alert
    }
    
    // 添加到更新列表
    alertUpdates.value.unshift(data)
    
    if (alertUpdates.value.length > 50) {
      alertUpdates.value = alertUpdates.value.slice(0, 50)
    }
    
    // 触发回调
    updateCallbacks.forEach(callback => callback(data.alert))
  })

  // 接收设备更新
  socket.on('deviceUpdate', (data) => {
    console.log('📊 Device update received')
    // 可以用于同步设备状态
  })

  return socket
}

/**
 * 断开 Socket.IO 连接
 */
export function disconnect() {
  if (socket) {
    socket.emit('unsubscribeAlerts')
    socket.disconnect()
    socket = null
    isConnected.value = false
  }
}

/**
 * 获取 Socket 实例
 */
export function getSocket() {
  return socket
}

/**
 * 订阅新告警
 */
export function onNewAlert(callback: AlertCallback) {
  alertCallbacks.push(callback)
  return () => {
    const index = alertCallbacks.indexOf(callback)
    if (index > -1) {
      alertCallbacks.splice(index, 1)
    }
  }
}

/**
 * 订阅告警更新
 */
export function onAlertUpdate(callback: AlertCallback) {
  updateCallbacks.push(callback)
  return () => {
    const index = updateCallbacks.indexOf(callback)
    if (index > -1) {
      updateCallbacks.splice(index, 1)
    }
  }
}

/**
 * 显示告警通知
 */
function showAlertNotification(alert: any) {
  const typeMap: Record<string, any> = {
    critical: 'error',
    warning: 'warning',
    info: 'info'
  }

  const levelText: Record<string, string> = {
    critical: '严重告警',
    warning: '警告',
    info: '提示'
  }

  const typeNameMap: Record<string, string> = {
    temperature: '温度异常',
    occupancy: '车位满',
    motion: '异常移动',
    offline: '设备离线',
    energy: '能耗超标'
  }

  ElNotification({
    title: `${levelText[alert.level] || '告警'} - ${typeNameMap[alert.type] || alert.type}`,
    message: alert.message || alert.title,
    type: typeMap[alert.level] || 'info',
    duration: alert.level === 'critical' ? 0 : 5000,
    position: 'top-right',
    showClose: true
  })
}

/**
 * 清空告警更新历史
 */
export function clearAlertHistory() {
  alertUpdates.value = []
  lastAlert.value = null
}

/**
 * Composable 入口（Vue 组合式函数）
 */
export function useAlertSocket() {
  onMounted(() => {
    initSocket()
  })

  onUnmounted(() => {
    // 不在这里断开连接，让组件自己管理
  })

  return {
    isConnected,
    lastAlert,
    alertUpdates,
    initSocket,
    disconnect,
    getSocket,
    onNewAlert,
    onAlertUpdate,
    clearAlertHistory
  }
}

export default useAlertSocket
