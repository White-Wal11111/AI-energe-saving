<template>
  <div class="device-management">
    <div class="page-title">
      <div class="title-left">
        <h1>
          <i class="el-icon-monitor"></i>
          {{ isCN ? '设备管理' : 'Device Management' }}
        </h1>
        <p>{{ isCN ? '管理项目下的设备信息与运行状态' : 'Manage devices and runtime status' }}</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card" v-for="stat in statsCards" :key="stat.label" :style="{ borderLeftColor: stat.color }">
        <div class="stat-icon" :style="{ background: stat.color + '18', color: stat.color }">
          <i :class="stat.icon"></i>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选与操作 -->
    <div class="filter-bar">
      <div class="filter-left">
        <el-select v-model="filterType" :placeholder="isCN ? '设备类型' : 'Device Type'" clearable style="width: 160px">
          <el-option v-for="t in deviceTypes" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-select v-model="filterProject" :placeholder="isCN ? '设备归属' : 'Project'" clearable style="width: 160px">
          <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <el-select v-model="filterStatus" :placeholder="isCN ? '运行状态' : 'Status'" clearable style="width: 130px">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.displayLabel" :value="s.value" />
        </el-select>
        <el-input v-model="filterKeyword" :placeholder="isCN ? '搜索设备名称/编号/位置' : 'Search name/code/location'" clearable style="width: 220px" prefix-icon="Search" />
      </div>
      <div class="filter-right">
        <el-button type="primary" @click="openAddDialog">
          <i class="el-icon-plus"></i>
          {{ isCN ? '新增设备' : 'Add Device' }}
        </el-button>
        <el-button type="danger" plain :disabled="selectedIds.length === 0" @click="batchDelete">
          <i class="el-icon-delete"></i>
          {{ isCN ? '批量删除' : 'Batch Delete' }}
        </el-button>
      </div>
    </div>

    <!-- 设备表格 -->
    <div class="table-card">
      <el-table :data="deviceList" v-loading="loading" @selection-change="handleSelectionChange" stripe style="width: 100%">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="device_code" :label="isCN ? '设备编号' : 'Code'" width="140" />
        <el-table-column prop="name" :label="isCN ? '设备名称' : 'Name'" min-width="160">
          <template #default="{ row }">
            <div class="device-name-cell">
              <span class="type-dot" :style="{ background: getTypeColor(row.device_type) }"></span>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="device_type" :label="isCN ? '设备类型' : 'Type'" width="130">
          <template #default="{ row }">
            <el-tag size="small" :color="getTypeColor(row.device_type)" style="color:#fff;border:none">{{ getTypeLabel(row.device_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="project_name" :label="isCN ? '设备归属' : 'Project'" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="project-name-cell">{{ getProjectName(row.project_id) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" :label="isCN ? '安装位置' : 'Location'" width="140" show-overflow-tooltip />
        <el-table-column prop="floor" :label="isCN ? '楼层' : 'Floor'" width="80" />
        <el-table-column prop="brand" :label="isCN ? '品牌' : 'Brand'" width="100" />
        <el-table-column prop="status" :label="isCN ? '状态' : 'Status'" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_data_time" :label="isCN ? '最后上报' : 'Last Data'" width="170">
          <template #default="{ row }">
            <span class="time-text">{{ row.last_data_time || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="isCN ? '操作' : 'Actions'" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetailDialog(row)">
              <i class="el-icon-view"></i> {{ isCN ? '详情' : 'Detail' }}
            </el-button>
            <el-button link type="warning" size="small" @click="openEditDialog(row)">
              <i class="el-icon-edit"></i> {{ isCN ? '编辑' : 'Edit' }}
            </el-button>
            <el-button link type="danger" size="small" @click="deleteDevice(row)">
              <i class="el-icon-delete"></i> {{ isCN ? '删除' : 'Del' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadDevices"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close>
      <el-form ref="formRef" :model="deviceForm" :rules="formRules" label-width="110px" class="device-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="isCN ? '设备编号' : 'Code'" prop="device_code">
              <el-input v-model="deviceForm.device_code" :placeholder="isCN ? '如：SM-001' : 'e.g. SM-001'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '设备名称' : 'Name'" prop="name">
              <el-input v-model="deviceForm.name" :placeholder="isCN ? '如：1号智能电表' : 'e.g. Smart Meter #1'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="isCN ? '设备类型' : 'Type'" prop="device_type">
              <el-select v-model="deviceForm.device_type" style="width: 100%">
                <el-option v-for="t in deviceTypes" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '设备归属' : 'Project'" prop="project_id">
              <el-select v-model="deviceForm.project_id" style="width: 100%">
                <el-option v-for="p in projectList" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="isCN ? '运行状态' : 'Status'">
              <el-select v-model="deviceForm.status" style="width: 100%">
                <el-option v-for="s in statusOptions" :key="s.value" :label="s.displayLabel" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="isCN ? '安装位置' : 'Location'">
              <el-input v-model="deviceForm.location" :placeholder="isCN ? '如：机房A区' : 'e.g. Room A'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '楼层' : 'Floor'">
              <el-input v-model="deviceForm.floor" :placeholder="isCN ? '如：B1' : 'e.g. B1'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="isCN ? '品牌' : 'Brand'">
              <el-input v-model="deviceForm.brand" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '型号' : 'Model'">
              <el-input v-model="deviceForm.model" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="isCN ? '额定功率(kW)' : 'Power(kW)'">
              <el-input-number v-model="deviceForm.rated_power" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="isCN ? '额定流量' : 'Flow'">
              <el-input-number v-model="deviceForm.rated_flow" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="isCN ? '额定压力' : 'Pressure'">
              <el-input-number v-model="deviceForm.rated_pressure" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="isCN ? '安装日期' : 'Install Date'">
              <el-date-picker v-model="deviceForm.install_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '质保日期' : 'Warranty Date'">
              <el-date-picker v-model="deviceForm.warranty_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="isCN ? '备注说明' : 'Description'">
          <el-input v-model="deviceForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ isCN ? '取消' : 'Cancel' }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDevice">{{ isCN ? '确定' : 'Confirm' }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="isCN ? '设备详情' : 'Device Detail'" width="700px" destroy-on-close>
      <div v-if="detailData" class="detail-content">
        <div class="detail-header">
          <div class="detail-type-badge" :style="{ background: getTypeColor(detailData.device_type) }">
            <i :class="getTypeIcon(detailData.device_type)"></i>
          </div>
          <div class="detail-title">
            <h3>{{ detailData.name }}</h3>
            <span class="detail-code">{{ detailData.device_code }}</span>
          </div>
          <el-tag :type="getStatusType(detailData.status)">{{ getStatusLabel(detailData.status) }}</el-tag>
        </div>

        <el-descriptions :column="2" border size="small" class="detail-desc">
          <el-descriptions-item :label="isCN ? '设备类型' : 'Type'">{{ getTypeLabel(detailData.device_type) }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '设备归属' : 'Project'">{{ getProjectName(detailData.project_id) }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '安装位置' : 'Location'">{{ detailData.location || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '楼层' : 'Floor'">{{ detailData.floor || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '品牌' : 'Brand'">{{ detailData.brand || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '型号' : 'Model'">{{ detailData.model || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '额定功率' : 'Power'">{{ detailData.rated_power ? detailData.rated_power + ' kW' : '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '额定流量' : 'Flow'">{{ detailData.rated_flow || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '额定压力' : 'Pressure'">{{ detailData.rated_pressure || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '安装日期' : 'Install Date'">{{ detailData.install_date || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '质保日期' : 'Warranty'">{{ detailData.warranty_date || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '最后上报' : 'Last Data'">{{ detailData.last_data_time || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="isCN ? '备注' : 'Description'">{{ detailData.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 实时数据 -->
        <div class="realtime-section" v-if="detailData.realtimeData && detailData.realtimeData.length > 0">
          <h4><i class="el-icon-data-line"></i> {{ isCN ? '实时数据' : 'Realtime Data' }}</h4>
          <el-table :data="detailData.realtimeData" size="small" stripe>
            <el-table-column prop="data_type" :label="isCN ? '数据类型' : 'Type'" width="140" />
            <el-table-column prop="value" :label="isCN ? '数值' : 'Value'" width="120" />
            <el-table-column prop="unit" :label="isCN ? '单位' : 'Unit'" width="100" />
            <el-table-column prop="recorded_at" :label="isCN ? '记录时间' : 'Time'" />
          </el-table>
        </div>
        <div v-else class="no-data-tip">
          <i class="el-icon-warning-outline"></i>
          <span>{{ isCN ? '暂无实时数据' : 'No realtime data' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const isCN = inject('isCN', ref(true))
const loading = ref(false)
const submitting = ref(false)
const deviceList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedIds = ref([])

// 筛选
const filterType = ref('')
const filterProject = ref('')
const filterStatus = ref('')
const filterKeyword = ref('')

// 项目列表（来自项目管理）
const projectList = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const detailVisible = ref(false)
const detailData = ref(null)

// 统计
const statsData = ref({ total: 0, byStatus: [], byType: [] })

// 设备类型配置
const deviceTypes = ref([])
const _statusOptions = [
  { value: 'online', label: 'Online', labelZh: '在线' },
  { value: 'offline', label: 'Offline', labelZh: '离线' },
  { value: 'fault', label: 'Fault', labelZh: '故障' },
  { value: 'maintenance', label: 'Maintenance', labelZh: '维护中' }
]

// 根据语言动态返回选项标签（供 el-option 使用）
const statusOptions = computed(() =>
  _statusOptions.map(s => ({ ...s, displayLabel: isCN.value ? s.labelZh : s.label }))
)

// 类型颜色/图标映射
const typeColorMap = {}
const typeIconMap = {}

const deviceForm = ref({
  device_code: '',
  name: '',
  device_type: '',
  status: 'online',
  project_id: '',
  location: '',
  floor: '',
  brand: '',
  model: '',
  rated_power: undefined,
  rated_flow: undefined,
  rated_pressure: undefined,
  install_date: '',
  warranty_date: '',
  description: ''
})

const formRules = computed(() => ({
  device_code: [{ required: true, message: isCN.value ? '请输入设备编号' : 'Device code is required', trigger: 'blur' }],
  name: [{ required: true, message: isCN.value ? '请输入设备名称' : 'Device name is required', trigger: 'blur' }],
  device_type: [{ required: true, message: isCN.value ? '请选择设备类型' : 'Please select device type', trigger: 'change' }]
}))

const statsCards = computed(() => {
  const online = statsData.value.byStatus.find(s => s.status === 'online')?.count || 0
  const offline = statsData.value.byStatus.find(s => s.status === 'offline')?.count || 0
  const fault = statsData.value.byStatus.find(s => s.status === 'fault')?.count || 0
  return [
    { label: isCN.value ? '设备总数' : 'Total', value: statsData.value.total, icon: 'el-icon-monitor', color: '#409EFF' },
    { label: isCN.value ? '在线' : 'Online', value: online, icon: 'el-icon-circle-check', color: '#67C23A' },
    { label: isCN.value ? '离线' : 'Offline', value: offline, icon: 'el-icon-circle-close', color: '#909399' },
    { label: isCN.value ? '故障' : 'Fault', value: fault, icon: 'el-icon-warning', color: '#F56C6C' }
  ]
})

function getTypeLabel(type) {
  const t = deviceTypes.value.find(d => d.value === type)
  return t ? t.label : type
}

function getTypeColor(type) {
  return typeColorMap[type] || '#909399'
}

function getTypeIcon(type) {
  return typeIconMap[type] || 'el-icon-monitor'
}

function getStatusLabel(status) {
  const s = _statusOptions.find(o => o.value === status)
  return s ? (isCN.value ? s.labelZh : s.label) : status
}

function getStatusType(status) {
  const map = { online: 'success', offline: 'info', fault: 'danger', maintenance: 'warning' }
  return map[status] || 'info'
}

function getProjectName(projectId) {
  if (!projectId) return '-'
  const p = projectList.value.find(item => item.id === projectId)
  return p ? (isCN.value ? p.name : (p.name_en || p.name)) : projectId
}

async function loadProjects() {
  try {
    const res = await axios.get('/api/project/list', { headers: getHeaders() })
    if (res.data.success && res.data.data) {
      // 兼容后端返回数组或对象
      const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.list || []
      projectList.value = list
      if (list.length > 0 && !deviceForm.value.project_id) {
        deviceForm.value.project_id = list[0].id
      }
    } else {
      // 后端没有项目列表接口时，使用前端默认数据
      projectList.value = [
        { id: '1', name: '万达广场', name_en: 'Wanda Plaza' },
        { id: '2', name: '大悦城', name_en: 'Joy City' },
        { id: '3', name: '万象城', name_en: 'The Mixc' }
      ]
    }
  } catch (e) {
    console.error('加载项目列表失败:', e)
    // 降级使用默认数据
    projectList.value = [
      { id: '1', name: 'Grand Indonesia', name_en: 'Grand Indonesia Mall' },
      { id: '2', name: 'Plaza Senayan', name_en: 'Plaza Senayan' },
      { id: '3', name: 'Central Park Jakarta', name_en: 'Central Park Jakarta Mall' },
      { id: '4', name: 'Pondok Indah Mall', name_en: 'PIM' }
    ]
  }
}

function getProjectId() {
  const saved = localStorage.getItem('currentProjectId')
  return saved || '1'
}

function getHeaders() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

async function loadDeviceTypes() {
  try {
    const res = await axios.get('/api/device/types', { headers: getHeaders() })
    if (res.data.success) {
      deviceTypes.value = res.data.data
      res.data.data.forEach(t => {
        typeColorMap[t.value] = t.color
        typeIconMap[t.value] = t.icon
      })
    }
  } catch (e) {
    console.error('加载设备类型失败:', e)
  }
}

async function loadDevices() {
  loading.value = true
  try {
    const params = {
      project_id: getProjectId(),
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (filterType.value) params.device_type = filterType.value
    if (filterProject.value) params.project_id = filterProject.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterKeyword.value) params.keyword = filterKeyword.value

    const res = await axios.get('/api/device/list', { params, headers: getHeaders() })
    if (res.data.success) {
      deviceList.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (e) {
    console.error('加载设备列表失败:', e)
    ElMessage.error(isCN.value ? '加载设备列表失败' : 'Failed to load devices')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await axios.get('/api/device/stats', {
      params: { project_id: getProjectId() },
      headers: getHeaders()
    })
    if (res.data.success) {
      statsData.value = res.data.data
    }
  } catch (e) {
    console.error('加载统计失败:', e)
  }
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = null
  dialogTitle.value = isCN.value ? '新增设备' : 'Add Device'
  deviceForm.value = {
    device_code: '',
    name: '',
    device_type: '',
    status: 'online',
    project_id: getProjectId(),
    location: '',
    floor: '',
    brand: '',
    model: '',
    rated_power: undefined,
    rated_flow: undefined,
    rated_pressure: undefined,
    install_date: '',
    warranty_date: '',
    description: ''
  }
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  dialogTitle.value = isCN.value ? '编辑设备' : 'Edit Device'
  deviceForm.value = {
    device_code: row.device_code,
    name: row.name,
    device_type: row.device_type,
    status: row.status,
    project_id: row.project_id || getProjectId(),
    location: row.location || '',
    floor: row.floor || '',
    brand: row.brand || '',
    model: row.model || '',
    rated_power: row.rated_power,
    rated_flow: row.rated_flow,
    rated_pressure: row.rated_pressure,
    install_date: row.install_date || '',
    warranty_date: row.warranty_date || '',
    description: row.description || ''
  }
  dialogVisible.value = true
}

async function submitDevice() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...deviceForm.value,
      project_id: getProjectId()
    }

    if (isEdit.value) {
      await axios.put(`/api/device/update/${editingId.value}`, payload, { headers: getHeaders() })
      ElMessage.success(isCN.value ? '设备更新成功' : 'Device updated')
    } else {
      await axios.post('/api/device/add', payload, { headers: getHeaders() })
      ElMessage.success(isCN.value ? '设备添加成功' : 'Device added')
    }

    dialogVisible.value = false
    loadDevices()
    loadStats()
  } catch (e) {
    const msg = e.response?.data?.error || (isCN.value ? '操作失败' : 'Operation failed')
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

async function deleteDevice(row) {
  try {
    await ElMessageBox.confirm(
      isCN.value ? `确认删除设备「${row.name}」？` : `Delete device "${row.name}"?`,
      isCN.value ? '确认删除' : 'Confirm Delete',
      { type: 'warning' }
    )
    await axios.delete(`/api/device/delete/${row.id}`, { headers: getHeaders() })
    ElMessage.success(isCN.value ? '已删除' : 'Deleted')
    loadDevices()
    loadStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(isCN.value ? '删除失败' : 'Delete failed')
    }
  }
}

async function batchDelete() {
  try {
    await ElMessageBox.confirm(
      isCN.value ? `确认删除选中的 ${selectedIds.value.length} 台设备？` : `Delete ${selectedIds.value.length} selected devices?`,
      isCN.value ? '确认批量删除' : 'Confirm Batch Delete',
      { type: 'warning' }
    )
    await axios.post('/api/device/batch-delete', { ids: selectedIds.value }, { headers: getHeaders() })
    ElMessage.success(isCN.value ? '批量删除成功' : 'Batch delete success')
    loadDevices()
    loadStats()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(isCN.value ? '批量删除失败' : 'Batch delete failed')
    }
  }
}

async function openDetailDialog(row) {
  try {
    const res = await axios.get(`/api/device/detail/${row.id}`, { headers: getHeaders() })
    if (res.data.success) {
      detailData.value = res.data.data
      detailVisible.value = true
    }
  } catch (e) {
    ElMessage.error(isCN.value ? '加载详情失败' : 'Failed to load detail')
  }
}

onMounted(() => {
  loadProjects()
  loadDeviceTypes()
  loadDevices()
  loadStats()
})

watch([filterType, filterProject, filterStatus, filterKeyword], () => {
  currentPage.value = 1
  loadDevices()
})
</script>

<style scoped>
.device-management {
  padding: 24px;
  min-height: calc(100vh - 120px);
}

.page-title {
  margin-bottom: 24px;
}

.page-title h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title h1 i {
  color: #409eff;
}

.page-title p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-left {
  display: flex;
  gap: 12px;
}

.filter-right {
  display: flex;
  gap: 12px;
}

/* 表格卡片 */
.table-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.device-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.time-text {
  color: #909399;
  font-size: 12px;
}

.project-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 表单统一样式 */
.device-form :deep(.el-input__wrapper),
.device-form :deep(.el-input-number),
.device-form :deep(.el-textarea__inner) {
  background-color: #f5f7fa;
}

.device-form :deep(.el-input__wrapper:hover),
.device-form :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.device-form :deep(.el-input__wrapper.is-focus),
.device-form :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.device-form :deep(.el-select .el-input__wrapper) {
  background-color: #f5f7fa;
}

.device-form :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff inset;
}

/* 详情 */
.detail-content {
  padding: 0 4px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-type-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
}

.detail-title {
  flex: 1;
}

.detail-title h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #303133;
}

.detail-code {
  font-size: 13px;
  color: #909399;
}

.detail-desc {
  margin-bottom: 20px;
}

.realtime-section h4 {
  font-size: 15px;
  color: #303133;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.realtime-section h4 i {
  color: #409eff;
}

.no-data-tip {
  text-align: center;
  padding: 30px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
    gap: 12px;
  }

  .filter-left,
  .filter-right {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
