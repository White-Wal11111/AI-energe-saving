<template>
  <div class="energy-monitor">
    <!-- 页面标题 -->
    <div class="page-title">
      <div class="title-left">
        <h1>
          <i class="el-icon-data-analysis"></i>
          {{ isCN ? '能耗与电费实时监测及对比' : 'Energy & Cost Real-time Monitoring' }}
        </h1>
        <p>{{ isCN ? '多维度能耗分析、趋势对比与节能率追踪' : 'Multi-dimensional energy analysis & savings tracking' }}</p>
      </div>
      <div class="title-right">
        <el-button type="primary" size="small" plain @click="handleExport">
          <i class="el-icon-download"></i> {{ isCN ? '导出数据' : 'Export' }}
        </el-button>
        <el-select v-model="refreshInterval" size="small" style="width: 130px" @change="resetAutoRefresh">
          <el-option :label="isCN ? '5分钟刷新' : '5min'" value="300000" />
          <el-option :label="isCN ? '15分钟刷新' : '15min'" value="900000" />
          <el-option :label="isCN ? '30分钟刷新' : '30min'" value="1800000" />
          <el-option :label="isCN ? '关闭自动' : 'Off'" value="0" />
        </el-select>
      </div>
    </div>

    <!-- 告警提示条 -->
    <div v-if="alertVisible" class="alert-banner" :class="'alert-' + alertLevel">
      <i class="el-icon-warning-outline"></i>
      <span>{{ alertMessage }}</span>
      <el-button link type="primary" size="small" @click="alertVisible = false">{{ isCN ? '关闭' : 'Dismiss' }}</el-button>
    </div>

    <!-- 实时指标卡片区 -->
    <div class="metrics-row">
      <div class="metric-card metric-primary">
        <div class="metric-icon"><i class="el-icon-lightning"></i></div>
        <div class="metric-body">
          <span class="metric-value">{{ realtime.totalPowerKw != null ? realtime.totalPowerKw.toFixed(1) : '--' }}</span>
          <span class="metric-unit">kW</span>
          <span class="metric-label">{{ isCN ? '总瞬时功率' : 'Total Power' }}</span>
        </div>
      </div>
      <div class="metric-card metric-cost">
        <div class="metric-icon"><i class="el-icon-money"></i></div>
        <div class="metric-body">
          <span class="metric-value">&yen;{{ realtime.todayCostYuan != null ? realtime.todayCostYuan.toFixed(2) : '--' }}</span>
          <span class="metric-label">{{ isCN ? '今日累计电费' : "Today's Total Cost" }}</span>
        </div>
      </div>
      <div class="metric-card" :class="savingCardClass">
        <div class="metric-icon"><i class="el-icon-trend-charts"></i></div>
        <div class="metric-body">
          <span class="metric-value">
            {{ realtime.savingRate != null ? (realtime.savingRate >= 0 ? '+' : '') + realtime.savingRate.toFixed(1) + '%' : '--' }}
          </span>
          <span class="metric-label">{{ isCN ? '实时节能率' : 'Savings Rate' }}
            <span v-if="realtime.compareEnergyKwh != null" class="compare-hint">
              (vs {{ isCN ? '去年同期' : 'last year' }}: {{ realtime.compareEnergyKwh.toFixed(1) }} kWh)
            </span>
          </span>
        </div>
      </div>
      <div class="metric-card metric-energy">
        <div class="metric-icon"><i class="el-icon-coin"></i></div>
        <div class="metric-body">
          <span class="metric-value">{{ realtime.todayEnergyKwh != null ? realtime.todayEnergyKwh.toFixed(1) : '--' }}</span>
          <span class="metric-unit">kWh</span>
          <span class="metric-label">{{ isCN ? '今日累计电量' : "Today's Energy" }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区：趋势图 + 分项占比 -->
    <div class="main-grid">
      <!-- 左侧：趋势图 -->
      <div class="chart-section">
        <div class="section-header">
          <h3><i class="el-icon-data-line"></i> {{ isCN ? '能耗/电费趋势对比' : 'Energy/Cost Trend Comparison' }}</h3>
          <div class="header-controls">
            <el-radio-group v-model="trendMetric" size="small">
              <el-radio-button value="energy">{{ isCN ? '能耗(kWh)' : 'Energy' }}</el-radio-button>
              <el-radio-button value="cost">{{ isCN ? '电费(&yen;)' : 'Cost' }}</el-radio-button>
            </el-radio-group>
            <el-segmented v-model="trendPeriod" :options="periodOptions" size="small" />
          </div>
        </div>

        <div ref="trendChartRef" class="chart-container"></div>

        <div class="legend-row">
          <span class="legend-item"><i class="legend-dot" style="background:#409EFF"></i>{{ isCN ? '当前周期' : 'Current Period' }}</span>
          <span class="legend-item"><i class="legend-dot" style="background:#E6A23C"></i>{{ isCN ? '去年同期' : 'Last Year Same Period' }}</span>
        </div>
      </div>

      <!-- 右侧：分项占比 -->
      <div class="pie-section">
        <div class="section-header">
          <h3><i class="el-icon-pie-chart"></i> {{ isCN ? '分项能耗占比' : 'Energy Breakdown' }}</h3>
        </div>
        <div ref="pieChartRef" class="chart-container pie-container"></div>

        <div class="breakdown-list">
          <div v-for="(item, idx) in breakdownList" :key="idx" class="breakdown-item">
            <span class="bd-color" :style="{ background: item.color }"></span>
            <span class="bd-label">{{ item.label }}</span>
            <span class="bd-value">{{ item.percentage }}%</span>
            <span class="bd-energy">{{ item.energyKwh }} kWh</span>
            <span class="bd-cost">&yen;{{ item.costYuan }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：各分项实时功率小卡片 -->
    <div class="sub-metrics">
      <h4><i class="el-icon-monitor"></i> {{ isCN ? '各分项实时功率' : 'Sub-system Power' }}</h4>
      <div class="sub-cards">
        <div v-for="(val, key) in realtime.categories" :key="key" class="sub-card">
          <span class="sub-label">{{ getCategoryLabel(key) }}</span>
          <span class="sub-val">{{ val.powerKw?.toFixed(1) || 0 }}</span>
          <span class="sub-unit">kW</span>
        </div>
      </div>
    </div>

    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" :title="isCN ? '导出数据' : 'Export Data'" width="450px">
      <el-form label-width="80px">
        <el-form-item :label="isCN ? '周期' : 'Period'">
          <el-select v-model="exportForm.period" style="width: 100%">
            <el-option label="日(Day)" value="day" />
            <el-option label="周(Week)" value="week" />
            <el-option label="月(Month)" value="month" />
          </el-select>
        </el-form-item>
        <el-form-item :label="isCN ? '格式' : 'Format'">
          <el-select v-model="exportForm.format" style="width: 100%">
            <el-option label="CSV" value="csv" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">{{ isCN ? '取消' : 'Cancel' }}</el-button>
        <el-button type="primary" :loading="exporting" @click="doExport">{{ isCN ? '导出' : 'Export' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import * as echarts from 'echarts'

const isCN = inject('isCN', ref(true))

// ====== 状态 ======
const refreshInterval = ref(900000) // 默认15分钟
let autoRefreshTimer = null
const loading = ref(false)
const alertVisible = ref(false)
const alertLevel = ref('warning')
const alertMessage = ref('')
const trendMetric = ref('energy')
const trendPeriod = ref('day')
const periodOptions = [
  { label: isCN.value ? '按天' : 'Day', value: 'day' },
  { label: isCN.value ? '按周' : 'Week', value: 'week' },
  { label: isCN.value ? '按月' : 'Month', value: 'month' }
]

// 实时数据
const realtime = ref({
  totalPowerKw: null,
  todayEnergyKwh: null,
  todayCostYuan: null,
  savingRate: null,
  compareEnergyKwh: null,
  lastUpdated: '',
  categories: {}
})

// 分项占比
const breakdownList = ref([])

// 趋势数据缓存（避免切换单位重复请求）
const cachedTrendData = ref(null)

// 图表实例
const trendChartRef = ref(null)
const pieChartRef = ref(null)
let trendChartInstance = null
let pieChartInstance = null

// 导出
const exportDialogVisible = ref(false)
const exporting = ref(false)
const exportForm = ref({ period: 'day', format: 'csv' })

// ====== 计算属性 ======
const savingCardClass = computed(() => {
  const rate = realtime.value.savingRate
  if (rate == null) return ''
  if (rate < -5) return 'metric-danger'
  if (rate < 0) return 'metric-warning'
  return 'metric-success'
})

// ====== 方法 ======
function getProjectId() { return localStorage.getItem('currentProjectId') || '1' }

function getHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

function getCategoryLabel(key) {
  const map = {
    chiller: isCN.value ? '冷机' : 'Chiller',
    chilled_pump: isCN.value ? '冷冻水泵' : 'Chilled Pump',
    condenser_pump: isCN.value ? '冷却水泵' : 'Cond. Pump',
    cooling_tower: isCN.value ? '冷却塔' : 'Cooling Tower',
    ahu: isCN.value ? '空调箱AHU' : 'AHU',
    terminal: isCN.value ? '末端设备' : 'Terminal',
    other: isCN.value ? '其他' : 'Other'
  }
  return map[key] || key
}

async function fetchRealtime() {
  try {
    const res = await axios.get('/api/energy-monitor/realtime', {
      params: { project_id: getProjectId() },
      headers: getHeaders()
    })
    if (res.data.success) {
      realtime.value = res.data.data
      checkAlert()
    }
  } catch (e) { console.error(e) }
}

async function fetchTrend() {
  loading.value = true
  try {
    const res = await axios.get('/api/energy-monitor/trend', {
      params: { project_id: getProjectId(), period: trendPeriod.value },
      headers: getHeaders()
    })
    if (res.data.success) {
      cachedTrendData.value = res.data.data
      renderTrendChart(res.data.data)
    }
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function fetchBreakdown() {
  try {
    const res = await axios.get('/api/energy-monitor/breakdown', {
      params: { project_id: getProjectId() },
      headers: getHeaders()
    })
    if (res.data.success) {
      breakdownList.value = res.data.data.breakdown
      nextTick(() => renderPieChart(res.data.data.breakdown))
    }
  } catch (e) { console.error(e) }
}

function checkAlert() {
  const rate = realtime.value.savingRate
  if (rate != null && rate < -5) {
    alertLevel.value = 'danger'
    alertMessage.value = isCN.value
      ? `⚠️ 当前节能率 ${rate.toFixed(1)}%，低于阈值 -5%，请检查设备运行状态！`
      : `⚠️ Savings rate ${rate.toFixed(1)}% below threshold -5%, please check equipment!`
    alertVisible.value = true
  } else if (rate != null && rate < 0) {
    alertLevel.value = 'warning'
    alertMessage.value = isCN.value
      ? `当前节能率 ${rate.toFixed(1)}%，低于预期`
      : `Savings rate ${rate.toFixed(1)}% below expected`
    alertVisible.value = true
  } else {
    alertVisible.value = false
  }
}

function resetAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  if (refreshInterval.value > 0) {
    autoRefreshTimer = setInterval(() => {
      fetchRealtime()
    }, refreshInterval.value)
  }
}

// ====== 趋势图渲染 ======
function renderTrendChart(data) {
  if (!echarts || !trendChartRef.value) return

  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }

  const isEnergy = trendMetric.value === 'energy'
  const unit = isEnergy
    ? (isCN.value ? '(kWh)' : '(kWh)')
    : (isCN.value ? '(元)' : '(\u00a5)')

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter(params) {
        if (!Array.isArray(params)) return ''
        const title = params[0]?.axisValue || ''
        let html = `<div style="font-weight:600;margin-bottom:6px">${title}</div>`
        for (const p of params) {
          const val = isEnergy
            ? `${p.value} kWh`
            : `\u00a5${Number(p.value).toFixed(2)}`
          html += `<div style="display:flex;align-items:center;gap:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
            ${p.seriesName}: ${val}
          </div>`
        }
        return html
      }
    },
    legend: {
      data: [isCN.value ? '当前' : 'Current', isCN.value ? '去年同期' : 'Last Year'],
      top: 4
    },
    grid: { left: 50, right: 20, top: 44, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: unit,
      axisLabel: { fontSize: 11 }
    },
    series: [
      {
        name: isCN.value ? '当前' : 'Current',
        type: trendPeriod.value === 'day' ? 'line' : 'bar',
        smooth: trendPeriod.value === 'day',
        data: data.current.map(d => isEnergy ? d.energy : d.cost),
        itemStyle: { color: '#409EFF' },
        areaStyle: trendPeriod.value === 'day' ? { color: 'rgba(64,158,255,0.12)' } : undefined
      },
      {
        name: isCN.value ? '去年同期' : 'Last Year',
        type: trendPeriod.value === 'day' ? 'line' : 'bar',
        smooth: trendPeriod.value === 'day',
        lineStyle: { type: 'dashed' },
        data: data.compare.map(d => isEnergy ? d.energy : d.cost),
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }

  trendChartInstance.setOption(option, true)
}

// ====== 饼图渲染 ======
function renderPieChart(breakdown) {
  if (!echarts || !pieChartRef.value) return

  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['38%', '52%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: breakdown.map(b => ({
        name: b.label,
        value: b.energyKwh,
        itemStyle: { color: b.color }
      }))
    }]
  }

  pieChartInstance.setOption(option, true)
}

