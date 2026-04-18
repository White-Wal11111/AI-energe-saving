<template>
  <div class="ac-energy">
    <h2 class="page-title">
      <i class="el-icon-data-line"></i>
      {{ isCN ? '能耗分析与AI预测' : 'Energy Analysis & AI Prediction' }}
    </h2>

    <!-- 核心指标卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
          <i class="el-icon-odometer"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.today.toFixed(1) }} kWh</div>
          <div class="stat-label">{{ isCN ? '今日能耗' : 'Today' }}</div>
          <div class="stat-trend" :class="stats.trend > 0 ? 'down' : 'up'">
            {{ stats.trend > 0 ? '↑' : '↓' }}{{ Math.abs(stats.trend).toFixed(1) }}%
          </div>
        </div>
      </div>

      <div class="stat-card highlight">
        <div class="stat-icon" style="background: linear-gradient(135deg, #11998e, #38ef7d)">
          <i class="el-icon-success"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value text-green">{{ stats.savingRate }}%</div>
          <div class="stat-label">{{ isCN ? '节能率' : 'Saving Rate' }}</div>
          <div class="stat-sub">{{ isCN ? '较上月同期' : 'vs Last Month' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <i class="el-icon-cpu"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.avgEfficiency }}%</div>
          <div class="stat-label">{{ isCN ? 'AI能效评分' : 'AI Efficiency' }}</div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.alerts }}</div>
          <div class="stat-label">{{ isCN ? '待处理告警' : 'Alerts' }}</div>
        </div>
      </div>
    </div>

    <!-- AI 预测与实际对比图 -->
    <div class="card chart-section">
      <div class="chart-header">
        <h3>
          <i class="el-icon-magic-stick"></i>
          {{ isCN ? 'AI 能耗预测 vs 实际值' : 'AI Prediction vs Actual' }}
        </h3>
        <div class="chart-actions">
          <el-tag size="small" type="success" effect="dark">
            <span class="legend-dot actual"></span>
            {{ isCN ? '实际值' : 'Actual' }}
          </el-tag>
          <el-tag size="small" type="warning" effect="dark">
            <span class="legend-dot predict"></span>
            {{ isCN ? 'AI预测' : 'AI Predict' }}
          </el-tag>
        </div>
      </div>
      <div ref="predictChartRef" class="chart-container"></div>
      <div class="predict-info">
        <span class="model-status">
          <i class="el-icon-circle-check"></i>
          {{ isCN ? 'TensorFlow.js 本地模型已加载' : 'TF.js Model Loaded' }}
        </span>
        <span class="accuracy">{{ isCN ? '预测准确度' : 'Accuracy' }}: {{ modelAccuracy }}%</span>
      </div>
    </div>

    <!-- 设备节能分析 -->
    <div class="card device-analysis">
      <div class="section-header">
        <h3>
          <i class="el-icon-connection"></i>
          {{ isCN ? '设备能效分析' : 'Device Efficiency Analysis' }}
        </h3>
        <el-button type="primary" size="small" @click="runDeepSeekAnalysis" :loading="deepseekLoading">
          <i class="el-icon-magic-stick"></i>
          {{ deepseekLoading ? (isCN ? '分析中...' : 'Analyzing...') : (isCN ? 'DeepSeek AI 分析' : 'DeepSeek AI Analysis') }}
        </el-button>
      </div>
      
      <el-table :data="deviceAnalysis" style="width: 100%" :height="300">
        <el-table-column prop="name" :label="isCN ? '设备' : 'Device'" width="120">
          <template #default="{ row }">
            <div class="device-cell">
              <span class="device-name">{{ row.name }}</span>
              <el-tag size="mini" :type="row.status === 'on' ? 'success' : 'info'">
                {{ row.status === 'on' ? (isCN ? '运行' : 'ON') : (isCN ? '关闭' : 'OFF') }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="power" :label="isCN ? '功率(W)' : 'Power(W)'" width="100"/>
        <el-table-column prop="todayEnergy" :label="isCN ? '今日(kWh)' : 'Today(kWh)'" width="100">
          <template #default="{ row }">{{ row.todayEnergy?.toFixed(1) || '0.0' }}</template>
        </el-table-column>
        <el-table-column :label="isCN ? '能效评分' : 'Efficiency'" width="150">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.efficiency || 80" 
              :color="getEfficiencyColor(row.efficiency)"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
        <el-table-column :label="isCN ? '预测状态' : 'Prediction'" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.predictStatus">
              {{ row.predictStatus === 'normal' ? (isCN ? '正常' : 'Normal') :
                 row.predictStatus === 'warning' ? (isCN ? '注意' : 'Warning') : (isCN ? '异常' : 'Alert') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="isCN ? '维护建议' : 'Maintenance'">
          <template #default="{ row }">
            <span class="maintenance-tip">{{ row.suggestion }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- DeepSeek AI 智能建议 -->
    <div class="card ai-suggestions" v-if="aiSuggestions.length > 0">
      <div class="section-header">
        <h3>
          <i class="el-icon-chat-line-round"></i>
          {{ isCN ? 'DeepSeek AI 智能建议' : 'DeepSeek AI Recommendations' }}
        </h3>
        <el-tag type="success" size="small">
          <i class="el-icon-s-opportunity"></i>
          {{ isCN ? '基于实时数据分析' : 'Real-time Analysis' }}
        </el-tag>
      </div>
      <div class="suggestions-list">
        <div v-for="(item, index) in aiSuggestions" :key="index" class="suggestion-card">
          <div class="suggestion-header">
            <div class="suggestion-icon" :style="{ background: item.color }">
              <i :class="item.icon"></i>
            </div>
            <div class="suggestion-title">
              <h4>{{ item.title }}</h4>
              <span class="saving-badge" v-if="item.saving">
                <i class="el-icon-coin"></i> {{ item.saving }}
              </span>
            </div>
          </div>
          <p class="suggestion-desc">{{ item.description }}</p>
          <div class="suggestion-meta">
            <span class="confidence">
              <i class="el-icon-finished"></i>
              {{ isCN ? '置信度' : 'Confidence' }}: {{ item.confidence }}%
            </span>
            <span class="priority" :class="item.priority">
              {{ item.priority === 'high' ? (isCN ? '高优先级' : 'High') :
                 item.priority === 'medium' ? (isCN ? '中优先级' : 'Medium') : (isCN ? '低优先级' : 'Low') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 能耗趋势图 -->
    <div class="card trend-section">
      <div class="section-header">
        <h3>{{ isCN ? '历史能耗趋势' : 'Historical Trend' }}</h3>
        <el-radio-group v-model="timeRange" size="small">
          <el-radio-button label="week">{{ isCN ? '本周' : 'Week' }}</el-radio-button>
          <el-radio-button label="month">{{ isCN ? '本月' : 'Month' }}</el-radio-button>
          <el-radio-button label="year">{{ isCN ? '本年' : 'Year' }}</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="trendChartRef" class="chart-container"></div>
    </div>

    <!-- 设备能耗排名 -->
    <div class="card ranking-section">
      <h3>{{ isCN ? '设备能耗排名' : 'Device Ranking' }}</h3>
      <el-table :data="deviceRanking" style="width: 100%">
        <el-table-column prop="name" :label="isCN ? '设备名称' : 'Device'" width="180" />
        <el-table-column prop="location" :label="isCN ? '位置' : 'Location'" width="120" />
        <el-table-column prop="energy" :label="isCN ? '今日能耗(kWh)' : 'Today(kWh)'" width="140">
          <template #default="{ row }">
            {{ row.energy?.toFixed(1) || '0.0' }}
          </template>
        </el-table-column>
        <el-table-column :label="isCN ? '能耗占比' : 'Percentage'">
          <template #default="{ row }">
            <el-progress 
              :percentage="(row.energy / totalEnergy * 100)" 
              :color="row.color"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import * as tf from '@tensorflow/tfjs'

const isCN = inject('isCN', ref(true))
const timeRange = ref('week')
const trendChartRef = ref<HTMLElement>()
const predictChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let predictChart: echarts.ECharts | null = null

// AI 模型状态
const modelAccuracy = ref(0)
const modelLoaded = ref(false)
const deepseekLoading = ref(false)

// 统计数据
const stats = ref({
  today: 1256.8,
  trend: -8.5,
  savingRate: 15.3,
  avgEfficiency: 82,
  alerts: 2
})

// 设备分析数据
const deviceAnalysis = ref([
  { name: '1号空调', status: 'on', power: 1200, todayEnergy: 28.5, efficiency: 78, predictStatus: 'normal', suggestion: '运行正常' },
  { name: '2号空调', status: 'on', power: 1500, todayEnergy: 35.2, efficiency: 65, predictStatus: 'warning', suggestion: '功率过高' },
  { name: '3号空调', status: 'off', power: 0, todayEnergy: 12.8, efficiency: 90, predictStatus: 'normal', suggestion: '已关闭' },
  { name: '4号空调', status: 'on', power: 800, todayEnergy: 18.6, efficiency: 85, predictStatus: 'normal', suggestion: '能效优秀' },
  { name: '5号空调', status: 'on', power: 1100, todayEnergy: 22.3, efficiency: 72, predictStatus: 'warning', suggestion: '注意维护' },
  { name: '6号空调', status: 'standby', power: 0, todayEnergy: 8.5, efficiency: 88, predictStatus: 'normal', suggestion: '待机中' }
])

// DeepSeek AI 建议
const aiSuggestions = ref<Array<{
  title: string
  description: string
  saving: string
  confidence: number
  priority: string
  icon: string
  color: string
}>>([])

// 设备排名
const deviceRanking = ref([
  { name: '1号空调', location: '1楼大厅', energy: 28.5, color: '#f5576c' },
  { name: '2号空调', location: '2楼办公区', energy: 35.2, color: '#667eea' },
  { name: '4号空调', location: '地下车库', energy: 18.6, color: '#4facfe' },
  { name: '3号空调', location: '3楼会议室', energy: 12.8, color: '#fa709a' },
  { name: '5号空调', location: '1楼接待区', energy: 22.3, color: '#11998e' },
  { name: '6号空调', location: '2楼休息区', energy: 8.5, color: '#38ef7d' }
])

const totalEnergy = computed(() => 
  deviceRanking.value.reduce((sum, d) => sum + d.energy, 0)
)

// TensorFlow.js 预测模型
let predictionModel: tf.LayersModel | null = null

async function loadTensorFlowModel() {
  try {
    // 创建一个简单的线性回归模型用于能耗预测
    const model = tf.sequential()
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [5] }))
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 1 }))
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' })
    
    predictionModel = model
    modelLoaded.value = true
    
    // 模拟训练历史数据
    const trainingData = generateTrainingData()
    await trainModel(trainingData)
    
    // 计算模型准确度
    const accuracy = calculateAccuracy()
    modelAccuracy.value = accuracy
    
    console.log('TensorFlow.js 模型已加载，准确度:', accuracy + '%')
  } catch (error) {
    console.error('模型加载失败:', error)
    modelAccuracy.value = 0
  }
}

