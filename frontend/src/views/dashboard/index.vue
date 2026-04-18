<template>
  <div class="dashboard">
    <h2 class="page-title">
      <i class="el-icon-data-analysis"></i>
      {{ isCN ? '系统概览' : 'System Overview' }}
    </h2>

    <!-- 核心指标卡片 -->
    <div class="stats-grid">
      <div class="stat-card highlight" @click="$router.push('/ac-control')" style="cursor: pointer;">
        <div class="stat-icon" style="background: linear-gradient(135deg, #11998e, #38ef7d)">
          <i class="el-icon-success"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value text-green">{{ stats.savingRate }}%</div>
          <div class="stat-label">{{ isCN ? '节能率' : 'Saving Rate' }}</div>
          <div class="stat-sub">{{ isCN ? '较上月同期' : 'vs Last Month' }}</div>
        </div>
      </div>

      <div class="stat-card" @click="$router.push('/ac-control')" style="cursor: pointer;">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <i class="el-icon-cpu"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgEfficiency }}%</div>
          <div class="stat-label">{{ isCN ? 'AI能效评分' : 'AI Efficiency' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
          <i class="el-icon-odometer"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.today.toFixed(1) }} kWh</div>
          <div class="stat-label">{{ isCN ? '今日空调能耗' : 'Today AC Energy' }}</div>
          <div class="stat-trend" :class="stats.trend > 0 ? 'up' : 'down'">
            {{ stats.trend > 0 ? '↑' : '↓' }}{{ Math.abs(stats.trend).toFixed(1) }}%
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-cold-air"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ summary?.activeDevices || 0 }}/{{ summary?.totalDevices || 0 }}</div>
          <div class="stat-label">{{ isCN ? '空调设备运行' : 'AC Devices Active' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-bangzhu"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ summary?.parking?.available || 0 }}/{{ summary?.parking?.total || 0 }}</div>
          <div class="stat-label">{{ isCN ? '车位空闲' : 'Parking Available' }}</div>
        </div>
      </div>

      <div class="stat-card clickable" @click="$router.push('/alerts')">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a, #fee140)">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.alerts }}</div>
          <div class="stat-label">{{ isCN ? '待处理告警' : 'Pending Alerts' }}</div>
        </div>
      </div>
    </div>

    <!-- AI 能耗预测与节能建议 -->
    <div class="card ai-section">
      <div class="section-header">
        <h3 class="card-title">
          <i class="el-icon-magic-stick"></i>
          {{ isCN ? 'AI 智能节能建议' : 'AI Smart Saving Suggestions' }}
        </h3>
        <el-button type="primary" size="small" @click="$router.push('/ac-control')">
          <i class="el-icon-data-line"></i>
          {{ isCN ? '查看详情' : 'View Details' }}
        </el-button>
      </div>
      
      <div class="suggestions-preview">
        <div v-for="(item, index) in topSuggestions" :key="index" class="suggestion-item">
          <div class="suggestion-icon" :style="{ background: item.color }">
            <i :class="item.icon"></i>
          </div>
          <div class="suggestion-content">
            <h4>{{ item.title }}</h4>
            <p>{{ item.desc }}</p>
          </div>
          <div class="suggestion-saving">
            <span class="saving-amount">{{ item.saving }}</span>
            <el-tag size="small" :type="item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'">
              {{ item.priority === 'high' ? (isCN ? '高' : 'High') : item.priority === 'medium' ? (isCN ? '中' : 'Med') : (isCN ? '低' : 'Low') }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 设备能效排名 -->
    <div class="card device-ranking">
      <div class="section-header">
        <h3 class="card-title">
          <i class="el-icon-data-line"></i>
          {{ isCN ? '空调设备能耗排名' : 'AC Device Energy Ranking' }}
        </h3>
      </div>
      <div class="ranking-list">
        <div v-for="(device, index) in deviceRanking" :key="device.name" class="ranking-item">
          <span class="rank-num" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
          <div class="device-info">
            <span class="device-name">{{ device.name }}</span>
            <span class="device-location">{{ device.location }}</span>
          </div>
          <div class="energy-bar">
            <div class="bar-fill" :style="{ width: (device.energy / maxEnergy * 100) + '%', background: device.color }"></div>
          </div>
          <span class="energy-value">{{ device.energy.toFixed(1) }} kWh</span>
        </div>
      </div>
    </div>

    <!-- 能耗趋势图 -->
    <div class="card energy-card">
      <div class="section-header">
        <h3 class="card-title">{{ isCN ? '本周能耗趋势' : 'Weekly Energy Trend' }}</h3>
        <el-radio-group v-model="timeRange" size="small">
          <el-radio-button label="week">{{ isCN ? '本周' : 'Week' }}</el-radio-button>
          <el-radio-button label="month">{{ isCN ? '本月' : 'Month' }}</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="energyChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue'
import * as echarts from 'echarts'
import { useBuildingStore } from '@/stores/building'

const store = useBuildingStore()
const isCN = inject('isCN', ref(true))
const summary = ref(store.dashboardSummary)
const energyChartRef = ref<HTMLElement>()
const timeRange = ref('week')

let energyChart: echarts.ECharts | null = null

// 能耗统计数据
const stats = ref({
  today: 1256.8,
  trend: -8.5,
  savingRate: 15.3,
  avgEfficiency: 82,
  alerts: 2
})

// AI 节能建议
const topSuggestions = ref([
  {
    title: '优化2号空调运行参数',
    desc: '2号空调功率过高，建议调高目标温度2°C',
    saving: '-15%',
    savingMoney: '¥180/月',
    priority: 'high',
    icon: 'el-icon-odometer',
    color: '#f5576c'
  },
  {
    title: '启用5号空调预测性维护',
    desc: 'AI检测到5号空调效能下降趋势',
    saving: '-8%',
    savingMoney: '¥60/月',
    priority: 'medium',
    icon: 'el-icon-tools',
    color: '#667eea'
  },
  {
    title: '夜间节能模式扩展',
    desc: '当前夜间模式22:00启动，建议提前至21:00',
    saving: '-5%',
    savingMoney: '¥40/月',
    priority: 'low',
    icon: 'el-icon-moon',
    color: '#764ba2'
  }
])

// 设备排名
const deviceRanking = ref([
  { name: '2号空调', location: '2楼办公区', energy: 35.2, color: '#f5576c' },
  { name: '1号空调', location: '1楼大厅', energy: 28.5, color: '#667eea' },
  { name: '5号空调', location: '1楼接待区', energy: 22.3, color: '#4facfe' },
  { name: '4号空调', location: '地下车库', energy: 18.6, color: '#fa709a' },
  { name: '3号空调', location: '3楼会议室', energy: 12.8, color: '#11998e' },
  { name: '6号空调', location: '2楼休息区', energy: 8.5, color: '#38ef7d' }
])

const maxEnergy = computed(() => Math.max(...deviceRanking.value.map(d => d.energy)))

// 模拟数据
const mockSummary = {
  totalDevices: 12,
  activeDevices: 8,
  totalEnergy: 1256.8,
  energyChange: -5.2,
  alerts: 3,
  parking: {
    total: 200,
    available: 45
  }
}

onMounted(() => {
  summary.value = mockSummary
  initEnergyChart()
})

watch(timeRange, () => {
  initEnergyChart()
})

function initEnergyChart() {
  if (!energyChartRef.value) return
  
  if (energyChart) {
    energyChart.dispose()
  }
  
  energyChart = echarts.init(energyChartRef.value)
  
  const weekData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [320, 280, 350, 290, 310, 270, 340]
  }
  
  const monthData = {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    values: Array.from({ length: 30 }, () => Math.floor(Math.random() * 150) + 200)
  }
  
  const currentData = timeRange.value === 'week' ? weekData : monthData
  
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: currentData.labels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)', formatter: '{value} kWh' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      name: isCN.value ? '能耗' : 'Energy',
      type: 'bar',
      data: currentData.values,
      barWidth: timeRange.value === 'week' ? '50%' : '80%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4facfe' },
          { offset: 1, color: '#00f2fe' }
        ])
      }
    }]
  }
  
  energyChart.setOption(option)
  
  window.addEventListener('resize', () => {
    energyChart?.resize()
  })
}
</script>