// ====== 导出 ======
function handleExport() {
  exportDialogVisible.value = true
}

async function doExport() {
  exporting.value = true
  try {
    const res = await axios.get('/api/energy-monitor/export', {
      params: { project_id: getProjectId(), period: exportForm.value.period, format: exportForm.value.format },
      headers: getHeaders(),
      responseType: exportForm.value.format === 'csv' ? 'blob' : 'json'
    })

    if (exportForm.value.format === 'csv') {
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `energy_${exportForm.value.period}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success(isCN.value ? 'CSV 已下载' : 'CSV downloaded')
    } else {
      ElMessage.success(isCN.value ? JSON.stringify(res.data.data?.length || 0) + ' 条记录' : `${res.data.data?.length || 0} records`)
    }

    exportDialogVisible.value = false
  } catch (e) {
    ElMessage.error(isCN.value ? '导出失败' : 'Export failed')
  }
  finally { exporting.value = false }
}

// ====== 生命周期 ======
onMounted(() => {
  fetchRealtime()
  fetchTrend()
  fetchBreakdown()
  resetAutoRefresh()

  window.addEventListener('resize', () => {
    trendChartInstance?.resize()
    pieChartInstance?.resize()
  })
})

onUnmounted(() => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  trendChartInstance?.dispose()
  pieChartInstance?.dispose()
})

watch(trendPeriod, () => { fetchTrend() })
watch(trendMetric, () => {
  // 切换单位时直接用缓存数据重绘，不重新请求
  if (cachedTrendData.value) {
    renderTrendChart(cachedTrendData.value)
  } else if (trendChartInstance) {
    // 无缓存时才请求
    fetchTrend()
  }
})
</script>

<style scoped>
.energy-monitor {
  padding: 24px;
  min-height: calc(100vh - 120px);
}
.page-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.page-title h1 {
  margin: 0 0 6px 0;
  font-size: 26px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-title h1 i { color: #409eff; }
.page-title p { margin: 0; color: #909399; font-size: 13px; }
.title-right { display: flex; gap: 10px; align-items: center; }

/* 告警 */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 16px;
  font-size: 14px;
}
.alert-banner i { font-size: 18px; }
.alert-warning { background: #fdf6ec; color: #e6a23c; border: 1px solid #faecd8; }
.alert-danger { background: #fef0f0; color: #f56c6c; border: 1px solid #fde2e2; }

/* 指标卡片 */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.metric-card {
  background: linear-gradient(135deg, #fff 0%, #f8faff 100%);
  border-radius: 12px;
  padding: 20px 22px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #409eff;
  position: relative;
  overflow: hidden;
}
.metric-card::after {
  content: '';
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 120px;
  height: 120px;
  background: rgba(64, 158, 255, 0.04);
  border-radius: 50%;
}
.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.metric-body {
  display: flex;
  flex-direction: column;
}
.metric-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.metric-unit {
  font-size: 13px;
  color: #909399;
  margin-left: 4px;
}
.metric-label {
  font-size: 12px;
  color: #a0aabf;
  margin-top: 4px;
}
.metric-cost { border-left-color: #e6a23c; }
.metric-cost .metric-icon { background: rgba(230, 162, 60, 0.1); color: #e6a23c; }
.metric-success { border-left-color: #67c23a; }
.metric-success .metric-icon { background: rgba(103, 194, 58, 0.1); color: #67c23a; }
.metric-success .metric-value { color: #67c23a; }
.metric-danger { border-left-color: #f56c6c; }
.metric-danger .metric-icon { background: rgba(245, 108, 108, 0.1); color: #f56c6c; }
.metric-danger .metric-value { color: #f56c6c; }
.metric-warning { border-left-color: #e6a23c; }
.metric-warning .metric-icon { background: rgba(230, 162, 60, 0.1); color: #e6a23c; }
.metric-warning .metric-value { color: #e6a23c; }
.metric-energy { border-left-color: #909399; }
.metric-energy .metric-icon { background: rgba(144, 147, 153, 0.1); color: #909399; }

/* 主网格 */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  margin-bottom: 20px;
  overflow: visible;
}

/* 确保下拉菜单弹出层不被裁剪 */
.main-grid :deep(.el-select-dropdown),
.main-grid :deep(.el-popper),
.main-grid :deep(.el-radio-group),
.energy-monitor :deep(.el-select-dropdown-wrapper),
.energy-monitor :deep(.el-popper) {
  position: fixed !important;
  z-index: 2100 !important;
}

.chart-section, .pie-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 10;
}
.section-header h3 {
  margin: 0;
  font-size: 15px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}
.header-controls { display: flex; gap: 10px; align-items: center; }

/* 下拉/分段控件点击优化 */
.header-controls :deep(.el-select),
.header-controls :deep(.el-segmented),
.header-controls :deep(.el-radio-group) {
  position: relative;
  z-index: 20;
}

.chart-container {
  width: 100%;
  height: 340px;
}
.pie-container { height: 280px; }

.legend-row {
  display: flex;
  gap: 24px;
  justify-content: center;
  padding-top: 8px;
}
.legend-item { font-size: 12px; color: #606266; display: flex; align-items: center; gap: 6px; }
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* 分项占比列表 */
.breakdown-list {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 14px;
}
.breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
}
.bd-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
.bd-label { color: #606266; min-width: 70px; }
.bd-value { font-weight: 600; color: #303133; width: 45px; text-align: right; }
.bd-energy { color: #909399; width: 72px; text-align: right; }
.bd-cost { color: #e6a23c; font-weight: 500; text-align: right; flex: 1; }

/* 底部分项功率 */
.sub-metrics {
  background: #fff;
  border-radius: 12px;
  padding: 18px 22px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
.sub-metrics h4 {
  margin: 0 0 14px 0;
  font-size: 14px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sub-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.sub-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px 16px;
  text-align: center;
}
.sub-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.sub-val {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}
.sub-unit {
  font-size: 11px;
  color: #b0b8c4;
  margin-left: 2px;
}
.compare-hint { font-weight: normal !important; font-size: 11px !important; opacity: 0.8; margin-left: 4px; }

@media (max-width: 1400px) {
  .main-grid { grid-template-columns: 1fr 320px; }
  .metrics-row { grid-template-columns: repeat(2, 1fr); }
  .sub-cards { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .main-grid { grid-template-columns: 1fr; }
  .page-title { flex-direction: column; gap: 12px; }
}
</style>
