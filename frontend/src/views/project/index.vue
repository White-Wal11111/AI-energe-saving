<template>
  <div class="project-management">
    <div class="page-header">
      <div class="header-title">
        <h1><i class="el-icon-folder-opened"></i> {{ isCN ? '项目管理' : 'Project Management' }}</h1>
        <p>{{ isCN ? '对平台内的商场进行管理' : 'Manage malls within the platform' }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <i class="el-icon-plus"></i>
          {{ isCN ? '添加项目' : 'Add Project' }}
        </el-button>
      </div>
    </div>

    <div class="project-grid">
      <div v-for="project in projects" :key="project.id" class="project-card">
        <div class="card-header">
          <div class="project-info">
            <h3>{{ isCN ? project.name : project.name_en }}</h3>
            <p class="project-id">ID: {{ project.id }}</p>
          </div>
          <el-tag :type="project.status === 'active' ? 'success' : 'info'" size="small">
            {{ isCN ? (project.status === 'active' ? '运行中' : '停用') : (project.status === 'active' ? 'Active' : 'Inactive') }}
          </el-tag>
        </div>

        <div class="card-body">
          <div class="info-row">
            <i class="el-icon-location"></i>
            <span>{{ project.address || '-' }}</span>
          </div>
          <div class="info-row">
            <i class="el-icon-data-line"></i>
            <span>{{ isCN ? '建筑面积' : 'Area' }}: {{ project.area || '-' }} m²</span>
          </div>
          <div class="info-row">
            <i class="el-icon-user"></i>
            <span>{{ isCN ? '负责人' : 'Manager' }}: {{ project.manager || '-' }}</span>
          </div>
          <div class="info-row">
            <i class="el-icon-phone"></i>
            <span>{{ project.phone || '-' }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button size="small" @click="viewProject(project)">
            <i class="el-icon-view"></i>
            {{ isCN ? '查看' : 'View' }}
          </el-button>
          <el-button size="small" type="primary" @click="editProject(project)">
            <i class="el-icon-edit"></i>
            {{ isCN ? '编辑' : 'Edit' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteProject(project.id)">
            <i class="el-icon-delete"></i>
            {{ isCN ? '删除' : 'Delete' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑项目对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingProject ? (isCN ? '编辑项目' : 'Edit Project') : (isCN ? '添加项目' : 'Add Project')"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="projectForm" label-position="top" class="project-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="isCN ? '项目名称' : 'Project Name'">
              <el-input v-model="projectForm.name" :placeholder="isCN ? '请输入项目名称' : 'Enter project name'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '项目ID' : 'Project ID'">
              <el-input v-model="projectForm.id" :disabled="editingProject !== null" :placeholder="isCN ? '如: mall-001' : 'e.g., mall-001'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="isCN ? '项目名称(英文)' : 'Name (EN)'">
              <el-input v-model="projectForm.name_en" :placeholder="isCN ? 'Please enter' : 'Enter project name in English'" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '状态' : 'Status'">
              <el-select v-model="projectForm.status" style="width: 100%">
                <el-option :label="isCN ? '运行中' : 'Active'" value="active" />
                <el-option :label="isCN ? '停用' : 'Inactive'" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="isCN ? '地址' : 'Address'">
          <el-input v-model="projectForm.address" :placeholder="isCN ? '请输入地址' : 'Enter address'" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="isCN ? '建筑面积 (m²)' : 'Area (m²)'">
              <el-input-number v-model="projectForm.area" :min="1000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="isCN ? '负责人' : 'Manager'">
              <el-input v-model="projectForm.manager" :placeholder="isCN ? '请输入负责人' : 'Enter manager name'" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="isCN ? '联系电话' : 'Phone'">
          <el-input v-model="projectForm.phone" :placeholder="isCN ? '请输入联系电话' : 'Enter phone number'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ isCN ? '取消' : 'Cancel' }}</el-button>
        <el-button type="primary" @click="saveProject">{{ isCN ? '保存' : 'Save' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const isCN = inject('isCN', ref(true))

const projects = ref([
  {
    id: '1',
    name: 'Grand Indonesia',
    name_en: 'Grand Indonesia Mall',
    status: 'active',
    address: 'Jl. M.H. Thamrin No. 1, Menteng, Jakarta Pusat',
    area: 250000,
    manager: 'Budi Santoso',
    phone: '+62-21-2358-0001'
  },
  {
    id: '2',
    name: 'Plaza Senayan',
    name_en: 'Plaza Senayan Shopping Center',
    status: 'active',
    address: 'Jl. Asli Raya No. 27, Senayan, Kebayoran Baru, Jakarta Selatan',
    area: 180000,
    manager: 'Siti Rahmawati',
    phone: '+62-21-5725-0002'
  },
  {
    id: '3',
    name: 'Central Park Jakarta',
    name_en: 'Central Park Jakarta Mall',
    status: 'active',
    address: 'Jl. Letjen S. Parman Kav. 28, Tanjung Duren, Jakarta Barat',
    area: 320000,
    manager: 'Ahmad Wijaya',
    phone: '+62-21-2920-0003'
  },
  {
    id: '4',
    name: 'Pondok Indah Mall',
    name_en: 'Pondok Indah Mall (PIM)',
    status: 'active',
    address: 'Jl. Metro Pondok Indah, Pondok Pinang, Kebayoran Lama, Jakarta Selatan',
    area: 150000,
    manager: 'Dewi Lestari',
    phone: '+62-21-7593-0004'
  }
])

const showAddDialog = ref(false)
const editingProject = ref(null)

const projectForm = ref({
  id: '',
  name: '',
  name_en: '',
  status: 'active',
  address: '',
  area: 10000,
  manager: '',
  phone: ''
})

function resetForm() {
  editingProject.value = null
  projectForm.value = {
    id: '',
    name: '',
    name_en: '',
    status: 'active',
    address: '',
    area: 10000,
    manager: '',
    phone: ''
  }
}

function editProject(project) {
  editingProject.value = project
  projectForm.value = { ...project }
  showAddDialog.value = true
}

function viewProject(project) {
  ElMessage.info(isCN.value ? `查看项目: ${project.name}` : `Viewing project: ${project.name_en}`)
}

function saveProject() {
  if (!projectForm.value.id || !projectForm.value.name) {
    ElMessage.warning(isCN.value ? '请填写必填项' : 'Please fill in required fields')
    return
  }

  if (editingProject.value) {
    const index = projects.value.findIndex(p => p.id === editingProject.value.id)
    if (index !== -1) {
      projects.value[index] = { ...projectForm.value }
    }
    ElMessage.success(isCN.value ? '项目已更新' : 'Project updated')
  } else {
    if (projects.value.find(p => p.id === projectForm.value.id)) {
      ElMessage.error(isCN.value ? '项目ID已存在' : 'Project ID already exists')
      return
    }
    projects.value.push({ ...projectForm.value })
    ElMessage.success(isCN.value ? '项目已添加' : 'Project added')
  }

  showAddDialog.value = false
  resetForm()
}

async function deleteProject(projectId) {
  try {
    await ElMessageBox.confirm(
      isCN.value ? '确定要删除此项目吗？' : 'Are you sure to delete this project?',
      isCN.value ? '确认删除' : 'Confirm Delete',
      {
        confirmButtonText: isCN.value ? '确定' : 'Confirm',
        cancelButtonText: isCN.value ? '取消' : 'Cancel',
        type: 'warning'
      }
    )

    projects.value = projects.value.filter(p => p.id !== projectId)
    ElMessage.success(isCN.value ? '项目已删除' : 'Project deleted')
  } catch {
    // User cancelled
  }
}
</script>

<style scoped>
.project-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #1a6dbb 0%, #2a8ae0 100%);
  border-radius: 16px;
  color: white;
}

.header-title h1 {
  font-size: 26px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.project-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.project-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.project-id {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.info-row i {
  color: #409eff;
  font-size: 16px;
  width: 20px;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  background: #f5f7fa;
}

.card-footer .el-button {
  flex: 1;
}

.project-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}

@media (max-width: 768px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .card-footer {
    flex-wrap: wrap;
  }
  
  .card-footer .el-button {
    min-width: calc(33.33% - 5.33px);
  }
}
</style>
