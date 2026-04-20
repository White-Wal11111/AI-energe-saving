<template>
  <div class="app-container">
    <template v-if="!isLoginPage">
      <!-- 顶部导航栏 -->
      <header class="app-header">
        <div class="header-left">
          <!-- LOGO 位置 -->
          <div class="logo-container">
            <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="logo-img" />
            <i v-else class="el-icon-office-building logo-icon"></i>
          </div>
          <h1>{{ isCN ? 'AI预测节能管理系统' : 'AI Energy Management System' }}</h1>
        </div>
        <div class="header-right">
          <!-- 实时外部温度 -->
          <div class="weather-widget" v-if="!isLoginPage">
            <i class="el-icon-sunny" :class="{ 'loading-rotate': weatherLoading }"></i>
            <span class="weather-temp">{{ weatherTemp }}°C</span>
            <span class="weather-label">{{ isCN ? '雅加达' : 'Jakarta' }}</span>
          </div>

          <!-- 项目选择器 -->
          <div v-if="currentUser?.projects && currentUser.projects.length > 0" class="project-selector">
            <el-select
              v-model="currentProject.id"
              @change="handleProjectChange"
              :placeholder="isCN ? '选择项目' : 'Select Project'"
              size="default"
              style="width: 220px"
            >
              <el-option
                v-for="project in currentUser.projects"
                :key="project.id"
                :label="isCN ? project.name : project.name_en"
                :value="project.id"
              >
                <div class="project-option">
                  <span class="project-name">{{ isCN ? project.name : project.name_en }}</span>
                  <el-tag v-if="project.id === 'all'" type="danger" size="small">ADMIN</el-tag>
                </div>
              </el-option>
            </el-select>
          </div>

          <UserAvatar :show-name="true" :size="36" />
          <el-button
            class="lang-btn"
            @click="toggleLang"
            :title="isCN ? 'Switch to English' : '切换到中文'"
          >
            {{ isCN ? 'EN' : '中' }}
          </el-button>
          <el-button :icon="Setting" circle @click="$router.push('/settings')" />
          <el-button :icon="SwitchButton" circle @click="handleLogout" :title="isCN ? '退出登录' : 'Logout'" />
        </div>
      </header>

      <!-- 侧边导航 -->
      <aside class="app-sidebar">
        <el-menu
          :default-active="$route.path"
          router
          class="sidebar-menu"
          background-color="transparent"
          text-color="#606266"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/energy-prediction">
            <el-icon style="color:#409eff"><TrendCharts /></el-icon>
            <span>{{ isCN ? '节能效率预测' : 'Energy Prediction' }}</span>
          </el-menu-item>
          <el-menu-item index="/device">
            <el-icon style="color:#67c23a"><Cpu /></el-icon>
            <span>{{ isCN ? '设备管理' : 'Device Management' }}</span>
          </el-menu-item>
          <el-menu-item index="/control">
            <el-icon style="color:#e6a23c"><Operation /></el-icon>
            <span>{{ isCN ? '控制面板' : 'Control Panel' }}</span>
          </el-menu-item>
          <el-menu-item index="/energy-monitor">
            <el-icon style="color:#f56c6c"><DataLine /></el-icon>
            <span>{{ isCN ? '能耗监测' : 'Energy Monitor' }}</span>
          </el-menu-item>
          <el-menu-item index="/project">
            <el-icon style="color:#909399"><OfficeBuilding /></el-icon>
            <span>{{ isCN ? '项目管理' : 'Project Management' }}</span>
          </el-menu-item>
          <el-menu-item index="/system">
            <el-icon style="color:#764ba2"><Setting /></el-icon>
            <span>{{ isCN ? '系统管理' : 'System Management' }}</span>
          </el-menu-item>
          <el-menu-item index="/portal-admin">
            <el-icon style="color:#2db7f5"><Promotion /></el-icon>
            <span>{{ isCN ? '门户管理' : 'Portal Management' }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容区 -->
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </template>
    <template v-else>
      <!-- 登录页不需要header和sidebar -->
      <router-view />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserAvatar from '@/components/UserAvatar.vue'
// Element Plus 图标
import { TrendCharts, Cpu, Operation, DataLine, OfficeBuilding, Setting, SwitchButton, Promotion } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const isCN = ref(localStorage.getItem('isCN') !== 'en')
const logoSrc = ref('/logo.png')
const isAdmin = ref(false)
const currentUser = ref<any>(null)
const currentProject = ref<any>(null)

// 实时外部温度（雅加达）
const weatherTemp = ref('--')
const weatherLoading = ref(false)
let weatherTimer: ReturnType<typeof setInterval> | null = null

// Open-Meteo 免费天气API (雅加达: -6.2088, 106.8456)
async function fetchWeather() {
  weatherLoading.value = true
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-6.21&longitude=106.85&current=temperature_2m&timezone=Asia/Jakarta'
    )
    const data = await res.json()
    if (data.current?.temperature_2m != null) {
      weatherTemp.value = Math.round(data.current.temperature_2m * 10) / 10
    }
  } catch (e) {
    console.warn('获取天气数据失败:', e)
    // 使用雅加达当前季节典型温度作为降级值
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 10) weatherTemp.value = '28'
    else if (hour >= 10 && hour < 15) weatherTemp.value = '33'
    else if (hour >= 15 && hour < 18) weatherTemp.value = '31'
    else weatherTemp.value = '29'
  } finally {
    weatherLoading.value = false
  }
}

