import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/energy-prediction'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/energy-prediction',
      name: 'EnergyPrediction',
      component: () => import('@/views/energy-prediction/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/device',
      name: 'Device',
      component: () => import('@/views/device/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/project',
      name: 'Project',
      component: () => import('@/views/project/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/control',
      name: 'ControlPanel',
      component: () => import('@/views/control-panel/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/energy-monitor',
      name: 'EnergyMonitor',
      component: () => import('@/views/energy-monitor/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/system',
      name: 'System',
      component: () => import('@/views/system/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/portal-admin',
      name: 'PortalAdmin',
      component: () => import('@/views/portal-admin/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/portal',
      name: 'Portal',
      component: () => import('@/views/portal/index.vue'),
      meta: { requiresAuth: false }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth !== false

  // Portal 公开页面，直接放行，不触发登录模块懒加载
  if (to.path === '/portal' || to.path.startsWith('/portal/')) {
    return next()
  }

  if (requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/energy-prediction')
  } else {
    next()
  }
})

// 动态导入错误处理
router.onError((error, to) => {
  console.warn('Route load error:', error, to.path)
  // 如果是懒加载失败且目标不是当前页面，尝试重新导航
  if (to.path !== window.location.pathname) {
    window.location.href = window.location.origin + to.fullPath
  }
})

export default router
