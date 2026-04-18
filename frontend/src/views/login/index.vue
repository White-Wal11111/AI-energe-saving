<template>
  <div class="login-wrapper">
    <div class="login-container">
      <!-- 左侧装饰 -->
      <div class="login-left">
        <div class="left-content">
          <div class="logo-area">
            <img src="/logo.png" alt="Logo" class="left-logo">
            <h1>{{ isCN ? 'AI预测节能管理系统' : 'AI Energy Management System' }}</h1>
            <p class="subtitle">{{ isCN ? 'AI Energy Management System' : 'AI-Powered EMS' }}</p>
          </div>
          <p class="slogan">{{ isCN ? '智能 · 高效 · 节能' : 'Smart · Efficient · Green' }}</p>
        </div>
      </div>

      <!-- 中间插画区域 -->
      <div class="login-center">
        <img v-if="illustrationSrc" :src="illustrationSrc" alt="Energy Illustration" class="illustration-img">
        <div v-else class="illustration-placeholder">
          <i class="el-icon-picture-outline"></i>
          <span>{{ isCN ? '节能插画' : 'Illustration' }}</span>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-right">
        <div class="login-box">
          <div class="login-header">
            <h2>{{ isCN ? '欢迎登录' : 'Welcome Back' }}</h2>
            <p class="sub-text">{{ isCN ? '请输入您的账号信息' : 'Enter your credentials' }}</p>
          </div>

          <el-form
            ref="loginFormRef"
            :model="form"
            :rules="rules"
            class="login-form"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="username">
                <div class="input-label">
                  <span class="label-cn" v-if="isCN">用户名</span>
                  <span class="label-en">{{ isCN ? '' : 'Username' }}</span>
                </div>
                <el-input
                  v-model="form.username"
                  :placeholder="isCN ? '请输入用户名' : 'Enter username'"
                  size="large"
                  clearable
                >
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
            </el-form-item>

            <el-form-item prop="password">
                <div class="input-label">
                  <span class="label-cn" v-if="isCN">密码</span>
                  <span class="label-en">{{ isCN ? '' : 'Password' }}</span>
                </div>
                <el-input
                  v-model="form.password"
                  type="password"
                  :placeholder="isCN ? '请输入密码' : 'Enter password'"
                  size="large"
                  show-password
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="form.remember">
                {{ isCN ? '记住密码' : 'Remember me' }}
              </el-checkbox>
            </div>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-button"
                @click="handleLogin"
              >
                {{ loading ? (isCN ? '登录中...' : 'Logging in...') : (isCN ? '登 录' : 'Login') }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="login-footer">
            <p class="demo-hint">
              {{ isCN ? '演示账号：' : 'Demo: ' }}
              <span>admin / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const isCN = inject('isCN', ref(true))

// 节能插画路径，上传插画后将图片放入 public/ 目录并修改此路径
const illustrationSrc = ref('/bg1.png')

const loginFormRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: localStorage.getItem('username') || '',
  password: localStorage.getItem('password') || '',
  remember: !!localStorage.getItem('username')
})

const rules = {
  username: [
    { required: true, message: isCN.value ? '请输入用户名' : 'Username is required', trigger: 'blur' }
  ],
  password: [
    { required: true, message: isCN.value ? '请输入密码' : 'Password is required', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    try {
      const res = await axios.post('/api/auth/login', {
        username: form.username,
        password: form.password
      })

      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.data.user))

        if (form.remember) {
          localStorage.setItem('username', form.username)
          localStorage.setItem('password', form.password)
        } else {
          localStorage.removeItem('username')
          localStorage.removeItem('password')
        }

        ElMessage.success(isCN.value ? '登录成功' : 'Login successful')
        router.push('/energy-prediction')
      }
    } catch (error) {
      ElMessage.error(
        error.response?.data?.error ||
        (isCN.value ? '登录失败，请检查用户名和密码' : 'Login failed')
      )
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: #0a1628;
}

.login-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧装饰区 */
.login-left {
  width: 380px;
  background: linear-gradient(135deg, #1a365d 0%, #0d2137 50%, #0a1628 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  position: relative;
  overflow: hidden;
}

/* 中间插画区域 */
.login-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f5f7fa;
}

.illustration-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.illustration-placeholder {
  text-align: center;
  color: #909399;
}

.illustration-placeholder i {
  font-size: 80px;
  color: #dcdfe6;
  display: block;
  margin-bottom: 16px;
}

.login-left::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 50%);
  animation: pulse 15s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.left-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.logo-area {
  margin-bottom: 40px;
  text-align: center;
}

.left-logo {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  border-radius: 16px;
  display: block;
}

.logo-area h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
  color: white;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.slogan {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin: 16px 0 4px;
  letter-spacing: 4px;
}

.slogan-en {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 48px;
  letter-spacing: 2px;
}

/* 右侧登录表单 */
.login-right {
  width: 420px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}

.login-box {
  width: 100%;
  max-width: 360px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px;
}

.en-text {
  font-size: 16px;
  color: #909399;
  margin: 0 0 16px;
}

.sub-text {
  font-size: 14px;
  color: #909399;
  margin: 0 0 2px;
}

.sub-text-en {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.login-form {
  margin-top: 24px;
}

.input-group {
  width: 100%;
}

.input-label {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.input-label .label-cn {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.input-label .label-en {
  font-size: 12px;
  color: #909399;
}

/* 输入框样式 */
.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: #f0f2f5 !important;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  padding: 4px 11px;
}

.login-form :deep(.el-input__wrapper:hover) {
  background-color: #e8eaed !important;
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background-color: #ffffff !important;
  box-shadow: 0 0 0 1px #409eff inset;
}

.login-form :deep(.el-input__inner) {
  height: 36px;
  color: #303133 !important;
  background-color: transparent !important;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: #909399 !important;
}

.login-form :deep(.el-input__prefix) {
  color: #909399;
}

.form-options {
  margin: 16px 0 24px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.demo-hint {
  font-size: 13px;
  color: #909399;
  margin: 0 0 4px;
}

.demo-hint-en {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}

.demo-hint span {
  color: #667eea;
  font-weight: 600;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 4px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .login-left {
    width: 320px;
  }

  .login-center {
    display: none;
  }

  .login-right {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 768px) {
  .login-left {
    display: none;
  }

  .login-right {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .login-right {
    padding: 40px 20px;
  }
}
</style>