const isLoginPage = computed(() => route.path === '/login' || route.path === '/portal')

provide('isCN', isCN)

onMounted(() => {
  loadUserInfo()
  checkAdminStatus()
  // 获取雅加达实时温度，每15分钟刷新
  fetchWeather()
  weatherTimer = setInterval(fetchWeather, 15 * 60 * 1000)
  
  // 解决CloudBase静态托管SPA路由问题
  // 如果当前URL没有hash且路径是/portal，自动跳转到/#/portal
  const currentPath = window.location.pathname
  const currentHash = window.location.hash
  if (currentPath === '/portal' && !currentHash) {
    // 延迟跳转，确保Vue Router已初始化
    setTimeout(() => {
      window.location.href = '/#/portal'
    }, 100)
  }
})

watch(() => route.path, () => {
  loadUserInfo()
  checkAdminStatus()
})

function loadUserInfo() {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      currentUser.value = user
      // 设置当前项目
      if (user.projects && user.projects.length > 0) {
        const savedProjectId = localStorage.getItem('currentProjectId')
        if (savedProjectId) {
          currentProject.value = user.projects.find((p: any) => p.id === savedProjectId) || user.projects[0]
        } else {
          currentProject.value = user.projects[0]
        }
      }
    } catch {
      currentUser.value = null
      currentProject.value = null
    }
  } else {
    currentUser.value = null
    currentProject.value = null
  }
}

function checkAdminStatus() {
  if (currentUser.value) {
    isAdmin.value = currentUser.value.role === 'admin'
  } else {
    isAdmin.value = false
  }
}

function handleProjectChange(projectId: string) {
  const project = currentUser.value?.projects?.find((p: any) => p.id === projectId)
  if (project) {
    currentProject.value = project
    localStorage.setItem('currentProjectId', projectId)
  }
}

function toggleLang() {
  isCN.value = !isCN.value
  localStorage.setItem('isCN', isCN.value ? 'zh' : 'en')
  window.location.reload()
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: linear-gradient(135deg, rgba(26, 109, 187, 0.9) 0%, rgba(42, 138, 224, 0.9) 100%);
  box-shadow: 0 2px 12px rgba(42, 138, 224, 0.3);
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.logo-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-icon {
  font-size: 24px;
  color: #fff;
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ── 实时天气/温度组件 ── */
.weather-widget {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  padding: 5px 14px;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.weather-widget:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.45);
}

.weather-widget i {
  font-size: 18px;
  color: #f7d354;
  animation: pulse-sun 2s ease-in-out infinite;
}

.weather-widget i.loading-rotate {
  color: #fff !important;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-sun {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.weather-temp {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
  min-width: 36px;
}

.weather-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.3px;
}

/* ── 项目选择器美化 ── */
.project-selector {
  margin-right: 4px;
}

