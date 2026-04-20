<template>
  <div class="alerts-center">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-warning"></i>
        {{ isCN ? '告警中心' : 'Alert Center' }}
      </h2>
      <div class="header-actions">
        <el-button @click="fetchAlerts">
          <i class="el-icon-refresh"></i>
          {{ isCN ? '刷新' : 'Refresh' }}
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #409eff, #66b1ff)">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ isCN ? '总告警' : 'Total' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #e6a23c)">
          <i class="el-icon-bell"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.today || 0 }}</div>
          <div class="stat-label">{{ isCN ? '今日告警' : 'Today' }}</div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c, #f56c6c)">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending || 0 }}</div>
          <div class="stat-label">{{ isCN ? '待处理' : 'Pending' }}</div>
        </div>
      </div>

      <div class="stat-card critical">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #ff0000)">
          <i class="el-icon-close"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.critical || 0 }}</div>
          <div class="stat-label">{{ isCN ? '严重告警' : 'Critical' }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-select v-model="filters.status" :placeholder="isCN ? '状态' : 'Status'" clearable size="default">
        <el-option :value="'pending'" :label="isCN ? '待处理' : 'Pending'" />
        <el-option :value="'acknowledged'" :label="isCN ? '已确认' : 'Acknowledged'" />
        <el-option :value="'resolved'" :label="isCN ? '已解决' : 'Resolved'" />
      </el-select>

      <el-select v-model="filters.level" :placeholder="isCN ? '级别' : 'Level'" clearable size="default">
        <el-option :value="'critical'" :label="isCN ? '严重' : 'Critical'" />
        <el-option :value="'warning'" :label="isCN ? '警告' : 'Warning'" />
        <el-option :value="'info'" :label="isCN ? '提示' : 'Info'" />
      </el-select>

      <el-select v-model="filters.type" :placeholder="isCN ? '类型' : 'Type'" clearable size="default">
        <el-option v-for="t in alertTypes" :key="t.value" :value="t.value" :label="isCN ? t.label : t.labelEn" />
      </el-select>
    </div>

    <!-- 告警列表 -->
    <div class="alerts-list">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-item"
        :class="[alert.level, alert.status]"
      >
        <div class="alert-icon">
          <i :class="getAlertIcon(alert.type)"></i>
        </div>

        <div class="alert-content">
          <div class="alert-header">
            <h3>{{ alert.title }}</h3>
            <el-tag :type="getLevelType(alert.level)" size="small">
              {{ getLevelText(alert.level) }}
            </el-tag>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
          <div class="alert-meta">
            <span><i class="el-icon-location"></i> {{ alert.location }}</span>
            <span><i class="el-icon-time"></i> {{ formatTime(alert.timestamp) }}</span>
          </div>
        </div>

        <div class="alert-actions">
          <el-tag v-if="alert.status === 'pending'" type="warning" effect="plain">
            {{ isCN ? '待处理' : 'Pending' }}
          </el-tag>
          <el-tag v-else-if="alert.status === 'acknowledged'" type="primary" effect="plain">
            {{ isCN ? '已确认' : 'Acknowledged' }}
          </el-tag>
          <el-tag v-else type="success" effect="plain">
            {{ isCN ? '已解决' : 'Resolved' }}
          </el-tag>

          <div class="action-buttons" v-if="alert.status !== 'resolved'">
            <el-button
              v-if="alert.status === 'pending'"
              type="primary"
              size="small"
              @click="acknowledgeAlert(alert.id)"
            >
              {{ isCN ? '确认' : 'Ack' }}
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="resolveAlert(alert.id)"
            >
              {{ isCN ? '处理' : 'Resolve' }}
            </el-button>
          </div>
        </div>
      </div>

      <el-empty v-if="alerts.length === 0" :description="isCN ? '暂无告警' : 'No alerts'" />
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchAlerts"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { io } from 'socket.io-client'

const isCN = inject('isCN', ref(true))

const alerts = ref([])
const stats = ref({})
const filters = reactive({
  status: '',
  level: '',
  type: ''
})
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const alertTypes = [
  { value: 'temperature', label: '温度异常', labelEn: 'Temperature' },
  { value: 'energy', label: '能耗超标', labelEn: 'Energy' },
  { value: 'motion', label: '异常移动', labelEn: 'Motion' },
  { value: 'offline', label: '设备离线', labelEn: 'Offline' },
  { value: 'occupancy', label: '车位已满', labelEn: 'Parking' },
  { value: 'fire', label: '火警', labelEn: 'Fire' },
  { value: 'security', label: '安防告警', labelEn: 'Security' }
]

let socket = null

const fetchAlerts = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (filters.status) params.status = filters.status
    if (filters.level) params.level = filters.level
    if (filters.type) params.type = filters.type

    const res = await axios.get('/api/alerts', { params })
    if (res.data.success) {
      alerts.value = res.data.data.items
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
  }
}

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/alerts/stats')
    if (res.data.success) {
      stats.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const acknowledgeAlert = async (id) => {
  try {
    const res = await axios.post(`/api/alerts/${id}/acknowledge`)
    if (res.data.success) {
      ElMessage.success(isCN.value ? '告警已确认' : 'Alert acknowledged')
      fetchAlerts()
      fetchStats()
    }
  } catch (error) {
    ElMessage.error(isCN.value ? '操作失败' : 'Operation failed')
  }
}

const resolveAlert = async (id) => {
  try {
    const res = await axios.post(`/api/alerts/${id}/resolve`, {
      resolution: isCN.value ? '已处理' : 'Resolved'
    })
    if (res.data.success) {
      ElMessage.success(isCN.value ? '告警已处理' : 'Alert resolved')
      fetchAlerts()
      fetchStats()
    }
  } catch (error) {
    ElMessage.error(isCN.value ? '操作失败' : 'Operation failed')
  }
}

const getAlertIcon = (type) => {
  const icons = {
    temperature: 'el-icon-cold-air',
    energy: 'el-icon-lightning',
    motion: 'el-icon-video-camera',
    offline: 'el-icon-close',
    occupancy: 'el-icon-truck',
    fire: 'el-icon-warning',
    security: 'el-icon-lock'
  }
  return icons[type] || 'el-icon-warning'
}

const getLevelType = (level) => {
  const types = { critical: 'danger', warning: 'warning', info: 'info' }
  return types[level] || 'info'
}

const getLevelText = (level) => {
  const texts = { critical: isCN.value ? '严重' : 'Critical', warning: isCN.value ? '警告' : 'Warning', info: isCN.value ? '提示' : 'Info' }
  return texts[level] || level
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString(isCN.value ? 'zh-CN' : 'en-US')
}

const initSocket = () => {
  // 根据环境使用不同的URL
  const socketUrl = import.meta.env.PROD 
    ? 'https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com'
    : 'http://localhost:4000';
  
  socket = io(socketUrl)

  socket.on('newAlert', (data) => {
    ElMessage.warning({
      message: data.title,
      duration: 5000
    })
    fetchAlerts()
    fetchStats()
  })

  socket.on('alertUpdate', () => {
    fetchAlerts()
    fetchStats()
  })
}

onMounted(() => {
  fetchAlerts()
  fetchStats()
  initSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})
</script>

<style scoped>
.alerts-center {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-card.pending {
  border-left: 4px solid #e6a23c;
}

.stat-card.critical {
  border-left: 4px solid #f56c6c;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.alerts-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.alert-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background 0.3s;
}

.alert-item:hover {
  background: #f5f7fa;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item.critical {
  background: rgba(245, 108, 108, 0.05);
}

.alert-item.warning {
  background: rgba(230, 162, 60, 0.05);
}

.alert-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.alert-item.critical .alert-icon {
  background: linear-gradient(135deg, #f56c6c, #ff0000);
}

.alert-item.warning .alert-icon {
  background: linear-gradient(135deg, #e6a23c, #f56c6c);
}

.alert-item.info .alert-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.alert-content {
  flex: 1;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.alert-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.alert-message {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.alert-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .alert-item {
    flex-direction: column;
  }

  .alert-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
}
</style>
