<template>
  <div class="lighting">
    <h2 class="page-title">
      <i class="el-icon-sunny"></i>
      {{ isCN ? '灯光回路管理' : 'Lighting Control' }}
    </h2>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #ffd700, #ffb347)">
          <i class="el-icon-sunny"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ onCircuits }}/{{ totalCircuits }}</div>
          <div class="stat-label">{{ isCN ? '开启回路' : 'Circuits On' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <i class="el-icon-odometer"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ todayEnergy.toFixed(1) }} kWh</div>
          <div class="stat-label">{{ isCN ? '今日能耗' : 'Today Energy' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-wallet"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ (todayEnergy * 0.6).toFixed(1) }}</div>
          <div class="stat-label">{{ isCN ? '今日费用' : 'Today Cost' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
          <i class="el-icon-data-line"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ avgBrightness }}%</div>
          <div class="stat-label">{{ isCN ? '平均亮度' : 'Avg Brightness' }}</div>
        </div>
      </div>
    </div>

    <!-- 快速控制 -->
    <div class="card quick-control">
      <h3>{{ isCN ? '快速控制' : 'Quick Control' }}</h3>
      <div class="control-buttons">
        <el-button type="primary" size="large" @click="allOn">
          <i class="el-icon-open"></i>
          {{ isCN ? '全部开启' : 'All On' }}
        </el-button>
        <el-button type="danger" size="large" @click="allOff">
          <i class="el-icon-turn-off"></i>
          {{ isCN ? '全部关闭' : 'All Off' }}
        </el-button>
        <el-button size="large" @click="ecoMode">
          <i class="el-icon-leaf"></i>
          {{ isCN ? '节能模式' : 'Eco Mode' }}
        </el-button>
        <el-button size="large" @click="offPeakMode">
          <i class="el-icon-moon"></i>
          {{ isCN ? '低谷模式' : 'Off-Peak' }}
        </el-button>
      </div>
    </div>

    <!-- 楼层分区 -->
    <div class="floor-sections">
      <el-radio-group v-model="selectedFloor" size="large">
        <el-radio-button 
          v-for="floor in floors" 
          :key="floor.value" 
          :label="floor.value"
        >
          {{ isCN ? floor.label : floor.labelEn }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 回路列表 -->
    <div class="circuit-grid">
      <div 
        v-for="circuit in filteredCircuits" 
        :key="circuit.id" 
        class="circuit-card card"
        :class="{ 'circuit-on': circuit.status === 'on' }"
      >
        <div class="circuit-header">
          <div class="circuit-info">
            <h3>{{ circuit.name }}</h3>
            <span class="circuit-zone">{{ circuit.zone }} - {{ isCN ? '楼层' : 'Floor' }} {{ circuit.floor }}</span>
          </div>
          <el-switch 
            v-model="circuit.status" 
            active-value="on" 
            inactive-value="off"
            @change="toggleCircuit(circuit)"
          />
        </div>

        <div class="brightness-control">
          <div class="brightness-header">
            <span>{{ isCN ? '亮度' : 'Brightness' }}</span>
            <span class="brightness-value">{{ circuit.brightness }}%</span>
          </div>
          <el-slider 
            v-model="circuit.brightness" 
            :disabled="circuit.status === 'off'"
            :show-tooltip="false"
            @change="updateBrightness(circuit)"
          />
          <div class="brightness-icons">
            <i class="el-icon-moon"></i>
            <i class="el-icon-sunny"></i>
          </div>
        </div>

        <div class="circuit-stats">
          <div class="stat-item">
            <i class="el-icon-odometer"></i>
            <span>{{ circuit.power }}W</span>
          </div>
          <div class="stat-item">
            <span class="mode-tag" :class="circuit.mode">{{ getModeLabel(circuit.mode) }}</span>
          </div>
        </div>

        <div class="circuit-actions">
          <el-button-group size="small">
            <el-button @click="setMode(circuit, 'normal')">
              {{ isCN ? '正常' : 'Normal' }}
            </el-button>
            <el-button @click="setMode(circuit, 'eco')">
              {{ isCN ? '节能' : 'Eco' }}
            </el-button>
            <el-button @click="setMode(circuit, 'off-peak')">
              {{ isCN ? '低谷' : 'Off-Peak' }}
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 能耗图表 -->
    <div class="card energy-chart">
      <h3>{{ isCN ? '本周能耗趋势' : 'Weekly Energy Trend' }}</h3>
      <div ref="energyChartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { LightingCircuit } from '@shared/types'

const isCN = inject('isCN', ref(true))
const selectedFloor = ref('all')
const energyChartRef = ref<HTMLElement>()
let energyChart: echarts.ECharts | null = null

const floors = [
  { value: 'all', label: '全部', labelEn: 'All' },
  { value: '1', label: '1层', labelEn: 'Floor 1' },
  { value: '2', label: '2层', labelEn: 'Floor 2' },
  { value: '3', label: '3层', labelEn: 'Floor 3' },
  { value: 'B1', label: 'B1层', labelEn: 'B1' }
]

const todayEnergy = ref(156.8)
const avgBrightness = computed(() => {
  const onCircuits = circuits.value.filter(c => c.status === 'on')
  if (onCircuits.length === 0) return 0
  return Math.round(onCircuits.reduce((sum, c) => sum + c.brightness, 0) / onCircuits.length)
})

const circuits = ref<LightingCircuit[]>([
  { id: 'L001', name: '大厅主灯', zone: 'A区', floor: 1, status: 'on', brightness: 80, power: 400, mode: 'normal' },
  { id: 'L002', name: '大厅辅灯', zone: 'A区', floor: 1, status: 'off', brightness: 60, power: 200, mode: 'normal' },
  { id: 'L003', name: '办公区主灯', zone: 'B区', floor: 2, status: 'on', brightness: 100, power: 600, mode: 'normal' },
  { id: 'L004', name: '办公区辅灯', zone: 'B区', floor: 2, status: 'on', brightness: 70, power: 300, mode: 'eco' },
  { id: 'L005', name: '会议室灯', zone: 'C区', floor: 3, status: 'off', brightness: 50, power: 250, mode: 'off-peak' },
  { id: 'L006', name: '走廊灯', zone: 'D区', floor: 1, status: 'on', brightness: 40, power: 150, mode: 'eco' },
  { id: 'L007', name: '地下车库灯', zone: 'E区', floor: -1, status: 'on', brightness: 60, power: 800, mode: 'eco' },
  { id: 'L008', name: '应急照明', zone: 'F区', floor: 1, status: 'on', brightness: 30, power: 50, mode: 'normal' }
])

const totalCircuits = computed(() => circuits.value.length)
const onCircuits = computed(() => circuits.value.filter(c => c.status === 'on').length)

const filteredCircuits = computed(() => {
  if (selectedFloor.value === 'all') return circuits.value
  return circuits.value.filter(c => c.floor.toString() === selectedFloor.value)
})

function getModeLabel(mode: string) {
  const labels: Record<string, { cn: string; en: string }> = {
    'normal': { cn: '正常', en: 'Normal' },
    'eco': { cn: '节能', en: 'Eco' },
    'off-peak': { cn: '低谷', en: 'Off-Peak' },
    'off': { cn: '关闭', en: 'Off' }
  }
  return isCN.value ? labels[mode].cn : labels[mode].en
}

function toggleCircuit(circuit: LightingCircuit) {
  ElMessage.success(
    isCN.value 
      ? `${circuit.name} 已${circuit.status === 'on' ? '开启' : '关闭'}`
      : `${circuit.name} ${circuit.status === 'on' ? 'turned on' : 'turned off'}`
  )
}

function updateBrightness(circuit: LightingCircuit) {
  circuit.power = Math.round(circuit.brightness * 6)
}

function setMode(circuit: LightingCircuit, mode: string) {
  circuit.mode = mode
  if (mode === 'eco') {
    circuit.brightness = Math.min(circuit.brightness, 70)
  } else if (mode === 'off-peak') {
    circuit.brightness = Math.min(circuit.brightness, 50)
  }
  updateBrightness(circuit)
  ElMessage.success(
    isCN.value 
      ? `${circuit.name} 已切换为${getModeLabel(mode)}模式`
      : `${circuit.name} set to ${mode} mode`
  )
}

function allOn() {
  circuits.value.forEach(c => {
    c.status = 'on'
    c.power = Math.round(c.brightness * 6)
  })
  ElMessage.success(isCN.value ? '已全部开启' : 'All circuits turned on')
}

function allOff() {
  circuits.value.forEach(c => {
    c.status = 'off'
    c.power = 0
  })
  ElMessage.success(isCN.value ? '已全部关闭' : 'All circuits turned off')
}

function ecoMode() {
  circuits.value.forEach(c => {
    c.mode = 'eco'
    c.brightness = Math.min(c.brightness, 70)
    c.power = Math.round(c.brightness * 6)
    if (c.status === 'off') {
      c.status = 'on'
    }
  })
  ElMessage.success(isCN.value ? '已切换为节能模式' : 'Eco mode activated')
}

function offPeakMode() {
  circuits.value.forEach(c => {
    c.mode = 'off-peak'
    c.brightness = Math.min(c.brightness, 50)
    c.power = Math.round(c.brightness * 6)
  })
  ElMessage.success(isCN.value ? '已切换为低谷模式' : 'Off-peak mode activated')
}

function initChart() {
  if (!energyChartRef.value) return
  
  energyChart = echarts.init(energyChartRef.value)
  
  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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
      type: 'line',
      smooth: true,
      data: [145, 132, 158, 140, 155, 98, 120],
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 215, 0, 0.5)' },
          { offset: 1, color: 'rgba(255, 215, 0, 0.1)' }
        ])
      },
      lineStyle: { color: '#ffd700', width: 3 },
      itemStyle: { color: '#ffd700' }
    }]
  }
  
  energyChart.setOption(option)
  window.addEventListener('resize', () => energyChart?.resize())
}