<style scoped>
.dashboard {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(42, 138, 224, 0.15);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.highlight {
  border-color: #67c23a;
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.05), rgba(56, 239, 125, 0.05));
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
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-value.text-green {
  color: #67c23a;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-trend {
  font-size: 12px;
  margin-top: 4px;
}

.stat-trend.up { color: #f56c6c; }
.stat-trend.down { color: #67c23a; }

.stat-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.card-title {
  color: #303133;
  font-size: 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header .card-title {
  margin-bottom: 0;
}

.energy-card,
.ai-section,
.device-ranking {
  margin-bottom: 24px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

/* AI 建议区域 */
.suggestions-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: #f0f4f8;
  transform: translateX(4px);
}

.suggestion-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  color: #303133;
  font-size: 15px;
  margin: 0 0 4px 0;
}

.suggestion-content p {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

.suggestion-saving {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.saving-amount {
  color: #67c23a;
  font-weight: 700;
  font-size: 16px;
}

/* 设备排名 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.rank-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  background: #e8e8e8;
  color: #606266;
}

.rank-num.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffb347);
  color: #fff;
}

.rank-num.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #fff;
}

.rank-num.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #a0522d);
  color: #fff;
}

.device-info {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.device-name {
  color: #303133;
  font-weight: 600;
  font-size: 14px;
}

.device-location {
  color: #909399;
  font-size: 12px;
}

.energy-bar {
  flex: 1;
  height: 8px;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.energy-value {
  color: #606266;
  font-weight: 600;
  font-size: 14px;
  min-width: 80px;
  text-align: right;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .suggestion-item {
    flex-wrap: wrap;
  }
  
  .suggestion-saving {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e8e8e8;
  }
}
</style>
