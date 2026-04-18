<template>
  <div class="login-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      class="form-container"
      @submit.prevent="handleLogin"
    >
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          :placeholder="isCN ? '用户名' : 'Username'"
          size="large"
          prefix-icon="User"
          clearable
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          :placeholder="isCN ? '密码' : 'Password'"
          size="large"
          prefix-icon="Lock"
          show-password
          clearable
          @keyup.enter="handleLogin"
        />
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
          class="login-btn"
          @click="handleLogin"
        >
          {{ loading ? (isCN ? '登录中...' : 'Logging in...') : (isCN ? '登录' : 'Login') }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="demo-hint">
      <el-text size="small" type="info">
        {{ isCN ? '测试账号：' : 'Demo: ' }}
        <el-tag size="small" type="info">admin / admin123</el-tag>
        <el-tag size="small" type="info">user / user123</el-tag>
      </el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, inject, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const isCN = inject('isCN', ref(true))

const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '', trigger: 'blur' }
  ]
}

onMounted(() => {
  // 读取保存的账号信息
  const savedUsername = localStorage.getItem('savedUsername')
  const savedPassword = localStorage.getItem('savedPassword')
  if (savedUsername && savedPassword) {
    form.username = savedUsername
    form.password = savedPassword
    form.remember = true
  }
})

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true

    try {
      const response = await axios.post('/api/auth/login', {
        username: form.username,
        password: form.password
      })

      if (response.data.success) {
        const { token, user } = response.data.data

        // 保存token到localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', response.data.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(user))

        // 如果记住密码，保存账号密码
        if (form.remember) {
          localStorage.setItem('savedUsername', form.username)
          localStorage.setItem('savedPassword', form.password)
        } else {
          localStorage.removeItem('savedUsername')
          localStorage.removeItem('savedPassword')
        }

        ElMessage.success(isCN.value ? '登录成功' : 'Login successful')

        // 跳转到首页或之前的页面
        const redirect = router.currentRoute.value.query.redirect as string || '/dashboard'
        router.push(redirect)
      }
    } catch (error: any) {
      const message = error.response?.data?.error || (isCN.value ? '登录失败' : 'Login failed')
      ElMessage.error(message)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-form {
  width: 100%;
}

.form-container {
  width: 100%;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
}

.login-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.demo-hint {
  margin-top: 16px;
  text-align: center;
}

.demo-hint .el-tag {
  margin: 0 4px;
}
</style>
