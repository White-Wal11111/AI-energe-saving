<template>
  <div class="control-panel">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h1><i class="el-icon-open"></i> {{ isCN ? '控制面板' : 'Control Panel' }}</h1>
        <p>{{ isCN ? '设备远程控制与操作日志查询' : 'Remote device control & operation logs' }}</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip stat-online">
          <i class="el-icon-circle-check"></i>
          <span>{{ onlineCount }}</span>
        </div>
        <div class="stat-chip stat-total">
          <i class="el-icon-monitor"></i>
          <span>{{ allDevices.length }} {{ isCN ? '台设备' : 'devices' }}</span>
        </div>
      </div>
    </div>

    <!-- 设备控制区 -->
    <div class="control-section">
      <div class="section-toolbar">
        <div class="toolbar-left">
          <h3><i class="el-icon-magic-stick"></i> {{ isCN ? '设备控制' : 'Device Control' }}</h3>
        </div>
        <div class="toolbar-right">
          <el-select v-model="filterDeviceType" size="default" style="width: 180px" @change="filterChanged">
            <el-option label="📋 全部类型 / All Types" value="" />
            <el-option v-for="t in typeOptions" :key="t.type">
              <span class="type-option">
                <i class="type-dot" :style="{ background: t.color }"></i>
                {{ getTypeLabel(t.type) }}
              </span>
            </el-option>
          </el-select>
        </div>
      </div>

      <!-- 设备列表 -->
      <div v-if="loadingDevices" class="loading-wrap">
        <div class="spinner"><i class="el-icon-loading"></i></div>
        <p>{{ isCN ? '正在加载设备...' : 'Loading devices...' }}</p>
      </div>

      <template v-else>
        <!-- 按类型分组 -->
        <div v-if="groupedDevices.length > 0" class="device-groups">
          <div v-for="(group, gIdx) in groupedDevices" :key="gIdx" class="device-group">
            <!-- 分组标题栏 -->
            <div class="group-bar" :style="{ borderLeftColor: group.color }">
              <div class="group-info">
                <span class="group-dot-lg" :style="{ background: group.color }"></span>
                <span class="group-name">{{ group.label }}</span>
                <el-tag size="small" :color="group.color + '20'" :style="{ color: group.color, borderColor: group.color + '40', borderRadius: '12px' }">
                  {{ group.devices.length }}
                </el-tag>
              </div>
            </div>

            <!-- 设备卡片网格 -->
            <div class="device-grid">
              <div v-for="device in group.devices" :key="device.id"
                   class="device-card"
                   :class="'card-status-' + device.status"
                   :data-type-color="getTypeColor(device.device_type)">
                <!-- 卡片顶栏：名称 + 状态 + 位置 -->
                <div class="card-head">
                  <div class="head-main">
                    <div class="head-type-indicator" :style="{ background: getTypeColor(device.device_type) }"></div>
                    <div class="head-text">
                      <div class="device-name-row">
                        <span class="device-name">{{ device.name }}</span>
                        <span class="status-badge" :class="'sb-' + device.status">
                          <span class="sb-dot"></span>
                          {{ getStatusLabel(device.status) }}
                        </span>
                      </div>
                      <div class="device-meta">
                        <span class="meta-code">{{ device.device_code }}</span>
                        <span class="meta-sep">·</span>
                        <span class="meta-loc"><i class="el-icon-location-outline"></i> {{ device.location || '-' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 控制操作区 -->
                <div class="card-controls" v-if="device.actions && device.actions.length > 0">
                  <template v-for="(act, aIdx) in device.actions" :key="aIdx">
                    <!-- 按钮型控制 -->
                    <button v-if="act.type === 'button'"
                      class="ctrl-btn" :class="'btn-' + getActionBtnClass(act.value)"
                      @click="openControlDialog(device, act)">
                      <i :class="act.icon || 'el-icon-right'"></i>
                      {{ act.label }}
                    </button>

                    <!-- 滑块型 -->
                    <div v-else-if="act.type === 'slider'" class="ctrl-slider">
                      <label class="cs-label">{{ act.label }}</label>
                      <div class="cs-body">
                        <el-slider
                          :model-value="getSliderValue(device.id, act.value)"
                          :min="act.min || 0"
                          :max="act.max || 100"
                          :step="getSliderStep(act)"
                          :show-tooltip="true"
                          size="small"
                          @change="(val) => sendSliderCommand(device, act, val)"
                        />
                        <span class="cs-unit">{{ act.unit }}</span>
                      </div>
                    </div>

                    <!-- 下拉选择型 -->
                    <div v-else-if="act.type === 'select'" class="ctrl-select">
                      <label class="csl-label">{{ act.label }}</label>
                      <el-select
                        :model-value="getSelectValue(device.id, act.value)"
                        size="small"
                        placeholder="--"
                        @change="(val) => sendSelectCommand(device, act, val)"
                        popper-class="ctrl-select-popper"
                      >
                        <el-option v-for="(opt, oIdx) in (act.options || [])" :key="oIdx" :label="opt" :value="opt" />
                      </el-select>
                    </div>

                    <!-- 输入框+确认型 -->
                    <div v-else-if="act.type === 'input'" class="ctrl-input">
                      <label class="ci-label">{{ act.label }}</label>
                      <div class="ci-row">
                        <el-input-number
                          :model-value="null"
                          size="small"
                          :placeholder="act.inputLabel || ''"
                          :precision="2"
                          controls-position="right"
                          style="width:100%"
                          :ref="el => {}"
                        />
                        <span class="ci-unit">{{ act.inputUnit }}</span>
                        <button class="ci-send" @click="sendInputCommand(device, act, $event)">
                          <i class="el-icon-check"></i>
                        </button>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- 无操作提示 -->
                <div v-else class="card-empty-actions">
                  <i class="el-icon-lock"></i>
                  <span>{{ isCN ? '暂无可执行操作' : 'No actions' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="el-icon-warning-outline"></i>
          </div>
          <p>{{ isCN ? '当前项目下暂无可控设备，请先在设备管理中添加' : 'No controllable devices' }}</p>
        </div>
      </template>
    </div>

    <!-- 操作日志区 -->
    <div class="log-section">
      <div class="section-toolbar">
        <h3><i class="el-icon-document"></i> {{ isCN ? '操作日志' : 'Operation Logs' }}</h3>
        <div class="log-filters">
          <el-date-picker
            v-model="logDateRange"
            type="daterange"
            range-separator="-"
            :start-placeholder="isCN ? '开始' : 'Start'"
            :end-placeholder="isCN ? '结束' : 'End'"
            size="small"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
          <el-input
            v-model="logKeyword"
            :placeholder="isCN ? '搜索日志' : 'Search logs'"
            clearable
            size="small"
            prefix-icon="Search"
            style="width: 180px"
          />
          <el-button size="small" :icon="Refresh" @click="loadLogs">
            {{ isCN ? '刷新' : 'Refresh' }}
          </el-button>
        </div>
      </div>

      <div class="log-table-wrap">
        <el-table :data="logList" v-loading="loadingLogs" stripe size="default">
          <el-table-column prop="created_at" :label="isCN ? '时间' : 'Time'" width="170" fixed="left" />
          <el-table-column prop="device_name" :label="isCN ? '设备' : 'Device'" min-width="150">
            <template #default="{ row }">
              <div class="log-device-cell">
                <el-tag size="small" :color="row.device_type_color" effect="dark" round>
                  {{ row.device_type_label || row.device_type }}
                </el-tag>
                <strong>{{ row.device_name }}</strong>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="action_label" :label="isCN ? '操作' : 'Action'" width="140" />
          <el-table-column prop="operator" :label="isCN ? '操作人' : 'Operator'" width="90" />
          <el-table-column prop="result" :label="isCN ? '结果' : 'Result'" width="80">
            <template #default="{ row }">
              <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small" round>
                {{ row.result === 'success' ? (isCN ? '成功' : 'OK') : (isCN ? '失败' : 'Fail') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="result_message" :label="isCN ? '说明' : 'Message'" min-width="200" show-overflow-tooltip />
        </el-table>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="logPage"
            v-model:page-size="logPageSize"
            :total="logTotal"
            :page-sizes="[15, 30, 50]"
            layout="total, sizes, prev, pager, next"
            small
            background
            @change="loadLogs"
          />
        </div>
      </div>
    </div>

    <!-- 控制确认弹窗 -->
    <el-dialog
      v-model="controlConfirmVisible"
      :title="isCN ? '发送控制指令' : 'Send Control Command'"
      width="460px"
      destroy-on-close
      align-center
    >
      <div class="confirm-content">
        <div class="confirm-device">
          <div class="cd-icon"><i class="el-icon-cpu"></i></div>
          <div class="cd-detail">
            <p class="cd-name">{{ confirmData?.name || '-' }}</p>
            <p class="cd-code">{{ confirmData?.device_code }} · {{ getTypeLabel(confirmData?.device_type) }}</p>
          </div>
        </div>
        <div class="confirm-action">
          <span class="ca-label">{{ isCN ? '执行动作' : 'Action' }}</span>
          <span class="ca-value">{{ confirmData?.action_label }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="controlConfirmVisible = false">{{ isCN ? '取消' : 'Cancel' }}</el-button>
        <el-button type="primary" :loading="sendingCmd" @click="doSendCommand">
          <i class="el-icon-s-promotion"></i> {{ isCN ? '确认发送' : 'Send Command' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
// Element Plus 图标
import {
  Open, CircleCheck, Monitor, MagicStick, Loading,
  Location, Right, Check, Lock, Warning, Document, Refresh,
  Cpu, Promotion
} from '@element-plus/icons-vue'

const isCN = inject('isCN', ref(true))

// ====== 状态 ======
const loadingDevices = ref(false)
const allDevices = ref([])
const filterDeviceType = ref('')
const controlConfirmVisible = ref(false)
const sendingCmd = ref(false)
const confirmData = ref(null)
const sliderValues = ref({})
const selectValues = ref({})

// 日志
const logList = ref([])
const logTotal = ref(0)
const logPage = ref(1)
const logPageSize = ref(15)
const loadingLogs = ref(false)
const logDateRange = ref(null)
const logKeyword = ref('')

// 类型选项（含颜色）
// 类型选项（含颜色）— 中英双语
function getTypeLabel(type) {
  const map = {
    smart_meter:     { zh: '智能电表', en: 'Smart Meter' },
    smart_valve_air: { zh: '智能风阀', en: 'Air Damper' },
    smart_valve_water:{ zh: '智能水阀', en: 'Water Valve' },
    temp_sensor_water:{ zh: '水温传感器', en: 'Water Temp Sensor' },
    temp_sensor_air: { zh: '风温传感器', en: 'Air Temp Sensor' },
    pressure_sensor:{ zh: '压力传感器', en: 'Pressure Sensor' },
    chiller:         { zh: '冷机',       en: 'Chiller' },
    cooling_tower:   { zh: '冷却塔',     en: 'Cooling Tower' },
    ahu:             { zh: '空调箱AHU',   en: 'AHU' }
  }
  const item = map[type] || { zh: type, en: type }
  return isCN.value ? item.zh : item.en
}

const typeColorMap = {
  smart_meter: '#409EFF',
  smart_valve_air: '#67C23A',
  smart_valve_water: '#E6A23C',
  temp_sensor_water: '#F56C6C',
  temp_sensor_air: '#909399',
  pressure_sensor: '#764ba2',
  chiller: '#1a6dbb',
  cooling_tower: '#2a8ae0',
  ahu: '#9b59b6'
}

const typeOptions = [
  { type: 'smart_meter', color: '#409EFF' },
  { type: 'smart_valve_air', color: '#67C23A' },
  { type: 'smart_valve_water', color: '#E6A23C' },
  { type: 'temp_sensor_water', color: '#F56C6C' },
  { type: 'temp_sensor_air', color: '#909399' },
  { type: 'pressure_sensor', color: '#764ba2' },
  { type: 'chiller', color: '#1a6dbb' },
  { type: 'cooling_tower', color: '#2a8ae0' },
  { type: 'ahu', color: '#9b59b6' }
]

// 在线设备数
const onlineCount = computed(() => allDevices.value.filter(d => d.status === 'online').length)

// 过滤后的设备
const filteredDevices = computed(() => {
  if (!filterDeviceType.value) return allDevices.value
  return allDevices.value.filter(d => d.device_type === filterDeviceType.value)
})

// 分组
const groupedDevices = computed(() => {
  const groups = {}
  filteredDevices.value.forEach(d => {
    const tInfo = typeOptions.find(t => t.type === d.device_type)
    const key = d.device_type
    if (!groups[key]) {
      groups[key] = {
        type: d.device_type,
        label: getTypeLabel(d.device_type),
        color: typeColorMap[d.device_type] || '#909399',
        devices: []
      }
    }
    groups[key].devices.push(d)
  })
  return Object.values(groups).sort(
    (a, b) => typeOptions.findIndex(t => t.type === a.type) - typeOptions.findIndex(t => t.type === b.type)
  )
})

// ====== 工具方法 ======
function getProjectId() { return localStorage.getItem('currentProjectId') || '1' }
function getHeaders() { return { Authorization: `Bearer ${localStorage.getItem('token')}` } }

function getStatusLabel(status) {
  const map = {
    online: { zh: '在线', en: 'Online' },
    offline: { zh: '离线', en: 'Offline' },
    fault: { zh: '故障', en: 'Fault' },
    maintenance: { zh: '维护中', en: 'Maintenance' }
  }
  const item = map[status] || { zh: status, en: status }
  return isCN.value ? item.zh : item.en
}

function getStatusType(status) {
  return { online: 'success', offline: 'info', fault: 'danger', maintenance: 'warning' }[status] || 'info'
}

function getTypeColor(type) {
  return typeOptions.find(t => t.type === type)?.color || '#909399'
}

function getActionBtnType(actionVal) {
  if (['stop', 'close_valve'].includes(actionVal)) return 'danger'
  if (['start', 'open_valve', 'reset_meter', 'set_fill_water'].includes(actionVal)) return 'primary'
  if (['blowdown'].includes(actionVal)) return 'warning'
  return ''
}

function getActionBtnClass(actionVal) {
  if (['stop', 'close_valve'].includes(actionVal)) return 'danger'
  if (['start', 'open_valve', 'reset_meter', 'set_fill_water'].includes(actionVal)) return 'primary'
  if (['blowdown'].includes(actionVal)) return 'warn'
  return ''
}

function getSliderStep(action) {
  const max = action.max || 100
  return max > 10 ? 1 : Math.max(0.5, max / 50)
}

function getSliderValue(deviceId, actionKey) {
  return sliderValues.value[`${deviceId}_${actionKey}`] ?? null
}

function getSelectValue(deviceId, actionKey) {
  return selectValues.value[`${deviceId}_${actionKey}`] ?? undefined
}

function filterChanged() {
  // 筛选变化时无需额外操作，computed 会自动响应
}

// ====== 数据加载 ======
async function loadDevices() {
  loadingDevices.value = true
  try {
    const res = await axios.get('/api/control/devices', {
      params: { project_id: getProjectId() },
      headers: getHeaders()
    })
    if (res.data.success) {
      allDevices.value = res.data.data || []
    } else {
      ElMessage.warning(res.data.error || (isCN.value ? '获取设备列表异常' : 'Failed'))
    }
  } catch (e) {
    console.error(e)
    ElMessage.error(isCN.value ? '加载设备列表失败' : 'Failed to load')
  } finally { loadingDevices.value = false }
}

// ====== 控制指令 ======
function openControlDialog(device, action) {
  confirmData.value = { ...device, action_label: action.label, action_value: action.value }
  controlConfirmVisible.value = true
}

async function doSendCommand() {
  if (!confirmData.value) return
  sendingCmd.value = true
  try {
    const res = await axios.post('/api/control/send', {
      device_id: confirmData.value.id,
      device_name: confirmData.value.name,
      device_code: confirmData.value.device_code,
      device_type: confirmData.value.device_type,
      action: confirmData.value.action_value,
      params: {}
    }, { headers: getHeaders() })
    if (res.data.success) {
      ElMessage.success(res.data.data.message || (isCN.value ? '指令已发送' : 'Sent'))
      loadLogs()
    }
    controlConfirmVisible.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.error || (isCN.value ? '发送失败' : 'Failed'))
  } finally { sendingCmd.value = false }
}

async function sendSliderCommand(device, action, val) {
  try {
    sliderValues.value[`${device.id}_${action.value}`] = val
    const res = await axios.post('/api/control/send', {
      device_id: device.id, device_name: device.name, device_code: device.device_code,
      device_type: device.device_type, action: action.value,
      params: { value: val, unit: action.unit }
    }, { headers: getHeaders() })
    if (res.data.success) ElMessage.success(res.data.data.message); loadLogs()
  } catch (e) { ElMessage.error(isCN.value ? '指令发送失败' : 'Failed') }
}

async function sendSelectCommand(device, action, val) {
  try {
    selectValues.value[`${device.id}_${action.value}`] = val
    const res = await axios.post('/api/control/send', {
      device_id: device.id, device_name: device.name, device_code: device.device_code,
      device_type: device.device_type, action: action.value,
      params: { value: val }
    }, { headers: getHeaders() })
    if (res.data.success) ElMessage.success(res.data.data.message); loadLogs()
  } catch (e) { ElMessage.error(isCN.value ? '指令发送失败' : 'Failed') }
}

async function sendInputCommand(device, action, event) {
  let inputEl = null
  let rowEl = event.target.closest('.ci-row')
  if (rowEl) inputEl = rowEl.querySelector('.el-input__inner')
  const val = inputEl ? parseFloat(inputEl.value) : null
  if (val === null || isNaN(val)) {
    ElMessage.warning(isCN.value ? '请输入数值' : 'Please enter a value'); return
  }
  try {
    const res = await axios.post('/api/control/send', {
      device_id: device.id, device_name: device.name, device_code: device.device_code,
      device_type: device.device_type, action: action.value, params: { value: val }
    }, { headers: getHeaders() })
    if (res.data.success) ElMessage.success(res.data.data.message); loadLogs()
  } catch (e) { ElMessage.error(isCN.value ? '指令发送失败' : 'Failed') }
}

// ====== 日志 ======
async function loadLogs() {
  loadingLogs.value = true
  try {
    const params = { project_id: getProjectId(), page: logPage.value, pageSize: logPageSize.value }
    if (filterDeviceType.value && filterDeviceType.value !== '') params.device_type = filterDeviceType.value
    if (logKeyword.value) params.keyword = logKeyword.value
    if (logDateRange.value?.[0]) params.start_date = logDateRange.value[0]
    if (logDateRange.value?.[1]) params.end_date = logDateRange.value[1]
    const res = await axios.get('/api/control/logs', { params, headers: getHeaders() })
    if (res.data.success) {
      logList.value = res.data.data.list
      logTotal.value = res.data.data.total
    }
  } catch (e) { console.error(e) }
  finally { loadingLogs.value = false }
}

onMounted(() => {
  loadDevices()
  loadLogs()
})
</script>

<style scoped>
/* ========== 布局基础 ========== */
.control-panel {
  padding: 24px;
  min-height: calc(100vh - 120px);
}

/* ---------- 页面标题 ---------- */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-left h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-left h1 i { color: #67c23a; font-size: 28px; }
.header-left p { margin: 0; color: #909399; font-size: 13px; }

.header-stats {
  display: flex;
  gap: 12px;
}
.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}
.stat-online {
  background: #f0fdf4;
  color: #22c55e;
  border: 1px solid #bbf7d0;
}
.stat-total {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
}

/* ---------- 区块容器 ---------- */
.control-section, .log-section {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  overflow: hidden;
}

/* ---------- 工具栏 ---------- */
.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
}
.section-toolbar h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-right .type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.type-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
  flex-shrink: 0;
}
.log-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* ---------- 加载/空状态 ---------- */
.loading-wrap {
  text-align: center;
  padding: 70px 20px;
  color: #909399;
}
.spinner {
  font-size: 36px;
  color: #67c23a;
  margin-bottom: 12px;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #b0b8c4;
}
.empty-icon i {
  font-size: 48px;
  opacity: 0.25;
  display: block;
  margin-bottom: 12px;
}

/* ---------- 设备分组 ---------- */
.device-groups {
  padding: 8px 0;
}
.group-bar {
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  border-left: 4px solid;
  background: linear-gradient(135deg, #fafbff 0%, #fff 100%);
}
.group-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.group-dot-lg {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.group-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* ---------- 设备网格 ---------- */
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 14px;
  padding: 14px 24px 20px;
}

/* ---------- 设备卡片（重点美化）---------- */
.device-card {
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.28s cubic-bezier(.25,.46,.45,.94);
  position: relative;
}
.device-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--type-color, #d0d5dd);
  transition: background 0.25s;
}
.device-card:hover {
  border-color: #c0c8d4;
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.08), 0 2px 6px rgba(0,0,0,0.04);
  transform: translateY(-2px);
}
.card-status-offline { opacity: 0.7; }
.card-status-fault::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #f56c6c;
  border-radius: 50%;
  animation: blink 1.5s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 卡片头部 */
.card-head {
  padding: 14px 16px 10px;
  position: relative;
}
.head-main {
  display: flex;
  gap: 10px;
}
.head-type-indicator {
  width: 4px;
  height: 38px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 2px;
}
.head-text { flex: 1; min-width: 0; }

.device-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.device-name {
  font-size: 14.5px;
  font-weight: 650;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
}
.sb-online { background: #ecfdf5; color: #059669; }
.sb-offline { background: #f1f5f9; color: #64748b; }
.sb-fault { background: #fef2f2; color: #dc2626; }
.sb-maintenance { background: #fffbeb; color: #d97706; }
.sb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.sb-online .sb-dot { animation: pulse-green 2s infinite; }
@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.35); }
  50% { box-shadow: 0 0 0 3px rgba(5,150,105,0); }
}

/* 设备元信息 */
.device-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: #94a3b8;
}
.meta-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.3px;
}
.meta-sep { opacity: 0.4; }
.meta-loc i { margin-right: 2px; }

/* ---------- 控制操作区 ---------- */
.card-controls {
  padding: 0 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 按钮 */
.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  outline: none;
  font-family: inherit;
}
.ctrl-btn:hover { transform: translateY(-1px); }
.ctrl-btn:active { transform: translateY(0); }
.btn-primary {
  background: linear-gradient(135deg, #409EFF 0%, #337ecc 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.25);
}
.btn-primary:hover { box-shadow: 0 4px 14px rgba(64,158,255,0.35); }
.btn-danger {
  background: linear-gradient(135deg, #f56c6c 0%, #de5252 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(245,108,108,0.25);
}
.btn-danger:hover { box-shadow: 0 4px 14px rgba(245,108,108,0.35); }
.btn-warn {
  background: linear-gradient(135deg, #E6A23C 0%, #cf9536 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(230,162,60,0.25);
}

/* 滑块 */
.ctrl-slider {
  background: #f8fafc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
}
.cs-label {
  font-size: 11.5px;
  color: #64748b;
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.cs-body {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cs-body :deep(.el-slider) { flex: 1; margin: 0; }
.cs-unit {
  font-size: 11.5px;
  color: #94a3b8;
  white-space: nowrap;
  min-width: 26px;
  text-align: right;
  font-weight: 500;
}

/* 选择框 */
.ctrl-select {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 6px 12px;
}
.csl-label {
  font-size: 11.5px;
  color: #64748b;
  white-space: nowrap;
  font-weight: 500;
  min-width: 65px;
}
.ctrl-select :deep(.el-select) { flex: 1; }

/* 输入框 */
.ctrl-input {
  background: #f8fafc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px 12px;
}
.ci-label {
  font-size: 11.5px;
  color: #64748b;
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
.ci-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ci-row :deep(.el-input-number) { flex: 1; }
.ci-unit {
  font-size: 11.5px;
  color: #94a3b8;
  white-space: nowrap;
}
.ci-send {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #409EFF, #337ecc);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.ci-send:hover { transform: scale(1.08); box-shadow: 0 2px 8px rgba(64,158,255,0.3); }

/* 无操作 */
.card-empty-actions {
  text-align: center;
  padding: 14px;
  color: #cbd5e1;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ---------- 日志区域 ---------- */
.log-table-wrap { padding: 16px 24px; }
.log-device-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.log-device-cell strong { color: #303133; font-weight: 500; }
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ---------- 确认弹窗 ---------- */
.confirm-content { padding: 4px 0; }
.confirm-device {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 16px;
}
.cd-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #409EFF, #337ecc);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.cd-name { margin: 0; font-size: 15px; font-weight: 600; color: #1a1a2e; }
.cd-code { margin: 3px 0 0; font-size: 12px; color: #94a3b8; }
.confirm-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff8f0;
  border-radius: 10px;
  border: 1px solid #ffe8cc;
}
.ca-label { font-size: 13px; color: #8c6d3f; font-weight: 500; }
.ca-value { font-size: 14px; font-weight: 600; color: #d97706; }

/* ---------- 响应式 ---------- */
@media (max-width: 900px) {
  .page-header { flex-direction: column; gap: 12px; align-items: flex-start; }
  .device-grid { grid-template-columns: 1fr; padding: 10px 16px 16px; }
  .section-toolbar { flex-direction: column; gap: 12px; align-items: stretch; }
  .toolbar-right { width: 100%; }
  .log-filters { flex-wrap: wrap; }
}
@media (max-width: 600px) {
  .control-panel { padding: 14px; }
  .device-grid { grid-template-columns: 1fr; }
  .card-controls { padding: 0 12px 12px; }
}
</style>