.project-selector :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  box-shadow: none;
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
}

.project-selector :deep(.el-input__wrapper:hover),
.project-selector :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.55);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.project-selector :deep(.el-input__inner) {
  color: white;
  font-weight: 500;
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.project-selector :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.55);
}

.project-selector :deep(.el-input__suffix) {
  color: rgba(255, 255, 255, 0.75);
}

/* 下拉面板样式 */
.project-selector :deep(.el-select-dropdown) {
  border-radius: 10px !important;
  border: 1px solid #e4e7ed;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 6px;
  overflow: hidden;
}

.project-selector :deep(.el-scrollbar .el-select-dropdown__list) {
  padding: 2px;
}

.project-selector :deep(.el-select-dropdown__item) {
  border-radius: 6px;
  margin-bottom: 2px;
  padding: 9px 14px;
  transition: all 0.2s ease;
  font-size: 13px;
  line-height: 1.5;
}

.project-selector :deep(.el-select-dropdown__item:hover) {
  background-color: #ecf5ff;
  transform: translateX(2px);
}

.project-selector :deep(.el-select-dropdown__item.is-selected) {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  font-weight: 600;
}

.project-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.project-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 用户头像下拉菜单美化 ── */
.user-avatar :deep(.el-dropdown-menu) {
  border-radius: 12px !important;
  border: 1px solid #e8ecf1;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.12), 0 3px 10px rgba(0, 0, 0, 0.06);
  padding: 6px;
  overflow: hidden;
  min-width: 180px;
}

.user-avatar :deep(.el-dropdown-menu__item) {
  border-radius: 8px;
  margin-bottom: 2px;
  padding: 10px 16px;
  font-size: 13.5px;
  color: #303133;
  transition: all 0.22s ease;
  gap: 8px;
}

.user-avatar :deep(.el-dropdown-menu__item:hover) {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  color: #409eff;
  transform: translateX(3px);
}

.user-avatar :deep(.el-dropdown-menu__item i) {
  font-size: 15px;
  opacity: 0.7;
  transition: all 0.22s ease;
}

.user-avatar :deep(.el-dropdown-menu__item:hover i) {
  opacity: 1;
  transform: scale(1.08);
}

.user-avatar :deep(.el-dropdown-menu__item--divided) {
  margin-top: 4px;
  border-top-color: #eef0f5;
}

.user-avatar :deep(.el-dropdown-menu__item--divided:hover) {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  color: #f56c6c;
}

/* ── 头部右侧按钮统一风格 ── */
.header-right :deep(.el-button--default),
.header-right :deep(.el-button.is-circle) {
  background: rgba(255, 255, 255, 0.16) !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
  border-radius: 8px !important;
  width: 34px;
  height: 34px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.header-right :deep(.el-button--default:hover),
.header-right :deep(.el-button.is-circle:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.55) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.app-sidebar {
  position: fixed;
  top: 60px;
  left: 0;
  bottom: 0;
  width: 200px;
  padding: 20px 0;
  background: #ffffff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 900;
}

.sidebar-menu {
  border-right: none;
  background: transparent !important;
}

.sidebar-menu .el-menu-item,
.sidebar-menu .el-sub-menu__title {
  color: #303133 !important;
}

.sidebar-menu .el-menu-item:hover,
.sidebar-menu .el-sub-menu__title:hover {
  background-color: #f5f7fa !important;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #ecf5ff !important;
  color: #409eff !important;
}

/* 侧边栏图标 - 使用 Element Plus 图标 */
.sidebar-menu .el-menu-item .el-icon {
  font-size: 18px;
  margin-right: 8px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.sidebar-menu .el-menu-item:hover .el-icon {
  transform: scale(1.15);
}

.app-main {
  flex: 1;
  margin-left: 200px;
  margin-top: 60px;
  padding: 24px;
  min-height: calc(100vh - 60px);
  position: relative;
  z-index: 1;
  overflow-x: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-sidebar {
    display: none;
  }

  .app-main {
    margin-left: 0;
  }

  .header-left h1 {
    font-size: 16px;
  }
}
</style>
