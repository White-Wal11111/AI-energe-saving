<template>
  <div class="settings">
    <h2 class="page-title">
      <i class="el-icon-setting"></i>
      {{ isCN ? '系统设置' : 'System Settings' }}
    </h2>

    <!-- 设置分组 -->
    <div class="settings-grid">
      <!-- 语言设置 -->
      <div class="card setting-card">
        <div class="setting-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
          <i class="el-icon-reading"></i>
        </div>
        <div class="setting-content">
          <h3>{{ isCN ? '语言设置' : 'Language' }}</h3>
          <p>{{ isCN ? '选择系统界面显示语言' : 'Choose interface language' }}</p>
          <el-radio-group v-model="settings.language" @change="handleLanguageChange">
            <el-radio label="zh-CN">简体中文</el-radio>
            <el-radio label="en-US">English</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- API 配置 -->
      <div class="card setting-card">
        <div class="setting-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
          <i class="el-icon-key"></i>
        </div>
        <div class="setting-content">
          <h3>{{ isCN ? 'DeepSeek API' : 'DeepSeek API' }}</h3>
          <p>{{ isCN ? '配置 AI 分析功能的 API 密钥' : 'Configure API key for AI features' }}</p>
          <el-input 
            v-model="settings.apiKey" 
            :placeholder="isCN ? '输入 API Key' : 'Enter API Key'"
            show-password
          />
          <el-button type="primary" size="small" style="margin-top: 12px" @click="saveApiKey">
            {{ isCN ? '保存' : 'Save' }}
          </el-button>
        </div>
      </div>

      <!-- 服务器配置 -->
      <div class="card setting-card">
        <div class="setting-icon" style="background: linear-gradient(135deg, #4facfe, #00f2fe)">
          <i class="el-icon-connection"></i>
        </div>
        <div class="setting-content">
          <h3>{{ isCN ? '服务器配置' : 'Server Config' }}</h3>
          <p>{{ isCN ? '设置后端 API 服务器地址' : 'Backend API server URL' }}</p>
          <el-input 
            v-model="settings.serverUrl" 
            :placeholder="isCN ? '例如: http://localhost:4000' : 'e.g. http://localhost:4000'"
          />
        </div>
      </div>

      <!-- 刷新频率 -->
      <div class="card setting-card">
        <div class="setting-icon" style="background: linear-gradient(135deg, #fa709a, #fee140)">
          <i class="el-icon-refresh"></i>
        </div>
        <div class="setting-content">
          <h3>{{ isCN ? '数据刷新' : 'Data Refresh' }}</h3>
          <p>{{ isCN ? '设置仪表盘数据自动刷新频率' : 'Dashboard auto-refresh interval' }}</p>
          <el-select v-model="settings.refreshInterval">
            <el-option :value="5000" label="5s" />
            <el-option :value="10000" label="10s" />
            <el-option :value="30000" label="30s" />
            <el-option :value="60000" label="1min" />
          </el-select>
        </div>
      </div>

      <!-- 主题设置 -->
      <div class="card setting-card">
        <div class="setting-icon" style="background: linear-gradient(135deg, #667eea, #00d2ff)">
          <i class="el-icon-moon"></i>
        </div>
        <div class="setting-content">
          <h3>{{ isCN ? '界面主题' : 'Theme' }}</h3>
          <p>{{ isCN ? '选择系统界面配色方案' : 'Choose interface color scheme' }}</p>
          <el-radio-group v-model="settings.theme">
            <el-radio label="dark">
              {{ isCN ? '深色模式' : 'Dark Mode' }}
            </el-radio>
            <el-radio label="light">
              {{ isCN ? '浅色模式' : 'Light Mode' }}
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="card setting-card">
        <div class="setting-icon" style="background: linear-gradient(135deg, #67c23a, #85ce61)">
          <i class="el-icon-bell"></i>
        </div>
        <div class="setting-content">
          <h3>{{ isCN ? '通知设置' : 'Notifications' }}</h3>
          <p>{{ isCN ? '配置系统告警通知方式' : 'Configure alert notification methods' }}</p>
          <div class="notification-options">
            <el-checkbox v-model="notifySettings.email">{{ isCN ? '邮件通知' : 'Email' }}</el-checkbox>
            <el-checkbox v-model="notifySettings.wechat">{{ isCN ? '微信推送' : 'WeChat' }}</el-checkbox>
            <el-checkbox v-model="notifySettings.sms">{{ isCN ? '短信通知' : 'SMS' }}</el-checkbox>
          </div>
        </div>
      </div>
    </div>

    <!-- 关于系统 -->
    <div class="card about-section">
      <h3>
        <i class="el-icon-info"></i>
        {{ isCN ? '关于系统' : 'About System' }}
      </h3>
      <div class="about-content">
        <div class="about-item">
          <span class="label">{{ isCN ? '系统名称' : 'Name' }}:</span>
          <span>{{ isCN ? 'AI预测中央空调控制系统' : 'AI-Predictive HVAC Control System' }}</span>
        </div>
        <div class="about-item">
          <span class="label">{{ isCN ? '版本号' : 'Version' }}:</span>
          <span>1.0.0</span>
        </div>
        <div class="about-item">
          <span class="label">{{ isCN ? '技术栈' : 'Tech Stack' }}:</span>
          <span>Vue 3 + Vite + Element Plus + TypeScript</span>
        </div>
        <div class="about-item">
          <span class="label">{{ isCN ? '开发者' : 'Developer' }}:</span>
          <span>REII Automation</span>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-actions">
      <el-button type="primary" size="large" @click="saveAllSettings">
        <i class="el-icon-check"></i>
        {{ isCN ? '保存所有设置' : 'Save All Settings' }}
      </el-button>
      <el-button size="large" @click="resetSettings">
        <i class="el-icon-refresh"></i>
        {{ isCN ? '恢复默认' : 'Reset Default' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { ElMessage } from 'element-plus'

const isCN = inject('isCN', ref(true))

const settings = ref({
  language: 'zh-CN',
  theme: 'dark',
  apiKey: '',
  serverUrl: import.meta.env.PROD 
    ? 'https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com'
    : 'http://localhost:4000',
  refreshInterval: 10000
})

const notifySettings = ref({
  email: true,
  wechat: true,
  sms: false
})

function handleLanguageChange(lang: string) {
  isCN.value = lang === 'zh-CN'
  ElMessage.success(
    lang === 'zh-CN' 
      ? '语言已切换为简体中文' 
      : 'Language changed to English'
  )
}

function saveApiKey() {
  if (!settings.value.apiKey) {
    ElMessage.warning(isCN.value ? '请输入 API Key' : 'Please enter API Key')
    return
  }
  localStorage.setItem('deepseek_api_key', settings.value.apiKey)
  ElMessage.success(isCN.value ? 'API Key 已保存' : 'API Key saved')
}

function saveAllSettings() {
  localStorage.setItem('system_settings', JSON.stringify(settings.value))
  localStorage.setItem('notify_settings', JSON.stringify(notifySettings.value))
  ElMessage.success(isCN.value ? '设置已保存' : 'Settings saved')
}

function resetSettings() {
  settings.value = {
    language: 'zh-CN',
    theme: 'dark',
    apiKey: '',
    serverUrl: import.meta.env.PROD 
      ? 'https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com'
      : 'http://localhost:4000',
    refreshInterval: 10000
  }
  notifySettings.value = {
    email: true,
    wechat: true,
    sms: false
  }
  ElMessage.success(isCN.value ? '已恢复默认设置' : 'Reset to default')
}
</script>

<style scoped>
.settings {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.setting-card {
  display: flex;
  gap: 20px;
  transition: all 0.3s ease;
}

.setting-card:hover {
  transform: translateY(-4px);
}

.setting-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.setting-content {
  flex: 1;
}

.setting-content h3 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 6px;
}

.setting-content p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  margin-bottom: 12px;
}

.notification-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.about-section {
  margin-bottom: 24px;
}

.about-section h3 {
  color: #fff;
  font-size: 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.about-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.about-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.about-item .label {
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.about-item span:last-child {
  color: #fff;
}

.save-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 768px) {
  .setting-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .save-actions {
    flex-direction: column;
  }
  
  .save-actions .el-button {
    width: 100%;
  }
}
</style>
