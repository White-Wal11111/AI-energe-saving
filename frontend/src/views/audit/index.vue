<template>
  <div class="audit-log">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-document"></i>
        {{ isCN ? '审计日志' : 'Audit Log' }}
      </h2>
      <div class="header-actions">
        <el-button @click="fetchLogs">
          <i class="el-icon-refresh"></i>
          {{ isCN ? '刷新' : 'Refresh' }}
        </el-button>
        <el-button type="primary" @click="exportLogs">
          <i class="el-icon-download"></i>
          {{ isCN ? '导出' : 'Export' }}
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #409eff, #66b1ff)">
          <i class="el-icon-document"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total || 0 }}</div>
          <div class="stat-label">{{ isCN ? '总日志' : 'Total Logs' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a, #85ce61)">
          <i class="el-icon-date"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.today || 0 }}</div>
          <div class="stat-label">{{ isCN ? '今日日志' : 'Today' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #e6a23c)">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.critical || 0 }}</div>
          <div class="stat-label">{{ isCN ? '异常操作' : 'Anomalies' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #9c27b0, #e91e63)">
          <i class="el-icon-user"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ activeUsers }}</div>
          <div class="stat-label">{{ isCN ? '活跃用户' : 'Active Users' }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-select v-model="filters.type" :placeholder="isCN ? '操作类型' : 'Type'" clearable size="default">
        <el-option v-for="t in logTypes" :key="t.value" :value="t.value" :label="isCN ? t.label : t.labelEn" />
      </el-select>

      <el-input
        v-model="filters.keyword"
        :placeholder="isCN ? '搜索操作或详情' : 'Search'"
        clearable
        size="default"
        style="width: 200px"
      />

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        :range-separator="isCN ? '至' : 'to'"
        :start-placeholder="isCN ? '开始日期' : 'Start'"
        :end-placeholder="isCN ? '结束日期' : 'End'"
        size="default"
        @change="handleDateChange"
      />
    </div>

    <!-- 日志列表 -->
    <div class="card">
      <el-table :data="logs" stripe style="width: 100%" v-loading="loading">
        <el-table-column :label="isCN ? '时间' : 'Time'" width="180">
          <template #default="{ row }">
            <span class="time-cell">{{ formatTime(row.timestamp) }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? '类型' : 'Type'" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">
              {{ isCN ? getTypeLabel(row.type) : getTypeLabelEn(row.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? '用户' : 'User'" width="120">
          <template #default="{ row }">
            <span class="user-cell">
              <i class="el-icon-user"></i>
              {{ row.username }}
            </span>
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? '操作' : 'Action'" min-width="200">
          <template #default="{ row }">
            <div class="action-cell">
              <strong>{{ isCN ? row.action : row.action_en }}</strong>
              <p class="details">{{ row.details }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? 'IP地址' : 'IP'" width="140">
          <template #default="{ row }">
            <code class="ip-cell">{{ row.ip }}</code>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchLogs"
        />
      </div>
    </div>

    <!-- 日志趋势图 -->
    <div class="card">
      <h3 class="card-title">{{ isCN ? '日志趋势 (最近7天)' : 'Log Trend (Last 7 Days)' }}</h3>
      <div ref="trendChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import * as echarts from 'echarts'

const isCN = inject('isCN', ref(true))

const logs = ref([])
const stats = ref({})
const loading = ref(false)
const filters = reactive({
  type: '',
  keyword: ''
})
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const trendChartRef = ref(null)
let trendChart = null

const logTypes = [
  { value: 'login', label: '登录', labelEn: 'Login' },
  { value: 'logout', label: '登出', labelEn: 'Logout' },
  { value: 'control', label: '设备控制', labelEn: 'Control' },
  { value: 'config', label: '配置变更', labelEn: 'Config' },
  { value: 'alert', label: '告警操作', labelEn: 'Alert' },
  { value: 'user', label: '用户管理', labelEn: 'User' },
  { value: 'system', label: '系统操作', labelEn: 'System' }
]

const activeUsers = computed(() => {
  return stats.value.userActivity?.length || 0
})

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (filters.type) params.type = filters.type
    if (filters.keyword) params.keyword = filters.keyword
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }

    const res = await axios.get('/api/audit/logs', { params })
    if (res.data.success) {
      logs.value = res.data.data.items
      total.value = res.data.data.total
    }
  } catch (error) {
    console.error('Failed to fetch logs:', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/audit/stats')
    if (res.data.success) {
      stats.value = res.data.data
      updateTrendChart(res.data.data.last7Days)
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const updateTrendChart = (data) => {
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  const labels = data.map(d => d.date.slice(5).replace('-', '/'))

  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', name: isCN.value ? '日志数' : 'Count' },
    series: [{
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: data.map(d => d.count),
      itemStyle: { color: '#667eea' }
    }]
  })
}

const handleDateChange = () => {
  fetchLogs()
}

const exportLogs = async () => {
  try {
    const res = await axios.get('/api/audit/export?format=csv')
    if (res.data) {
      ElMessage.success(isCN.value ? '导出成功' : 'Export successful')
    }
  } catch (error) {
    ElMessage.error(isCN.value ? '导出失败' : 'Export failed')
  }
}

const getTypeColor = (type) => {
  const colors = {
    login: 'primary',
    logout: 'info',
    control: 'success',
    config: 'warning',
    alert: 'danger',
    user: '',
    system: 'info'
  }
  return colors[type] || 'info'
}

const getTypeLabel = (type) => {
  return logTypes.find(t => t.value === type)?.label || type
}

const getTypeLabelEn = (type) => {
  return logTypes.find(t => t.value === type)?.labelEn || type
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString(isCN.value ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchLogs()
  fetchStats()

  window.addEventListener('resize', () => {
    trendChart?.resize()
  })
})
</script>

<style scoped>
.audit-log {
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

.header-actions {
  display: flex;
  gap: 12px;
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

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.time-cell {
  font-size: 13px;
  color: #606266;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
}

.action-cell {
  strong {
    color: #303133;
  }

  .details {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #909399;
  }
}

.ip-cell {
  font-size: 12px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #606266;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.chart-container {
  height: 250px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-wrap: wrap;
  }
}
</style>