onMounted(() => {
  initChart()
})
</script>

<style scoped>
.lighting {
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
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e8e8;
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

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.quick-control {
  margin-bottom: 24px;
}

.quick-control h3 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 16px;
}

.control-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.floor-sections {
  margin-bottom: 20px;
}

.circuit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.circuit-card {
  transition: all 0.3s ease;
}

.circuit-card.circuit-on {
  border-color: #ffd700;
}

.circuit-card:hover {
  transform: translateY(-4px);
}

.circuit-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.circuit-info h3 {
  color: #303133;
  font-size: 16px;
  margin-bottom: 4px;
}

.circuit-zone {
  color: #909399;
  font-size: 12px;
}

.brightness-control {
  margin-bottom: 16px;
}

.brightness-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.brightness-value {
  color: #ffd700;
  font-weight: 600;
}

.brightness-icons {
  display: flex;
  justify-content: space-between;
  color: #c0c4cc;
  font-size: 12px;
  margin-top: 4px;
}

.circuit-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.stat-item i {
  color: #ffd700;
}

.mode-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.mode-tag.normal {
  background: rgba(103, 194, 58, 0.15);
  color: #67c23a;
}

.mode-tag.eco {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
}

.mode-tag.off-peak {
  background: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
}

.circuit-actions {
  display: flex;
}

.energy-chart h3 {
  color: #303133;
  font-size: 18px;
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
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
  
  .control-buttons {
    flex-direction: column;
  }
  
  .control-buttons .el-button {
    width: 100%;
  }
}
</style>