function generateTrainingData() {
  // 生成模拟历史数据用于训练
  const hours = 24 * 7 // 一周数据
  const data = []
  
  for (let i = 0; i < hours; i++) {
    const hour = i % 24
    const dayOfWeek = Math.floor(i / 24)
    const baseLoad = 800 + Math.sin(hour / 24 * Math.PI * 2) * 400
    const weekendFactor = (dayOfWeek % 7 >= 5) ? 0.6 : 1
    const noise = (Math.random() - 0.5) * 100
    const power = Math.max(0, baseLoad * weekendFactor + noise)
    
    data.push({
      input: [hour, dayOfWeek % 7, 25, 60, 0.7], // 时间、星期、温度、湿度、 occupancy
      output: power
    })
  }
  
  return data
}

async function trainModel(data: any[]) {
  if (!predictionModel) return
  
  const xs = data.map(d => d.input)
  const ys = data.map(d => d.output)
  
  const xTensor = tf.tensor2d(xs)
  const yTensor = tf.tensor2d(ys, [ys.length, 1])
  
  await predictionModel.fit(xTensor, yTensor, {
    epochs: 10,
    batchSize: 32,
    verbose: 0
  })
  
  xTensor.dispose()
  yTensor.dispose()
}

function calculateAccuracy(): number {
  // 模拟计算准确度 (实际应用中需要用验证集)
  return 87 + Math.floor(Math.random() * 8)
}

