<template>
  <div class="system-settings">
    <div class="page-title">
      <div class="title-left">
        <h1>
          <i class="el-icon-setting"></i>
          {{ isCN ? '系统设置' : 'System Settings' }}
        </h1>
        <p>{{ isCN ? '管理系统配置和API设置' : 'Manage system configuration and API settings' }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- API配置卡片 -->
      <div class="settings-card">
        <div class="card-header">
          <div class="header-icon">
            <i class="el-icon-key"></i>
          </div>
          <div class="header-info">
            <h3>{{ isCN ? 'AI服务配置' : 'AI Service Configuration' }}</h3>
            <p>{{ isCN ? '配置DeepSeek API Key以启用AI实时分析功能' : 'Configure DeepSeek API Key for AI real-time analysis' }}</p>
          </div>
          <div class="header-status">
            <el-tag :type="hasApiKeyConfigured ? 'success' : 'warning'" size="small">
              {{ hasApiKeyConfigured ? (isCN ? '已配置' : 'Configured') : (isCN ? '未配置' : 'Not Configured') }}
            </el-tag>
          </div>
        </div>

        <div class="card-body">
          <!-- 已配置的Key脱敏展示 -->
          <div v-if="maskedApiKey" class="api-key-display">
            <div class="key-display-row">
              <div class="key-label">
                <i class="el-icon-key"></i>
                <span>{{ isCN ? '当前API Key' : 'Current API Key' }}</span>
              </div>
              <div class="key-value">
                <code class="masked-key-code">{{ maskedApiKey }}</code>
                <el-button link type="primary" @click="startEditKey" size="small">
                  <i class="el-icon-edit"></i>
                  {{ isCN ? '修改' : 'Edit' }}
                </el-button>
                <el-button link type="danger" @click="deleteApiKey" size="small">
                  <i class="el-icon-delete"></i>
                  {{ isCN ? '删除' : 'Delete' }}
                </el-button>
              </div>
            </div>
            <div class="key-meta-row" v-if="keyStatus.lastVerifiedAt">
              <span class="meta-item">
                <i class="el-icon-time"></i>
                {{ isCN ? '上次校验' : 'Last Verified' }}: {{ formatTime(keyStatus.lastVerifiedAt) }}
              </span>
              <span class="meta-item">
                <el-tag :type="keyStatus.lastVerifiedStatus === 'success' ? 'success' : 'danger'" size="small">
                  {{ keyStatus.lastVerifiedStatus === 'success' ? (isCN ? '连通' : 'Connected') : (isCN ? '异常' : 'Failed') }}
                </el-tag>
              </span>
              <span class="meta-item" v-if="keyStatus.model">
                <i class="el-icon-cpu"></i>
                {{ keyStatus.model }}
              </span>
            </div>
          </div>

          <!-- 输入新Key -->
          <el-form v-if="!maskedApiKey || isEditingKey" label-position="top" class="api-form">
            <el-form-item :label="isCN ? 'DeepSeek API Key' : 'DeepSeek API Key'">
              <el-input
                v-model="apiKeyInput"
                type="password"
                show-password
                :placeholder="isCN ? '请输入API Key' : 'Enter API Key'"
                size="large"
                @keyup.enter="saveApiKey"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-help">
              <el-link type="primary" href="https://platform.deepseek.com/" target="_blank">
                <i class="el-icon-link"></i>
                {{ isCN ? '获取API Key →' : 'Get API Key →' }}
              </el-link>
              <span class="help-text">
                {{ isCN ? 'API Key用于AI实时验证节能预测结果，提高分析准确度' : 'API Key for AI real-time verification of energy saving predictions' }}
              </span>
            </div>
          </el-form>
        </div>

        <div class="card-footer">
          <el-button
            v-if="!maskedApiKey || isEditingKey"
            type="primary"
            size="large"
            @click="saveApiKey"
            :loading="saving"
            :disabled="!apiKeyInput"
          >
            <i class="el-icon-check"></i>
            {{ isCN ? '保存配置' : 'Save Configuration' }}
          </el-button>
          <el-button
            size="large"
            @click="verifyApiKey"
            :loading="verifying"
            :disabled="!hasApiKeyConfigured && !apiKeyInput"
          >
            <i class="el-icon-refresh"></i>
            {{ verifying ? (isCN ? '校验中...' : 'Verifying...') : (isCN ? '校验连通性' : 'Verify Connection') }}
          </el-button>
          <el-button
            v-if="isEditingKey"
            size="large"
            @click="cancelEdit"
          >
            {{ isCN ? '取消' : 'Cancel' }}
          </el-button>
        </div>

        <!-- 校验结果 -->
        <div v-if="verifyResult" class="test-result" :class="verifyResult.status">
          <div class="result-icon">
            <i :class="verifyResult.status === 'success' ? 'el-icon-circle-check' : 'el-icon-circle-close'"></i>
          </div>
          <div class="result-info">
            <span class="result-message">{{ verifyResult.message }}</span>
            <span v-if="verifyResult.latency" class="result-latency">
              {{ isCN ? '延迟' : 'Latency' }}: {{ verifyResult.latency }}ms
            </span>
          </div>
        </div>
      </div>

      <!-- 系统信息卡片 -->
      <div class="settings-card">
        <div class="card-header">
          <div class="header-icon info">
            <i class="el-icon-info"></i>
          </div>
          <div class="header-info">
            <h3>{{ isCN ? '系统信息' : 'System Information' }}</h3>
            <p>{{ isCN ? '查看系统版本和运行状态' : 'View system version and status' }}</p>
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ isCN ? '系统版本' : 'Version' }}</span>
              <span class="info-value">v1.0.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ isCN ? '前端端口' : 'Frontend Port' }}</span>
              <span class="info-value">3000</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ isCN ? '后端端口' : 'Backend Port' }}</span>
              <span class="info-value">4000</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ isCN ? '运行环境' : 'Environment' }}</span>
              <span class="info-value">Node.js</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ isCN ? 'AI引擎' : 'AI Engine' }}</span>
              <span class="info-value">{{ keyStatus.model || 'DeepSeek' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ isCN ? '分析模式' : 'Analysis Mode' }}</span>
              <span class="info-value">
                <el-tag :type="hasApiKeyConfigured ? 'success' : 'info'" size="small">
                  {{ hasApiKeyConfigured ? (isCN ? 'AI分析' : 'AI Analysis') : (isCN ? '本地计算' : 'Local') }}
                </el-tag>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Key } from '@element-plus/icons-vue'

