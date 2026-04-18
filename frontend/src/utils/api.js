import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from './router'

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误（排除公开页面避免触发登录模块懒加载）
function shouldRedirectToLogin() {
  const currentPath = window.location.pathname
  return !currentPath.startsWith('/login') && !currentPath.startsWith('/portal')
}

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除 token 并跳转登录
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (shouldRedirectToLogin()) router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          // Token过期或无权限，清除token并跳转登录
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (shouldRedirectToLogin()) router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 404:
          ElMessage.error('请求资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.error || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export default api