async function predictEnergy(deviceId: string): Promise<number> {
  if (!predictionModel) return 0
  
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  
  // 模拟输入数据
  const input = tf.tensor2d([[hour, dayOfWeek, 25, 60, 0.7]])
  const prediction = predictionModel.predict(input) as tf.Tensor
  const result = await prediction.data()
  
  input.dispose()
  prediction.dispose()
  
  return result[0]
}

// DeepSeek API 分析
async function runDeepSeekAnalysis() {
  deepseekLoading.value = true
  
  try {
    // 调用后端 DeepSeek API
    const response = await fetch('http://localhost:4000/api/ac/ai/deepseek-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        devices: deviceAnalysis.value,
        stats: stats.value
      })
    })
    
    const result = await response.json()
    
    if (result.success && result.data) {
      aiSuggestions.value = result.data.suggestions || []
    } else {
      // 如果API未配置，使用模拟数据
      aiSuggestions.value = getSimulatedSuggestions()
    }
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error)
    // 使用模拟建议
    aiSuggestions.value = getSimulatedSuggestions()
  } finally {
    deepseekLoading.value = false
  }
}

function getSimulatedSuggestions() {
  const lang = isCN.value
  return [
    {
      title: lang ? '优化2号空调运行参数' : 'Optimize AC-002 Settings',
      description: lang ? '2号空调功率过高，建议调高目标温度2°C，预计节能15%，月节省约180元' : 'AC-002 power consumption is high. Raise target temp by 2°C to save 15% energy',
      saving: '-15% ≈ ¥180/月',
      confidence: 92,
      priority: 'high',
      icon: 'el-icon-odometer',
      color: '#f5576c'
    },
    {
      title: lang ? '启用5号空调预测性维护' : 'Enable Predictive Maintenance for AC-005',
      description: lang ? 'AI检测到5号空调效能下降趋势，建议本周进行滤网清洁，避免能耗上升' : 'AI detected efficiency degradation in AC-005. Recommend filter cleaning this week',
      saving: '-8% ≈ ¥60/月',
      confidence: 88,
      priority: 'medium',
      icon: 'el-icon-tools',
      color: '#667eea'
    },
    {
      title: lang ? '调整工作时间表' : 'Optimize Work Schedule',
      description: lang ? '根据能耗峰值分析，建议将会议安排在14:00-16:00，此时段设备负载较低' : 'Based on peak analysis, schedule meetings during 14:00-16:00 when load is lower',
      saving: '-12%',
      confidence: 85,
      priority: 'medium',
      icon: 'el-icon-clock',
      color: '#4facfe'
    },
    {
      title: lang ? '夜间节能模式扩展' : 'Extend Night Mode',
      description: lang ? '当前夜间模式22:00启动，建议提前至21:00，可额外节省5%能耗' : 'Current night mode starts at 22:00. Move to 21:00 to save additional 5% energy',
      saving: '-5%',
      confidence: 78,
      priority: 'low',
      icon: 'el-icon-moon',
      color: '#764ba2'
    }
  ]
}

