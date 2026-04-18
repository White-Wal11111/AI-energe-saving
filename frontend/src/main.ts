import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
import './styles/global.css'

// 全局 axios 拦截器（处理所有页面的原始 axios 调用）
import axios from 'axios'

// 响应拦截器：403 时自动清除 token 并跳转登录（排除公开页面）
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 公开页面和管理页面不强制跳转登录
      const currentPath = window.location.pathname
      const safePaths = ['/login', '/portal']
      if (!safePaths.some(p => currentPath.startsWith(p))) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 全局错误捕获，防止非致命错误导致页面崩溃
window.addEventListener('error', (event) => {
  // 忽略动态加载模块失败和 getBoundingClientRect 等非致命错误
  if (
    event.message?.includes('dynamically imported module') ||
    event.message?.includes('getBoundingClientRect')
  ) {
    console.warn('[Global Error suppressed]:', event.message)
    return false // 阻止默认处理
  }
}, true)

// Promise 未捕获异常处理
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '')
  if (msg.includes('dynamically imported') || msg.includes('getBoundingClientRect')) {
    console.warn('[Unhandled rejection suppressed]:', msg)
    event.preventDefault()
  }
})

app.mount('#app')
