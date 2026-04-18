<template>
  <div class="monitor">
    <h2 class="page-title">
      <i class="el-icon-video-camera"></i>
      {{ isCN ? 'AI 视频监控' : 'AI Video Monitor' }}
    </h2>

    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a, #85ce61)">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ onlineCameras }}</div>
          <div class="stat-label">{{ isCN ? '在线' : 'Online' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c, #e6a23c)">
          <i class="el-icon-circle-close"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ offlineCameras }}</div>
          <div class="stat-label">{{ isCN ? '离线' : 'Offline' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalAlerts }}</div>
          <div class="stat-label">{{ isCN ? '今日告警' : 'Today Alerts' }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #9c27b0, #e91e63)">
          <i class="el-icon-magic-stick"></i>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ aiEnabledCameras }}</div>
          <div class="stat-label">{{ isCN ? 'AI监控' : 'AI Enabled' }}</div>
        </div>
      </div>
    </div>

    <!-- 监控视图 -->
    <div class="camera-grid">
      <div 
        v-for="camera in cameras" 
        :key="camera.id" 
        class="camera-card card"
        @click="selectCamera(camera)"
      >
        <div class="camera-preview">
          <div class="preview-placeholder">
            <i class="el-icon-video-camera"></i>
            <span>{{ isCN ? '画面加载中...' : 'Loading...' }}</span>
          </div>
          <div class="camera-status">
            <span class="status-dot" :class="camera.status"></span>
            {{ camera.status === 'online' ? (isCN ? '在线' : 'Online') : (isCN ? '离线' : 'Offline') }}
          </div>
          <div v-if="camera.hasAI" class="ai-badge">
            <i class="el-icon-magic-stick"></i>
            AI
          </div>
          <div v-if="camera.alerts > 0" class="alert-badge">
            {{ camera.alerts }}
          </div>
        </div>

        <div class="camera-info">
          <h3>{{ camera.name }}</h3>
          <p>{{ camera.location }}</p>
        </div>

        <div class="camera-footer">
          <span class="last-motion">
            <i class="el-icon-time"></i>
            {{ camera.lastMotion || (isCN ? '暂无活动' : 'No activity') }}
          </span>
        </div>
      </div>
    </div>

    <!-- 告警记录 -->
    <div class="card alerts-section">
      <div class="section-header">
        <h3>
          <i class="el-icon-warning"></i>
          {{ isCN ? '告警记录' : 'Alert Records' }}
        </h3>
        <el-button size="small" @click="refreshAlerts">
          <i class="el-icon-refresh"></i>
        </el-button>
      </div>

      <el-table :data="alerts" style="width: 100%">
        <el-table-column prop="timestamp" :label="isCN ? '时间' : 'Time'" width="180">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" :label="isCN ? '类型' : 'Type'" width="120">
          <template #default="{ row }">
            <el-tag :type="getAlertTypeColor(row.type)" size="small">
              {{ getAlertTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cameraName" :label="isCN ? '摄像头' : 'Camera'" width="150" />
        <el-table-column prop="message" :label="isCN ? '消息' : 'Message'" />
        <el-table-column :label="isCN ? '状态' : 'Status'" width="100">
          <template #default="{ row }">
            <el-tag :type="row.acknowledged ? 'info' : 'danger'" size="small">
              {{ row.acknowledged ? (isCN ? '已确认' : 'Ack') : (isCN ? '未确认' : 'New') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="isCN ? '操作' : 'Action'" width="100">
          <template #default="{ row }">
            <el-button 
              v-if="!row.acknowledged" 
              size="small" 
              type="primary"
              @click="acknowledgeAlert(row)"
            >
              {{ isCN ? '确认' : 'Ack' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 视频详情弹窗 -->
    <el-dialog 
      v-model="showVideoDialog" 
      :title="selectedCamera?.name || ''"
      width="800px"
      class="video-dialog"
    >
      <div class="video-container">
        <div class="video-placeholder">
          <i class="el-icon-video-camera"></i>
          <p>{{ isCN ? '视频流加载区域' : 'Video Stream Area' }}</p>
          <p class="hint">{{ selectedCamera?.streamUrl || (isCN ? 'RTSP/HLS 流地址' : 'RTSP/HLS Stream URL') }}</p>
        </div>
        
        <div class="video-controls">
          <el-button-group>
            <el-button @click="toggleRecording">
              <i :class="isRecording ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
              {{ isRecording ? (isCN ? '停止录制' : 'Stop') : (isCN ? '开始录制' : 'Record') }}
            </el-button>
            <el-button @click="takeSnapshot">
              <i class="el-icon-camera"></i>
              {{ isCN ? '截图' : 'Snapshot' }}
            </el-button>
            <el-button @click="toggleFullscreen">
              <i class="el-icon-full-screen"></i>
            </el-button>
          </el-button-group>
        </div>

        <div class="video-info">
          <div class="info-item">
            <span class="label">{{ isCN ? '位置' : 'Location' }}:</span>
            <span>{{ selectedCamera?.location }}</span>
          </div>
          <div class="info-item">
            <span class="label">{{ isCN ? '状态' : 'Status' }}:</span>
            <span :class="selectedCamera?.status">
              {{ selectedCamera?.status === 'online' ? (isCN ? '在线' : 'Online') : (isCN ? '离线' : 'Offline') }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">AI:</span>
            <span>{{ selectedCamera?.hasAI ? (isCN ? '已启用' : 'Enabled') : (isCN ? '未启用' : 'Disabled') }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { ElMessage } from 'element-plus'
import type { Camera, MonitorAlert } from '@shared/types'

const isCN = inject('isCN', ref(true))
const showVideoDialog = ref(false)
const selectedCamera = ref<Camera | null>(null)
const isRecording = ref(false)

const cameras = ref<Camera[]>([
  { 
    id: 'C001', 
    name: '1号摄像头', 
    location: '1楼大厅入口', 
    floor: 1, 
    status: 'online', 
    hasAI: true, 
    lastMotion: '2分钟前',
    alerts: 2
  },
  { 
    id: 'C002', 
    name: '2号摄像头', 
    location: '电梯口', 
    floor: 1, 
    status: 'online', 
    hasAI: true,
    lastMotion: '10分钟前',
    alerts: 0
  },
  { 
    id: 'C003', 
    name: '3号摄像头', 
    location: '地下车库A区', 
    floor: -1, 
    status: 'online', 
    hasAI: false,
    lastMotion: '1小时前',
    alerts: 1
  },
  { 
    id: 'C004', 
    name: '4号摄像头', 
    location: '地下车库B区', 
    floor: -1, 
    status: 'offline', 
    hasAI: false,
    alerts: 0
  },
  { 
    id: 'C005', 
    name: '5号摄像头', 
    location: '2楼办公区', 
    floor: 2, 
    status: 'online', 
    hasAI: true,
    lastMotion: '5分钟前',
    alerts: 0
  },
  { 
    id: 'C006', 
    name: '6号摄像头', 
    location: '3楼会议室', 
    floor: 3, 
    status: 'online', 
    hasAI: true,
    lastMotion: '30分钟前',
    alerts: 0
  }
])

const alerts = ref<MonitorAlert[]>([
  { id: 'A001', cameraId: 'C001', type: 'motion', message: isCN.value ? '检测到人员移动' : 'Motion detected', timestamp: '2024-01-15 14:32:15', acknowledged: false },
  { id: 'A002', cameraId: 'C001', type: 'ai', message: isCN.value ? 'AI识别: 未佩戴安全帽' : 'AI: No helmet detected', timestamp: '2024-01-15 14:28:00', acknowledged: false },
  { id: 'A003', cameraId: 'C003', type: 'motion', message: isCN.value ? '检测到车辆移动' : 'Vehicle motion detected', timestamp: '2024-01-15 13:45:30', acknowledged: true },
  { id: 'A004', cameraId: 'C004', type: 'disconnect', message: isCN.value ? '摄像头断开连接' : 'Camera disconnected', timestamp: '2024-01-15 12:00:00', acknowledged: true }
])

const totalAlerts = computed(() => alerts.value.filter(a => !a.acknowledged).length)
const onlineCameras = computed(() => cameras.value.filter(c => c.status === 'online').length)
const offlineCameras = computed(() => cameras.value.filter(c => c.status === 'offline').length)
const aiEnabledCameras = computed(() => cameras.value.filter(c => c.hasAI).length)

function selectCamera(camera: Camera) {
  selectedCamera.value = camera
  showVideoDialog.value = true
}

function toggleRecording() {
  isRecording.value = !isRecording.value
  ElMessage.success(
    isRecording.value 
      ? (isCN.value ? '开始录制' : 'Recording started')
      : (isCN.value ? '停止录制' : 'Recording stopped')
  )
}

function takeSnapshot() {
  ElMessage.success(isCN.value ? '截图已保存' : 'Snapshot saved')
}

function toggleFullscreen() {
  ElMessage.info(isCN.value ? '全屏模式' : 'Fullscreen mode')
}

function acknowledgeAlert(alert: MonitorAlert) {
  alert.acknowledged = true
  ElMessage.success(isCN.value ? '已确认告警' : 'Alert acknowledged')
}

function refreshAlerts() {
  ElMessage.success(isCN.value ? '已刷新' : 'Refreshed')
}

function formatTime(timestamp: string) {
  return timestamp.replace('T', ' ').substring(0, 19)
}

function getAlertTypeColor(type: string) {
  const colors: Record<string, any> = {
    'motion': 'warning',
    'intrusion': 'danger',
    'disconnect': 'info',
    'ai': 'primary'
  }
  return colors[type] || 'info'
}

function getAlertTypeLabel(type: string) {
  const labels: Record<string, { cn: string; en: string }> = {
    'motion': { cn: '移动', en: 'Motion' },
    'intrusion': { cn: '入侵', en: 'Intrusion' },
    'disconnect': { cn: '断开', en: 'Disconnect' },
    'ai': { cn: 'AI识别', en: 'AI' }
  }
  return isCN.value ? labels[type]?.cn || type : labels[type]?.en || type
}
</script>

<style scoped>
.monitor {
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

.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.camera-card {
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.camera-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.camera-preview {
  position: relative;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  gap: 8px;
}

.preview-placeholder i {
  font-size: 48px;
}

.camera-status {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #67c23a;
  animation: pulse 2s infinite;
}

.status-dot.offline {
  background: #f56c6c;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ai-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #9c27b0, #e91e63);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: #f56c6c;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  font-weight: 600;
}

.camera-info h3 {
  color: #303133;
  font-size: 16px;
  margin-bottom: 4px;
}

.camera-info p {
  color: #909399;
  font-size: 13px;
}

.camera-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.last-motion {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 12px;
}

.alerts-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.alerts-section h3 {
  color: #303133;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 视频弹窗 */
.video-container {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-placeholder {
  aspect-ratio: 16/9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  gap: 12px;
}

.video-placeholder i {
  font-size: 72px;
}

.video-placeholder .hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.video-controls {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
}

.video-info {
  padding: 12px;
  display: flex;
  gap: 24px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.video-info .label {
  color: rgba(255, 255, 255, 0.6);
  margin-right: 4px;
}

.video-info .online {
  color: #67c23a;
}

.video-info .offline {
  color: #f56c6c;
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
}
</style>