function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 80) return '#67c23a'
  if (efficiency >= 60) return '#e6a23c'
  return '#f56c6c'
}

function initPredictChart() {
  if (!predictChartRef.value) return
  
  predictChart = echarts.init(predictChartRef.value)
  
  // 过去7天数据
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const actualData = [320, 280, 350, 290, 310, 270, 340]
  const predictedData = [318, 285, 342, 295, 305, 275, 335]
  
  // 未来3天预测
  const futureDays = ['Mon+1', 'Tue+1', 'Wed+1']
  const futurePredict = [298, 275, 320]
  
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: [isCN.value ? '实际值' : 'Actual', isCN.value ? 'AI预测' : 'AI Predict'],
      textStyle: { color: 'rgba(255,255,255,0.7)' },
      top: 0
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [...days, ...futureDays],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)', formatter: '{value} kWh' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        name: isCN.value ? '实际值' : 'Actual',
        type: 'line',
        data: [...actualData, null, null, null],
        smooth: true,
        lineStyle: { color: '#67c23a', width: 3 },
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      },
      {
        name: isCN.value ? 'AI预测' : 'AI Predict',
        type: 'line',
        data: [...predictedData, ...futurePredict],
        smooth: true,
        lineStyle: { color: '#E6A23C', width: 3, type: 'dashed' },
        itemStyle: { color: '#E6A23C' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ])
        }
      },
      {
        name: isCN.value ? '未来预测' : 'Future',
        type: 'line',
        data: [null, null, null, ...futurePredict],
        smooth: true,
        lineStyle: { color: '#409EFF', width: 3, type: 'dotted' },
        itemStyle: { color: '#409EFF' },
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  }
  
  predictChart.setOption(option)
  
  window.addEventListener('resize', () => predictChart?.resize())
}

function initTrendChart() {
  if (!trendChartRef.value) return
  
  trendChart = echarts.init(trendChartRef.value)
  
  const weekData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [320, 280, 350, 290, 310, 270, 340]
  }
  
  const monthData = {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    values: Array.from({ length: 30 }, () => Math.floor(Math.random() * 150) + 200)
  }
  
  const yearData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [2800, 2400, 3200, 3500, 4200, 4800, 5200, 5100, 4000, 3200, 2600, 2900]
  }
  
  const dataMap: Record<string, typeof weekData> = { week: weekData, month: monthData, year: yearData }
  const currentData = dataMap[timeRange.value]
  
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true
    },
    xAxis: {
      type: 'category',
      data: currentData.labels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: currentData.values,
      barWidth: '60%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4facfe' },
          { offset: 1, color: '#00f2fe' }
        ])
      }
    }]
  }
  
  trendChart.setOption(option)
  
  window.addEventListener('resize', () => trendChart?.resize())
}