const isCN = inject('isCN', ref(true))

const API_BASE = '/api/energy'

const apiKeyInput = ref('')
const maskedApiKey = ref('')
const isEditingKey = ref(false)
const hasApiKeyConfigured = ref(false)
const saving = ref(false)
const verifying = ref(false)
const verifyResult = ref(null)
const keyStatus = ref({
  lastVerifiedAt: null,
  lastVerifiedStatus: null,
  model: null,
  updatedAt: null
})

onMounted(async () => {
  await loadKeyStatus()
})

async function loadKeyStatus() {
  try {
    const response = await fetch(`${API_BASE}/api-key-status`)
    const data = await response.json()
    hasApiKeyConfigured.value = data.hasKey
    maskedApiKey.value = data.maskedKey || ''
    keyStatus.value = {
      lastVerifiedAt: data.lastVerifiedAt,
      lastVerifiedStatus: data.lastVerifiedStatus,
      model: data.model,
      updatedAt: data.updatedAt
    }
    isEditingKey.value = false
  } catch (e) {
    // ignore
  }
}

function startEditKey() {
  isEditingKey.value = true
  apiKeyInput.value = ''
}

function cancelEdit() {
  isEditingKey.value = false
  apiKeyInput.value = ''
}

async function saveApiKey() {
  if (!apiKeyInput.value) {
    ElMessage.warning(isCN.value ? '请输入API Key' : 'Please enter API Key')
    return
  }

  saving.value = true
  try {
    const response = await fetch(`${API_BASE}/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKeyInput.value })
    })
    const data = await response.json()

    if (data.success) {
      ElMessage.success(isCN.value ? 'API Key保存成功' : 'API Key saved successfully')
      apiKeyInput.value = ''
      await loadKeyStatus()
    } else {
      ElMessage.error(isCN.value ? '保存失败' : 'Save failed')
    }
  } catch (e) {
    ElMessage.error(isCN.value ? '保存失败' : 'Save failed')
  } finally {
    saving.value = false
  }
}

async function verifyApiKey() {
  verifying.value = true
  verifyResult.value = null

  try {
    const response = await fetch(`${API_BASE}/verify-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKeyInput.value || undefined })
    })
    const data = await response.json()

    verifyResult.value = {
      status: data.status,
      message: data.message,
      latency: data.latency
    }

    // 刷新状态
    await loadKeyStatus()
  } catch (e) {
    verifyResult.value = {
      status: 'failed',
      message: isCN.value ? '校验请求失败' : 'Verify request failed'
    }
  } finally {
    verifying.value = false
  }
}

