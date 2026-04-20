<template>
  <div class="user-avatar" :class="{ 'clickable': clickable }" @click="handleClick">
    <el-dropdown v-if="showMenu" trigger="click" @command="handleCommand">
      <div class="avatar-wrapper">
        <el-avatar
          :size="size"
          :src="user?.avatar || defaultAvatar"
          :icon="UserFilled"
        />
        <div v-if="showName" class="user-info">
          <span class="username">{{ user?.name || (isCN ? '未登录' : 'Not logged in') }}</span>
          <span class="role-badge" :class="user?.role">
            {{ getRoleText(user?.role) }}
          </span>
        </div>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">
            <el-icon><User /></el-icon>
            {{ isCN ? '个人资料' : 'Profile' }}
          </el-dropdown-item>
          <el-dropdown-item command="settings">
            <el-icon><Setting /></el-icon>
            {{ isCN ? '设置' : 'Settings' }}
          </el-dropdown-item>
          <el-dropdown-item divided command="logout">
            <el-icon><SwitchButton /></el-icon>
            {{ isCN ? '退出登录' : 'Logout' }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-avatar
      v-else
      :size="size"
      :src="user?.avatar || defaultAvatar"
      :icon="UserFilled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, User, Setting, SwitchButton } from '@element-plus/icons-vue'
import axios from 'axios'

interface User {
  id: number
  username: string
  name: string
  role: string
  avatar?: string
  email?: string
  department?: string
}

interface Props {
  size?: number
  showMenu?: boolean
  showName?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 40,
  showMenu: true,
  showName: false,
  clickable: true
})

const router = useRouter()
const isCN = inject('isCN', ref(true))

const user = ref<User | null>(null)

const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

onMounted(() => {
  loadUser()
})

function loadUser() {
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch {
      user.value = null
    }
  }
}

function getRoleText(role?: string): string {
  if (!role) return ''
  const roleMap: Record<string, { zh: string; en: string }> = {
    admin: { zh: '管理员', en: 'Admin' },
    user: { zh: '用户', en: 'User' },
    operator: { zh: '操作员', en: 'Operator' }
  }
  return roleMap[role]?.[isCN.value ? 'zh' : 'en'] || role
}

function handleClick() {
  if (!user.value) {
    router.push('/login')
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          isCN.value ? '确定要退出登录吗？' : 'Are you sure you want to logout?',
          isCN.value ? '退出登录' : 'Logout',
          {
            confirmButtonText: isCN.value ? '确定' : 'Confirm',
            cancelButtonText: isCN.value ? '取消' : 'Cancel',
            type: 'warning'
          }
        )

        const token = localStorage.getItem('token')
        const refreshToken = localStorage.getItem('refreshToken')

        if (token) {
          try {
            await axios.post('https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/auth/logout', { refreshToken })
          } catch {
            // ignore
          }
        }

        // 清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')

        ElMessage.success(isCN.value ? '已退出登录' : 'Logged out successfully')
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

// 暴露方法供父组件调用
defineExpose({ loadUser })
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
}

.user-avatar.clickable {
  cursor: pointer;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 3px 10px 3px 4px;
  border-radius: 10px;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.avatar-wrapper:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.38);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.username {
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.2;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.role-badge {
  font-size: 10px;
  padding: 1.5px 7px;
  border-radius: 6px;
  margin-top: 3px;
  letter-spacing: 0.3px;
  font-weight: 500;
}

.role-badge.admin {
  background: linear-gradient(135deg, #fff 0%, #e8f4ff 100%);
  color: #409eff;
}

.role-badge.user {
  background: linear-gradient(135deg, #fff 0%, #f0f9eb 100%);
  color: #67c23a;
}

.role-badge.operator {
  background: linear-gradient(135deg, #fff 0%, #fdf6ec 100%);
  color: #e6a23c;
}
</style>