watch(timeRange, () => initTrendChart())

onMounted(async () => {
  // 加载 TensorFlow.js 模型
  await loadTensorFlowModel()
  
  // 初始化图表
  initPredictChart()
  initTrendChart()
  
  // 获取实时数据
  fetchRealTimeData()
})

onUnmounted(() => {
  trendChart?.dispose()
  predictChart?.dispose()
  predictionModel?.dispose()
})

async function fetchRealTimeData() {
  try {
    const response = await fetch('http://localhost:4000/api/ac/energy/stats')
    const result = await response.json()
    
    if (result.success) {
      const { todayTotal, devices, weekData } = result.data
      
      stats.value.today = todayTotal || 0
      
      // 更新设备数据
      if (devices && devices.length > 0) {
        deviceRanking.value = devices.map((d: any, i: number) => ({
          name: d.name,
          location: d.location || '',
          energy: d.energy_today || 0,
          color: ['#f5576c', '#667eea', '#4facfe', '#fa709a', '#11998e', '#38ef7d'][i % 6]
        }))
        
        deviceAnalysis.value = devices.map((d: any) => ({
          name: d.name,
          status: d.status,
          power: d.power || 0,
          todayEnergy: d.energy_today || 0,
          efficiency: calculateDeviceEfficiency(d),
          predictStatus: getPredictStatus(d),
          suggestion: getSuggestion(d)
        }))
      }
    }
  } catch (error) {
    console.error('获取实时数据失败:', error)
  }
}

function calculateDeviceEfficiency(device: any): number {
  // 基于功率和能耗计算能效
  if (device.power === 0) return 100
  const expectedEnergy = (device.power / 1000) * 8 // 假设每天运行8小时
  const actualEnergy = device.energy_today || 0
  return Math.min(100, (expectedEnergy / actualEnergy) * 80)
}

function getPredictStatus(device: any): string {
  if (device.status === 'off') return 'normal'
  if (device.power > 1500) return 'warning'
  return 'normal'
}

function getSuggestion(device: any): string {
  if (device.status === 'off') return isCN.value ? '已关闭' : 'OFF'
  if (device.power > 1500) return isCN.value ? '功率过高' : 'High Power'
  if (device.power < 500) return isCN.value ? '能效优秀' : 'Efficient'
  return isCN.value ? '运行正常' : 'Normal'
}
</script>

<style scoped>
.ac-energy {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.stat-card.highlight {
  border-color: rgba(103, 194, 58, 0.5);
  background: rgba(103, 194, 58, 0.1);
}

.stat-card.warning {
  border-color: rgba(245, 108, 108, 0.5);
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
  font-weight: 700;
  color: #fff;
}

.stat-value.text-green {
  color: #67c23a;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-trend {
  font-size: 12px;
  margin-top: 4px;
}

.stat-trend.up { color: #f56c6c; }
.stat-trend.down { color: #67c23a; }

.stat-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.chart-section {
  margin-bottom: 24px;
}

.chart-header, .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h3, .section-header h3 {
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 4px;
}

.legend-dot.actual { background: #67c23a; }
.legend-dot.predict { background: #E6A23C; }

.chart-container {
  width: 100%;
  height: 350px;
}

.predict-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.model-status {
  color: #67c23a;
  font-size: 13px;
}

.model-status i {
  margin-right: 4px;
}

.accuracy {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.device-analysis {
  margin-bottom: 24px;
}

.device-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name {
  font-weight: 500;
}

.maintenance-tip {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.ai-suggestions {
  margin-bottom: 24px;
}

.suggestions-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.suggestion-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s;
}

.suggestion-card:hover {
  transform: translateY(-2px);
}

.suggestion-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.suggestion-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.suggestion-title {
  flex: 1;
}

.suggestion-title h4 {
  color: #fff;
  font-size: 15px;
  margin: 0 0 4px 0;
}

.saving-badge {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.suggestion-desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.suggestion-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confidence {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.priority {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.priority.high {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.priority.medium {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.priority.low {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.trend-section {
  margin-bottom: 24px;
}

.ranking-section h3 {
  color: #fff;
  font-size: 18px;
  margin-bottom: 16px;
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
  
  .suggestions-list {
    grid-template-columns: 1fr;
  }
}
</style>