async function deleteApiKey() {
  try {
    await ElMessageBox.confirm(
      isCN.value ? '确定要删除API Key吗？删除后将使用本地计算模式。' : 'Are you sure to delete the API Key? Local calculation will be used after deletion.',
      isCN.value ? '确认删除' : 'Confirm Delete',
      {
        confirmButtonText: isCN.value ? '确定' : 'Confirm',
        cancelButtonText: isCN.value ? '取消' : 'Cancel',
        type: 'warning'
      }
    )

    const response = await fetch(`${API_BASE}/api-key`, {
      method: 'DELETE'
    })
    const data = await response.json()

    if (data.success) {
      ElMessage.success(isCN.value ? 'API Key已删除' : 'API Key deleted')
      maskedApiKey.value = ''
      hasApiKeyConfigured.value = false
      keyStatus.value = {
        lastVerifiedAt: null,
        lastVerifiedStatus: null,
        model: null,
        updatedAt: null
      }
      verifyResult.value = null
    }
  } catch {
    // User cancelled
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '-'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString(isCN.value ? 'zh-CN' : 'en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return timeStr
  }
}
</script>

<style scoped>
.system-settings {
  padding: 0;
}

.page-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #1a6dbb 0%, #2a8ae0 100%);
  border-radius: 16px;
  color: white;
}

.title-left h1 {
  font-size: 26px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-left p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  flex-shrink: 0;
}

.header-icon.info {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.header-info {
  flex: 1;
}

.header-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.header-info p {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.header-status {
  flex-shrink: 0;
}

.card-body {
  margin-bottom: 20px;
}

/* API Key 展示区域 */
.api-key-display {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #ebeef5;
}

.key-display-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.key-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.key-label i {
  color: #667eea;
}

.key-value {
  display: flex;
  align-items: center;
  gap: 12px;
}

.masked-key-code {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.key-meta-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #dcdfe6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.meta-item i {
  font-size: 14px;
}

/* 表单 */
.api-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

.form-help {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.help-text {
  font-size: 12px;
  color: #909399;
}

.card-footer {
  display: flex;
  gap: 12px;
}

/* 校验结果 */
.test-result {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.test-result.success {
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
}

.test-result.failed {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
}

.result-icon {
  font-size: 24px;
}

.test-result.success .result-icon {
  color: #67c23a;
}

.test-result.failed .result-icon {
  color: #f56c6c;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-message {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.result-latency {
  font-size: 12px;
  color: #909399;
}

/* 系统信息 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
  }
  
  .form-help {
    flex-direction: column;
    align-items: flex-start;
  }

  .key-display-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .key-meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
