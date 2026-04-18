<template>
  <div class="parking">
    <h2 class="page-title">
      <i class="el-icon-truck"></i>
      {{ isCN ? '停车场管理' : 'Parking Management' }}
    </h2>

    <!-- 车位概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a, #85ce61)">
          <i class="el-icon-success"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ availableSpaces }}</div>
          <div class="stat-label">{{ isCN ? '空闲车位' : 'Available' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #e6a23c)">
          <i class="el-icon-close"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ occupiedSpaces }}</div>
          <div class="stat-label">{{ isCN ? '已占用' : 'Occupied' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #409eff, #66b1ff)">
          <i class="el-icon-collection"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalSpaces }}</div>
          <div class="stat-label">{{ isCN ? '总车位' : 'Total' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #9c27b0, #e91e63)">
          <i class="el-icon-bangzhu"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ occupancyRate }}%</div>
          <div class="stat-label">{{ isCN ? '占用率' : 'Occupancy' }}</div>
        </div>
      </div>
    </div>

    <!-- 楼层选择 -->
    <div class="floor-tabs">
      <el-radio-group v-model="selectedFloor" size="large">
        <el-radio-button 
          v-for="floor in floors" 
          :key="floor" 
          :label="floor"
        >
          {{ isCN ? `B${Math.abs(floor)}层` : `Floor ${floor}` }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 车位地图 -->
    <div class="card parking-map">
      <div class="map-grid">
        <div 
          v-for="space in currentFloorSpaces" 
          :key="space.id" 
          class="parking-space"
          :class="getSpaceClass(space.status)"
          @click="handleSpaceClick(space)"
        >
          <div class="space-number">{{ space.number }}</div>
          <div class="space-status">
            <i v-if="space.status === 'available'" class="el-icon-check"></i>
            <i v-else-if="space.status === 'occupied'" class="el-icon-close"></i>
            <i v-else-if="space.status === 'reserved'" class="el-icon-time"></i>
          </div>
          <div v-if="space.plateNumber" class="plate-number">{{ space.plateNumber }}</div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot available"></span>
        {{ isCN ? '空闲' : 'Available' }}
      </div>
      <div class="legend-item">
        <span class="legend-dot occupied"></span>
        {{ isCN ? '已占用' : 'Occupied' }}
      </div>
      <div class="legend-item">
        <span class="legend-dot reserved"></span>
        {{ isCN ? '已预约' : 'Reserved' }}
      </div>
    </div>

    <!-- 停车记录 -->
    <div class="card records-section">
      <h3>{{ isCN ? '停车记录' : 'Parking Records' }}</h3>
      <el-table :data="parkingRecords" style="width: 100%">
        <el-table-column prop="plateNumber" :label="isCN ? '车牌号' : 'Plate'" width="120" />
        <el-table-column prop="entryTime" :label="isCN ? '入场时间' : 'Entry'" width="180" />
        <el-table-column prop="exitTime" :label="isCN ? '出场时间' : 'Exit'" width="180">
          <template #default="{ row }">
            {{ row.exitTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" :label="isCN ? '时长' : 'Duration'" width="100">
          <template #default="{ row }">
            {{ row.duration ? `${row.duration}h` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="fee" :label="isCN ? '费用' : 'Fee'" width="100">
          <template #default="{ row }">
            {{ row.fee ? `¥${row.fee}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="isCN ? '状态' : 'Status'" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'parking' ? 'success' : 'info'" size="small">
              {{ row.status === 'parking' ? (isCN ? '停车中' : 'Parking') : (isCN ? '已离场' : 'Exited') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 预约弹窗 -->
    <el-dialog 
      v-model="showReserveDialog" 
      :title="isCN ? '预约车位' : 'Reserve Space'"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item :label="isCN ? '车位号' : 'Space'">
          <el-input v-model="reserveForm.spaceId" disabled />
        </el-form-item>
        <el-form-item :label="isCN ? '车牌号' : 'Plate'">
          <el-input v-model="reserveForm.plateNumber" :placeholder="isCN ? '请输入车牌号' : 'Enter plate number'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReserveDialog = false">{{ isCN ? '取消' : 'Cancel' }}</el-button>
        <el-button type="primary" @click="confirmReserve">{{ isCN ? '确认预约' : 'Confirm' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { ElMessage } from 'element-plus'
import type { ParkingSpace, ParkingRecord } from '@shared/types'

const isCN = inject('isCN', ref(true))
const selectedFloor = ref(-1)
const floors = [-2, -1, 1, 2, 3]
const showReserveDialog = ref(false)
const reserveForm = ref({ spaceId: '', plateNumber: '' })

// 模拟数据
const spaces = ref<ParkingSpace[]>([
  { id: 'S001', floor: -2, zone: 'A', number: 'A01', status: 'available' },
  { id: 'S002', floor: -2, zone: 'A', number: 'A02', status: 'occupied', plateNumber: '京A12345', entryTime: '2024-01-15 09:30' },
  { id: 'S003', floor: -2, zone: 'A', number: 'A03', status: 'reserved' },
  { id: 'S004', floor: -2, zone: 'A', number: 'A04', status: 'available' },
  { id: 'S005', floor: -2, zone: 'A', number: 'A05', status: 'occupied', plateNumber: '沪B67890', entryTime: '2024-01-15 08:00' },
  { id: 'S006', floor: -1, zone: 'B', number: 'B01', status: 'available' },
  { id: 'S007', floor: -1, zone: 'B', number: 'B02', status: 'occupied', plateNumber: '粤C11111', entryTime: '2024-01-15 10:00' },
  { id: 'S008', floor: -1, zone: 'B', number: 'B03', status: 'available' },
  { id: 'S009', floor: 1, zone: 'C', number: 'C01', status: 'occupied', plateNumber: '浙D22222', entryTime: '2024-01-15 07:00' },
  { id: 'S010', floor: 1, zone: 'C', number: 'C02', status: 'available' },
  { id: 'S011', floor: 2, zone: 'D', number: 'D01', status: 'available' },
  { id: 'S012', floor: 2, zone: 'D', number: 'D02', status: 'reserved' },
])

const parkingRecords = ref<ParkingRecord[]>([
  { id: 'R001', plateNumber: '京A12345', entryTime: '2024-01-15 09:30', status: 'parking', duration: 4, fee: 20 },
  { id: 'R002', plateNumber: '沪B67890', entryTime: '2024-01-15 08:00', status: 'parking', duration: 5.5, fee: 28 },
  { id: 'R003', plateNumber: '粤C11111', entryTime: '2024-01-14 18:00', exitTime: '2024-01-14 22:30', status: 'exited', duration: 4.5, fee: 22 },
])

const totalSpaces = computed(() => spaces.value.length)
const availableSpaces = computed(() => spaces.value.filter(s => s.status === 'available').length)
const occupiedSpaces = computed(() => spaces.value.filter(s => s.status === 'occupied').length)
const occupancyRate = computed(() => Math.round((occupiedSpaces.value / totalSpaces.value) * 100))

const currentFloorSpaces = computed(() => 
  spaces.value.filter(s => s.floor === selectedFloor.value)
)

function getSpaceClass(status: string) {
  return {
    available: status === 'available',
    occupied: status === 'occupied',
    reserved: status === 'reserved',
    disabled: status === 'disabled'
  }
}

function handleSpaceClick(space: ParkingSpace) {
  if (space.status === 'occupied') {
    ElMessage.info(
      isCN.value 
        ? `车位 ${space.number} 已被 ${space.plateNumber} 占用`
        : `Space ${space.number} occupied by ${space.plateNumber}`
    )
    return
  }
  
  if (space.status === 'reserved') {
    ElMessage.warning(isCN.value ? '该车位已被预约' : 'This space is reserved')
    return
  }
  
  reserveForm.value.spaceId = space.number
  showReserveDialog.value = true
}

function confirmReserve() {
  if (!reserveForm.value.plateNumber) {
    ElMessage.warning(isCN.value ? '请输入车牌号' : 'Please enter plate number')
    return
  }
  
  const space = spaces.value.find(s => s.number === reserveForm.value.spaceId)
  if (space) {
    space.status = 'reserved'
    ElMessage.success(
      isCN.value 
        ? `车位 ${space.number} 已预约成功`
        : `Space ${space.number} reserved successfully`
    )
  }
  
  showReserveDialog.value = false
  reserveForm.value = { spaceId: '', plateNumber: '' }
}

onMounted(() => {
  selectedFloor.value = -2
})
</script>

<style scoped>
.parking {
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
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.floor-tabs {
  margin-bottom: 20px;
}

.parking-map {
  margin-bottom: 16px;
  padding: 24px;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.parking-space {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.parking-space.available {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15), rgba(103, 194, 58, 0.05));
  border: 2px solid #67c23a;
}

.parking-space.occupied {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15), rgba(245, 108, 108, 0.05));
  border: 2px solid #f56c6c;
}

.parking-space.reserved {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.15), rgba(230, 162, 60, 0.05));
  border: 2px solid #e6a23c;
}

.parking-space:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.space-number {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.space-status {
  font-size: 20px;
  color: #606266;
  margin-top: 4px;
}

.plate-number {
  position: absolute;
  bottom: 4px;
  font-size: 10px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  border-radius: 2px;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-dot.available {
  background: #67c23a;
}

.legend-dot.occupied {
  background: #f56c6c;
}

.legend-dot.reserved {
  background: #e6a23c;
}

.records-section h3 {
  color: #303133;
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
  
  .map-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
