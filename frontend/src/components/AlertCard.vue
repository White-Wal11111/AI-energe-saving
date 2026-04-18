<template>
  <div class="alert-card" :class="[`level-${alert.level}`, { 'is-pending': alert.status === 'pending' }]">
    <div class="alert-level-indicator" :style="{ background: levelColor }"></div>
    
    <div class="alert-content">
      <div class="alert-header">
        <div class="alert-badges">
          <el-tag :type="levelType" size="small" effect="dark">
            {{ levelText }}
          </el-tag>
          <el-tag :type="statusType" size="small">
            {{ alert.statusName || alert.status }}
          </el-tag>
          <el-tag size="small" effect="plain">
            {{ alert.typeName || alert.type }}
          </el-tag>
        </div>
        <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
      </div>

      <h3 class="alert-title">{{ alert.title }}</h3>
      <p class="alert-message">{{ alert.message }}</p>

      <div class="alert-meta">
        <span class="meta-item">
          <i class="el-icon-location"></i>
          {{ alert.location }}
        </span>
        <span class="meta-item">
          <i class="el-icon-monitor"></i>
          {{ alert.deviceName }}
        </span>
      </div>
    </div>

    <div class="alert-actions">
      <el-button 
        v-if="alert.status === 'pending'" 
        type="warning" 
        size="small"
        @click.stop="$emit('acknowledge', alert)"
      >
        {{ isCn ? '确认' : 'ACK' }}
      </el-button>
      <el-button 
        v-if="alert.status !== 'resolved'" 
        type="success" 
        size="small"
        @click.stop="$emit('resolve', alert)"
      >
        {{ isCn ? '处理' : 'Resolve' }}
      </el-button>
      <el-button 
        type="info" 
        size="small"
        plain
        @click.stop="$emit('click', alert)"
      >
        {{ isCn ? '详情' : 'Details' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElTag } from 'element-plus'

interface Alert {
  id: string
  type: string
  level: string
  status: string
  title: string
  message: string
  location: string
  deviceId: string
  deviceName: string
  value: number
  threshold: number
  createdAt: string
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
  typeName?: string
  levelName?: string
  statusName?: string
}

const props = defineProps<{
  alert: Alert
  isCn?: boolean
}>()

defineEmits<{
  (e: 'click', alert: Alert): void
  (e: 'acknowledge', alert: Alert): void
  (e: 'resolve', alert: Alert): void
}>()

const levelColors: Record<string, string> = {
  critical: '#ff4757',
  warning: '#ffa502',
  info: '#3498db'
}

const levelColor = computed(() => levelColors[props.alert.level] || levelColors.info)

const levelType = computed(() => {
  const map: Record<string, string> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return map[props.alert.level] || 'info'
})

const levelText = computed(() => {
  if (props.alert.levelName) return props.alert.levelName
  const map: Record<string, string> = {
    critical: props.isCn ? '严重' : 'Critical',
    warning: props.isCn ? '警告' : 'Warning',
    info: props.isCn ? '提示' : 'Info'
  }
  return map[props.alert.level] || props.alert.level
})

const statusType = computed(() => {
  const map: Record<string, string> = {
    pending: 'danger',
    acknowledged: 'warning',
    resolved: 'success'
  }
  return map[props.alert.status] || 'info'
})

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return props.isCn ? '刚刚' : 'Just now'
  if (minutes < 60) return props.isCn ? `${minutes}分钟前` : `${minutes}m ago`
  if (hours < 24) return props.isCn ? `${hours}小时前` : `${hours}h ago`
  if (days < 7) return props.isCn ? `${days}天前` : `${days}d ago`
  
  return date.toLocaleDateString(props.isCn ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.alert-card {
  display: flex;
  align-items: stretch;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.alert-card:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.08);
}

.alert-card.is-pending {
  border-color: rgba(255, 71, 87, 0.3);
}

.alert-card.level-critical {
  border-left: 3px solid #ff4757;
}

.alert-card.level-warning {
  border-left: 3px solid #ffa502;
}

.alert-card.level-info {
  border-left: 3px solid #3498db;
}

.alert-level-indicator {
  width: 4px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  padding: 16px;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.alert-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.alert-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.alert-message {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.alert-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.meta-item i {
  font-size: 14px;
}

.alert-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
  .alert-card {
    flex-direction: column;
  }
  
  .alert-level-indicator {
    width: 100%;
    height: 4px;
  }
  
  .alert-actions {
    flex-direction: row;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px 16px;
  }
}
</style>
