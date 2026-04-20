<template>
  <div class="user-management">
    <div class="page-header">
      <h2 class="page-title">
        <i class="el-icon-user"></i>
        {{ isCN ? '用户管理' : 'User Management' }}
      </h2>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <i class="el-icon-plus"></i>
          {{ isCN ? '添加用户' : 'Add User' }}
        </el-button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="card">
      <el-table :data="users" stripe v-loading="loading">
        <el-table-column :label="isCN ? '用户名' : 'Username'" prop="username" width="150" />

        <el-table-column :label="isCN ? '姓名' : 'Name'" width="150">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :src="row.avatar" :size="32">{{ row.name[0] }}</el-avatar>
              <span>{{ isCN ? row.name : row.name_en }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? '邮箱' : 'Email'" prop="email" width="200" />

        <el-table-column :label="isCN ? '角色' : 'Role'" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'operator' ? 'warning' : 'info'">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? '最后登录' : 'Last Login'" width="180">
          <template #default="{ row }">
            {{ row.lastLogin ? formatTime(row.lastLogin) : '-' }}
          </template>
        </el-table-column>

        <el-table-column :label="isCN ? '操作' : 'Actions'">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)">
              {{ isCN ? '编辑' : 'Edit' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="row.username === 'admin'"
              @click="deleteUser(row.id)"
            >
              {{ isCN ? '删除' : 'Delete' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? (isCN ? '编辑用户' : 'Edit User') : (isCN ? '添加用户' : 'Add User')"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item :label="isCN ? '用户名' : 'Username'" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>

        <el-form-item :label="isCN ? '密码' : 'Password'" prop="password" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>

        <el-form-item :label="isCN ? '姓名' : 'Name'" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item :label="isCN ? '邮箱' : 'Email'" prop="email">
          <el-input v-model="form.email" type="email" />
        </el-form-item>

        <el-form-item :label="isCN ? '角色' : 'Role'" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option value="admin" :label="isCN ? '管理员' : 'Admin'" />
            <el-option value="operator" :label="isCN ? '操作员' : 'Operator'" />
            <el-option value="user" :label="isCN ? '普通用户' : 'User'" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ isCN ? '取消' : 'Cancel' }}</el-button>
        <el-button type="primary" @click="submitForm">{{ isCN ? '确定' : 'Submit' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const isCN = inject('isCN', ref(true))

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'user'
})

const rules = {
  username: [{ required: true, message: isCN.value ? '请输入用户名' : 'Username required', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: isCN.value ? '密码至少6位' : 'Min 6 chars', trigger: 'blur' }],
  name: [{ required: true, message: isCN.value ? '请输入姓名' : 'Name required', trigger: 'blur' }],
  role: [{ required: true, message: isCN.value ? '请选择角色' : 'Role required', trigger: 'change' }]
}

const getRoleLabel = (role) => {
  const labels = { admin: isCN.value ? '管理员' : 'Admin', operator: isCN.value ? '操作员' : 'Operator', user: isCN.value ? '普通用户' : 'User' }
  return labels[role] || role
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString(isCN.value ? 'zh-CN' : 'en-US')
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/auth/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.success) {
      users.value = res.data.data
    }
  } catch (error) {
    ElMessage.error(isCN.value ? '获取用户列表失败' : 'Failed to fetch users')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  form.id = null
  form.username = ''
  form.password = ''
  form.name = ''
  form.email = ''
  form.role = 'user'
  dialogVisible.value = true
}

const openEditDialog = (user) => {
  isEdit.value = true
  form.id = user.id
  form.username = user.username
  form.name = user.name
  form.email = user.email
  form.role = user.role
  form.password = ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    const token = localStorage.getItem('token')
    try {
      if (isEdit.value) {
        const res = await axios.put(`https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/auth/users/${form.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.success) {
          ElMessage.success(isCN.value ? '用户已更新' : 'User updated')
          dialogVisible.value = false
          fetchUsers()
        }
      } else {
        const res = await axios.post('https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/auth/users', form, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.success) {
          ElMessage.success(isCN.value ? '用户已添加' : 'User added')
          dialogVisible.value = false
          fetchUsers()
        }
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.error || (isCN.value ? '操作失败' : 'Operation failed'))
    }
  })
}

const deleteUser = async (id) => {
  try {
    await ElMessageBox.confirm(
      isCN.value ? '确定要删除该用户吗？' : 'Delete this user?',
      isCN.value ? '确认删除' : 'Confirm Delete',
      { type: 'warning' }
    )

    const token = localStorage.getItem('token')
    const res = await axios.delete(`https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/auth/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.data.success) {
      ElMessage.success(isCN.value ? '用户已删除' : 'User deleted')
      fetchUsers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || (isCN.value ? '删除失败' : 'Delete failed'))
    }
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
