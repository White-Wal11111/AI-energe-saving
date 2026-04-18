<template>
  <div class="energy-analysis">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-data-line"></i>
        {{ isCN ? '综合能耗分析' : 'Energy Analysis' }}
      </h2>
      <div class="header-actions">
        <el-radio-group v-model="period" size="small" @change="fetchTrend">
          <el-radio-button label="day">{{ isCN ? '今日' : 'Today' }}</el-radio-button>
          <el-radio-button label="week">{{ isCN ? '本周' : 'Week' }}</el-radio-button>
          <el-radio-button label="month">{{ isCN ? '本月' : 'Month' }}</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="exportReport">
          <i class="el-icon-download"></i>
          {{ isCN ? '导出报表' : 'Export' }}
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <i class="el-icon-odometer"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ summary?.todayEnergy || 0 }} kWh</div>
          <div class="stat-label">{{ isCN ? '今日能耗' : 'Today Energy' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-data-line"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ summary?.totalEnergy || 0 }} kWh</div>
          <div class="stat-label">{{ isCN ? '总能耗' : 'Total Energy' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" :style="{ background: summary?.trend === 'down' ? 'linear-gradient(135deg, #67c23a, #85ce61)' : 'linear-gradient(135deg, #f56c6c, #e6a23c)' }">
          <i :class="summary?.trend === 'down' ? 'el-icon-bottom' : 'el-icon-top'"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ summary?.energyChange || 0 }}%</div>
          <div class="stat-label">{{ isCN ? '同比变化' : 'Change' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
          <i class="el-icon-wallet"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ summary?.cost || 0 }}</div>
          <div class="stat-label">{{ isCN ? '总费用' : 'Total Cost' }}</div>
        </div>
      </div>
    </div>

    <!-- 能耗趋势图 -->
    <div class="card chart-card">
      <h3 class="card-title">{{ isCN ? '能耗趋势' : 'Energy Trend' }}</h3>
      <div ref="trendChartRef" class="chart-container-large"></div>
    </div>

    <div class="grid-2">
      <!-- 各模块能耗占比 -->
      <div class="card">
        <h3 class="card-title">{{ isCN ? '各模块能耗占比' : 'Module Energy Share' }}</h3>
        <div ref="moduleChartRef" class="chart-container"></div>
      </div>

      <!-- 建筑能耗对比 -->
      <div class="card">
        <h3 class="card-title">{{ isCN ? '建筑能耗对比' : 'Building Comparison' }}</h3>
        <div ref="compareChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- AI节能建议 -->
    <div class="card advice-card">
      <h3 class="card-title">
        <i class="el-icon-magic-stick"></i>
        {{ isCN ? 'AI节能建议' : 'AI Energy Saving Advice' }}
      </h3>
      <div class="advice-list">
        <div
          v-for="advice in aiAdvice"
          :key="advice.id"
          class="advice-item"
          :class="advice.priority"
        >
          <div class="advice-icon">
            <i :class="getAdviceIcon(advice.type)"></i>
          </div>
          <div class="advice-content">
            <h4>{{ isCN ? advice.title : advice.title_en }}</h4>
            <p>{{ isCN ? advice.description : advice.description_en }}</p>
            <div class="advice-potential">
              <el-tag :type="advice.priority === 'high' ? 'danger' : advice.priority === 'medium' ? 'warning' : 'info'" size="small">
                {{ isCN ? '节能潜力' : 'Potential' }}: {{ advice.potential }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

const isCN = inject('isCN', ref(true))

const period = ref('week')
const summary = ref(null)
const aiAdvice = ref([])
const trendChartRef = ref(null)
const moduleChartRef = ref(null)
const compareChartRef = ref(null)

let trendChart = null
let moduleChart = null
let compareChart = null

const fetchSummary = async () => {
  try {
    const res = await axios.get('/api/energy/summary')
    if (res.data.success) {
      summary.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to fetch summary:', error)
  }
}

const fetchTrend = async () => {
  try {
    const res = await axios.get(`/api/energy/trend?period=${period.value}`)
    if (res.data.success) {
      updateTrendChart(res.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch trend:', error)
  }
}

const fetchModuleStats = async () => {
  try {
    const res = await axios.get('/api/energy/module-stats')
    if (res.data.success) {
      updateModuleChart(res.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch module stats:', error)
  }
}

const fetchCompare = async () => {
  try {
    const res = await axios.get('/api/energy/compare')
    if (res.data.success) {
      updateCompareChart(res.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch compare:', error)
  }
}

const fetchAiAdvice = async () => {
  try {
    const res = await axios.post('/api/energy/ai-advice')
    if (res.data.success) {
      aiAdvice.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to fetch AI advice:', error)
  }
}

const updateTrendChart = (data) => {
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.labels, boundaryGap: false },
    yAxis: { type: 'value', name: 'kWh' },
    series: [{
      name: data.datasets[0].name,
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: data.datasets[0].values,
      itemStyle: { color: '#667eea' }
    }]
  })
}

const updateModuleChart = (data) => {
  if (!moduleChart) {
    moduleChart = echarts.init(moduleChartRef.value)
  }
  moduleChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: data.modules.map((m, i) => ({
        name: isCN.value ? m.name : m.name_en,
        value: m.percentage,
        itemStyle: { color: ['#667eea', '#f5576c', '#4facfe', '#00f2fe', '#f093fb'][i] }
      }))
    }]
  })
}

const updateCompareChart = (data) => {
  if (!compareChart) {
    compareChart = echarts.init(compareChartRef.value)
  }
  compareChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: [isCN.value ? '能耗 (kWh)' : 'Energy (kWh)'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.buildings.map(b => b.name) },
    yAxis: { type: 'value', name: 'kWh' },
    series: [{
      name: isCN.value ? '能耗' : 'Energy',
      type: 'bar',
      data: data.buildings.map(b => b.energy),
      itemStyle: { color: '#667eea', borderRadius: [5, 5, 0, 0] }
    }]
  })
}

const getAdviceIcon = (type) => {
  const icons = {
    temperature: 'el-icon-cold-air',
    schedule: 'el-icon-clock',
    peak: 'el-icon-lightning',
    maintenance: 'el-icon-tools'
  }
  return icons[type] || 'el-icon-info'
}

const exportReport = async () => {
  try {
    const res = await axios.get('/api/energy/export')
    if (res.data.success) {
      ElMessage.success(isCN.value ? '报表生成成功' : 'Report generated')
    }
  } catch (error) {
    ElMessage.error(isCN.value ? '导出失败' : 'Export failed')
  }
}

onMounted(() => {
  fetchSummary()
  fetchTrend()
  fetchModuleStats()
  fetchCompare()
  fetchAiAdvice()

  window.addEventListener('resize', () => {
    trendChart?.resize()
    moduleChart?.resize()
    compareChart?.resize()
  })
})
</script>

<style scoped>
.energy-analysis {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-card {
  min-height: 350px;
}

.chart-container {
  height: 280px;
}

.chart-container-large {
  height: 300px;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.advice-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.advice-card .card-title {
  color: white;
}

.advice-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.advice-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  color: #303133;
}

.advice-item.high {
  border-left: 4px solid #f56c6c;
}

.advice-item.medium {
  border-left: 4px solid #e6a23c;
}

.advice-item.low {
  border-left: 4px solid #409eff;
}

.advice-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.advice-content {
  flex: 1;
}

.advice-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.advice-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .advice-list {
    grid-template-columns: 1fr;
  }
}
</style>
