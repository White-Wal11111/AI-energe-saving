<template>
  <div class="portal-admin">
    <div class="page-header">
      <h2>{{ isCN ? '公司门户管理' : 'Portal Management' }}</h2>
      <p>{{ isCN ? '配置公司门户页面展示内容' : 'Configure company portal page content' }}</p>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <!-- 基本信息 -->
      <el-tab-pane :label="isCN ? '基本信息' : 'Basic Info'" name="basic">
        <el-form :model="form" label-width="140px" label-position="top">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item :label="isCN ? '公司名称（中文）' : 'Company Name (CN)'">
                <el-input v-model="form.company_name" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="isCN ? '公司名称（英文）' : 'Company Name (EN)'">
                <el-input v-model="form.company_name_en" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item :label="isCN ? '标语（中文）' : 'Tagline (CN)'">
                <el-input v-model="form.tagline" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="isCN ? '标语（英文）' : 'Tagline (EN)'">
                <el-input v-model="form.tagline_en" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item :label="isCN ? '公司简介（中文）' : 'About (CN)'">
                <el-input v-model="form.about" type="textarea" :rows="4" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="isCN ? '公司简介（英文）' : 'About (EN)'">
                <el-input v-model="form.about_en" type="textarea" :rows="4" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item :label="isCN ? '地址（中文）' : 'Address (CN)'">
                <el-input v-model="form.address" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="isCN ? '地址（英文）' : 'Address (EN)'">
                <el-input v-model="form.address_en" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item :label="isCN ? '电话' : 'Phone'">
                <el-input v-model="form.phone" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="isCN ? '邮箱' : 'Email'">
                <el-input v-model="form.email" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="isCN ? '官网' : 'Website'">
                <el-input v-model="form.website" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item :label="isCN ? '公司Logo' : 'Company Logo'">
                <div class="img-upload-wrapper" v-if="form.logo_url">
                  <div class="img-upload-box">
                    <img :src="form.logo_url" alt="Logo" />
                  </div>
                  <el-button size="small" type="danger" circle class="img-delete-btn" @click="removeImage('logo_url')">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <el-upload v-else action="" :auto-upload="false" :show-file-list="false" accept="image/*"
                  :on-change="(file: any) => handleImageChange('logo_url', file)">
                  <div class="img-upload-box img-placeholder">
                    <el-icon :size="32"><Plus /></el-icon>
                    <span>{{ isCN ? '上传Logo' : 'Upload Logo' }}</span>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="isCN ? '合作/联盟 Logo' : 'Partner / Alliance Logo'">
                <div class="img-upload-wrapper" v-if="form.logo_url_2">
                  <div class="img-upload-box">
                    <img :src="form.logo_url_2" alt="Partner Logo" />
                  </div>
                  <el-button size="small" type="danger" circle class="img-delete-btn" @click="removeImage('logo_url_2')">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <el-upload v-else action="" :auto-upload="false" :show-file-list="false" accept="image/*"
                  :on-change="(file: any) => handleImageChange('logo_url_2', file)">
                  <div class="img-upload-box img-placeholder">
                    <el-icon :size="32"><Plus /></el-icon>
                    <span>{{ isCN ? '上传Logo 2' : 'Upload Logo 2' }}</span>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="isCN ? 'Banner背景图' : 'Banner Image'">
                <div class="img-upload-wrapper" v-if="form.banner_url">
                  <div class="img-upload-box banner-preview">
                    <img :src="form.banner_url" alt="Banner" />
                  </div>
                  <el-button size="small" type="danger" circle class="img-delete-btn" @click="removeImage('banner_url')">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <el-upload v-else action="" :auto-upload="false" :show-file-list="false" accept="image/*"
                  :on-change="(file: any) => handleImageChange('banner_url', file)">
                  <div class="img-upload-box img-placeholder banner-preview">
                    <el-icon :size="32"><Plus /></el-icon>
                    <span>{{ isCN ? '上传Banner' : 'Upload Banner' }}</span>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item :label="isCN ? 'Banner Logo (左上角)' : 'Banner Logo (Top Left)'">
                <div class="img-upload-wrapper" v-if="form.banner_logo_url">
                  <div class="img-upload-box" style="width:200px;height:80px;">
                    <img :src="form.banner_logo_url" alt="Banner Logo" />
                  </div>
                  <el-button size="small" type="danger" circle class="img-delete-btn" @click="removeImage('banner_logo_url')">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <el-upload v-else action="" :auto-upload="false" :show-file-list="false" accept="image/*"
                  :on-change="(file: any) => handleImageChange('banner_logo_url', file)">
                  <div class="img-upload-box img-placeholder" style="width:200px;height:80px;">
                    <el-icon :size="32"><Plus /></el-icon>
                    <span>{{ isCN ? '上传Banner Logo' : 'Upload Banner Logo' }}</span>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <!-- 产品管理 -->
      <el-tab-pane :label="isCN ? '产品管理' : 'Products'" name="products">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addProduct">
            <el-icon><Plus /></el-icon> {{ isCN ? '添加产品' : 'Add Product' }}
          </el-button>
        </div>
        <el-table :data="form.products" border stripe>
          <el-table-column :label="isCN ? '图标' : 'Icon'" width="80" align="center">
            <template #default="{ row }">
              <el-select v-model="row.icon" size="small" style="width: 70px">
                <el-option v-for="ic in productIcons" :key="ic" :label="ic" :value="ic" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '名称（中）' : 'Title (CN)'" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.title" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '名称（英）' : 'Title (EN)'" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.title_en" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '描述（中）' : 'Desc (CN)'" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.desc" type="textarea" size="small" :rows="2" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '描述（英）' : 'Desc (EN)'" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.desc_en" type="textarea" size="small" :rows="2" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '方案文件' : 'Solution File'" width="160" align="center">
            <template #default="{ row }">
              <el-upload
                v-if="!row.solution_file"
                action=""
                :auto-upload="false"
                :show-file-list="false"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
                :on-change="(file: any) => handleSolutionFileChange(row, file)"
              >
                <el-button size="small" link type="primary">
                  {{ isCN ? '上传' : 'Upload' }}
                </el-button>
              </el-upload>
              <template v-else>
                <span class="solution-filename">{{ getFileName(row.solution_file) }}</span>
                <el-button size="small" link type="danger" style="margin-left:4px" @click="removeRowFile(row, 'solution_file')">
                  {{ isCN ? '删除' : 'Delete' }}
                </el-button>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '图片' : 'Image'" width="120" align="center">
            <template #default="{ row }">
              <el-upload
                v-if="!row.image"
                action=""
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="(file: any) => handleItemImageChange(row, file)"
              >
                <el-button size="small" link type="primary">
                  {{ isCN ? '上传' : 'Upload' }}
                </el-button>
              </el-upload>
              <template v-else>
                <el-button size="small" link type="primary" @click="previewRowImage(row.image)">
                  {{ isCN ? '查看' : 'View' }}
                </el-button>
                <el-button size="small" link type="danger" @click="removeRowFile(row, 'image')">
                  {{ isCN ? '删除' : 'Delete' }}
                </el-button>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '操作' : 'Action'" width="80" align="center">
            <template #default="{ $index }">
              <el-button size="small" type="danger" link @click="form.products.splice($index, 1)">
                {{ isCN ? '删除' : 'Delete' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 解决方案管理 -->
      <el-tab-pane :label="isCN ? '解决方案' : 'Solutions'" name="solutions">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addSolution">
            <el-icon><Plus /></el-icon> {{ isCN ? '添加方案' : 'Add Solution' }}
          </el-button>
        </div>
        <el-table :data="form.solutions" border stripe>
          <el-table-column :label="isCN ? '名称（中）' : 'Title (CN)'" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.title" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '名称（英）' : 'Title (EN)'" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.title_en" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '描述（中）' : 'Desc (CN)'" min-width="220">
            <template #default="{ row }">
              <el-input v-model="row.desc" type="textarea" size="small" :rows="2" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '描述（英）' : 'Desc (EN)'" min-width="220">
            <template #default="{ row }">
              <el-input v-model="row.desc_en" type="textarea" size="small" :rows="2" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '图片' : 'Image'" width="120" align="center">
            <template #default="{ row }">
              <el-upload
                v-if="!row.image"
                action=""
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="(file: any) => handleItemImageChange(row, file)"
              >
                <el-button size="small" link type="primary">
                  {{ isCN ? '上传' : 'Upload' }}
                </el-button>
              </el-upload>
              <template v-else>
                <el-button size="small" link type="primary" @click="previewRowImage(row.image)">
                  {{ isCN ? '查看' : 'View' }}
                </el-button>
                <el-button size="small" link type="danger" @click="removeRowFile(row, 'image')">
                  {{ isCN ? '删除' : 'Delete' }}
                </el-button>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '操作' : 'Action'" width="80" align="center">
            <template #default="{ $index }">
              <el-button size="small" type="danger" link @click="form.solutions.splice($index, 1)">
                {{ isCN ? '删除' : 'Delete' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 数据统计管理 -->
      <el-tab-pane :label="isCN ? '数据统计' : 'Statistics'" name="stats">
        <div class="tab-toolbar">
          <el-button type="primary" @click="addStat">
            <el-icon><Plus /></el-icon> {{ isCN ? '添加统计项' : 'Add Stat' }}
          </el-button>
        </div>
        <el-table :data="form.stats" border stripe>
          <el-table-column :label="isCN ? '标签（中）' : 'Label (CN)'" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.label" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '标签（英）' : 'Label (EN)'" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.label_en" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '数值' : 'Value'" width="120">
            <template #default="{ row }">
              <el-input v-model="row.value" size="small" />
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '图标' : 'Icon'" width="120">
            <template #default="{ row }">
              <el-select v-model="row.icon" size="small" style="width: 110px">
                <el-option v-for="ic in productIcons" :key="ic" :label="ic" :value="ic" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="isCN ? '操作' : 'Action'" width="80" align="center">
            <template #default="{ $index }">
              <el-button size="small" type="danger" link @click="form.stats.splice($index, 1)">
                {{ isCN ? '删除' : 'Delete' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 上传进度条 -->
    <div class="upload-progress-area" v-if="uploadProgressList.length > 0">
      <div class="upload-progress-header">
        <span>{{ isCN ? '文件上传' : 'File Upload' }}</span>
        <el-tag v-if="uploadProgressList.some(p => p.status === 'uploading')" type="warning" size="small">
          {{ isCN ? '上传中...' : 'Uploading...' }}
        </el-tag>
      </div>
      <div class="upload-progress-list">
        <div v-for="(item, idx) in uploadProgressList" :key="idx" class="upload-progress-item"
             :class="{ 'is-success': item.status === 'success', 'is-error': item.status === 'error' }">
          <div class="progress-info">
            <span class="file-name">{{ item.fileName }}</span>
            <span class="progress-percent">{{ item.progress }}%</span>
          </div>
          <el-progress
            :percentage="item.progress"
            :status="item.status === 'error' ? 'exception' : (item.status === 'success' ? 'success' : '')"
            :stroke-width="8"
            :show-text="false"
          />
          <span class="status-text" v-if="item.status === 'success'">{{ isCN ? '完成 - 请点击保存' : 'Done - Click Save' }}</span>
          <span class="status-text error" v-else-if="item.status === 'error'">{{ isCN ? '失败' : 'Failed' }}</span>
          <span class="status-text uploading" v-else>{{ isCN ? '上传中...' : 'Uploading...' }}</span>
        </div>
      </div>
    </div>

    <!-- 保存栏 -->
    <div class="save-bar">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave()"
                 :disabled="uploadProgressList.some(p => p.status === 'uploading')">
        {{ saving ? (isCN ? '保存中...' : 'Saving...') : saveResult || (isCN ? '保存配置' : 'Save Configuration') }}
      </el-button>
      <el-button size="large" @click="previewPortal">
        {{ isCN ? '预览门户' : 'Preview Portal' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Plus, Close } from '@element-plus/icons-vue'
import axios from 'axios'

const isCN = inject<any>('isCN')
const activeTab = ref('basic')
const saving = ref(false)
const saveResult = ref('')

// 上传进度管理
interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
}
const uploadProgressList = ref<UploadProgress[]>([])

const productIcons = ['Monitor', 'Cpu', 'DataLine', 'Operation', 'TrendCharts', 'OfficeBuilding', 'Setting', 'Location']

const defaultForm = {
  company_name: 'REII AUTOMATION',
  company_name_en: 'REII AUTOMATION',
  tagline: '智能楼宇，节能未来',
  tagline_en: 'Smart Building, Energy Future',
  about: '',
  about_en: '',
  address: '',
  address_en: '',
  phone: '',
  email: '',
  website: '',
  logo_url: '/logo.png',
  logo_url_2: '',
  banner_url: '',
  banner_logo_url: '',
  products: [] as any[],
  solutions: [] as any[],
  stats: [] as any[]
}

const form = ref({ ...defaultForm })

function getHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function loadPortal() {
  try {
    const res = await axios.get('/api/portal')
    if (res.data?.success && res.data.data) {
      form.value = { ...defaultForm, ...res.data.data }
    }
  } catch (e) {
    console.warn('Load portal failed:', e)
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// 通用文件上传：上传到后端磁盘，返回 URL 路径（带进度条）
async function uploadFileToServer(fileRaw: File, progressId?: string): Promise<string> {
  // 添加进度记录
  const pid = progressId || `upload_${Date.now()}`
  const progressItem: UploadProgress = {
    fileName: fileRaw.name,
    progress: 0,
    status: 'uploading'
  }
  uploadProgressList.value.push(progressItem)

  const formData = new FormData()
  formData.append('file', fileRaw)
  
  try {
    const res = await axios.post('/api/portal/upload', formData, {
      headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          progressItem.progress = Math.min(percent, 99) // 最大显示99%，100%等服务器响应
        }
      }
    })
    
    if (res.data?.success && res.data.url) {
      progressItem.progress = 100
      progressItem.status = 'success'
      // 3秒后移除进度条
      setTimeout(() => {
        const idx = uploadProgressList.value.indexOf(progressItem)
        if (idx > -1) uploadProgressList.value.splice(idx, 1)
      }, 3000)
      return res.data.url
    }
    throw new Error(res.data?.error || 'Upload failed')
  } catch (e: any) {
    progressItem.status = 'error'
    throw e
  }
}

async function handleImageChange(key: string, file: any) {
  if (!file?.raw) return
  if (file.raw.size > MAX_FILE_SIZE) {
    ElMessage.warning(isCN.value ? '文件过大，请选择小于 50MB 的图片' : 'Image too large, please select under 50MB')
    return
  }
  try {
    const url = await uploadFileToServer(file.raw, `img_${key}`)
    ;(form.value as any)[key] = url
    ElMessage.success(isCN.value ? '图片上传成功，请点击保存' : 'Image uploaded, please click Save')
  } catch (e) {
    ElMessage.error(isCN.value ? '图片上传失败' : 'Image upload failed')
    console.error('Upload error:', e)
  }
}

async function handleItemImageChange(row: any, file: any) {
  if (!file?.raw) return
  if (file.raw.size > MAX_FILE_SIZE) {
    ElMessage.warning(isCN.value ? '文件过大' : 'File too large')
    return
  }
  try {
    const url = await uploadFileToServer(file.raw, `rowimg_${row.id}`)
    row.image = url
    ElMessage.success(isCN.value ? '图片上传成功，请点击保存' : 'Image uploaded, please click Save')
  } catch (e) {
    ElMessage.error(isCN.value ? '图片上传失败' : 'Image upload failed')
    console.error('Upload error:', e)
  }
}

async function handleSolutionFileChange(row: any, file: any) {
  if (!file?.raw) return
  if (file.raw.size > MAX_FILE_SIZE) {
    ElMessage.warning(isCN.value ? '文件过大，请选择小于 50MB 的文件' : 'File too large, please select under 50MB')
    return
  }
  try {
    const url = await uploadFileToServer(file.raw, `solution_${row.id}`)
    row.solution_file = url
    ElMessage.success(isCN.value ? '方案文件上传成功，请点击保存' : 'Solution uploaded, please click Save')
  } catch (e) {
    ElMessage.error(isCN.value ? '方案文件上传失败' : 'Solution upload failed')
    console.error('Upload error:', e)
  }
}

function getFileName(url: string): string {
  if (!url) return ''
  return url.split('/').pop() || 'file'
}

// 删除基本信息中的图片（logo、banner 等）
async function removeImage(key: string) {
  const oldUrl = (form.value as any)[key]
  if (oldUrl && oldUrl.startsWith('/uploads/')) {
    try { await axios.delete('/api/portal/upload', { data: { url: oldUrl }, headers: getHeaders() }) } catch {}
  }
  ;(form.value as any)[key] = ''
  await handleSave(true)
  ElMessage.success(isCN.value ? '已删除' : 'Deleted')
}

// 删除产品/方案行中的文件（image 或 solution_file）
async function removeRowFile(row: any, field: string) {
  const oldUrl = row[field]
  if (oldUrl && oldUrl.startsWith('/uploads/')) {
    try { await axios.delete('/api/portal/upload', { data: { url: oldUrl }, headers: getHeaders() }) } catch {}
  }
  row[field] = ''
  await handleSave(true)
  ElMessage.success(isCN.value ? '已删除' : 'Deleted')
}

// 预览行内图片
function previewRowImage(url: string) {
  window.open(url, '_blank')
}

function addProduct() {
  form.value.products.push({
    id: `p${Date.now()}`,
    icon: 'Monitor',
    title: '',
    title_en: '',
    desc: '',
    desc_en: '',
    image: '',
    solution_file: ''
  })
}

function addSolution() {
  form.value.solutions.push({
    id: `s${Date.now()}`,
    title: '',
    title_en: '',
    desc: '',
    desc_en: '',
    image: ''
  })
}

function addStat() {
  form.value.stats.push({
    label: '',
    label_en: '',
    value: '',
    icon: 'Monitor'
  })
}

// localStorage 缓存 key
const PORTAL_CACHE_KEY = 'portal_config_cache'

// 保存到 localStorage（供门户页面离线读取）
function saveToLocalCache(data: any) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(PORTAL_CACHE_KEY, JSON.stringify(cacheData))
  } catch {}
}

async function handleSave(silent = false) {
  if (saving.value) return
  saving.value = true
  saveResult.value = ''
  
  // 先保存到本地缓存（确保即使 API 失败也能在门户页面看到）
  saveToLocalCache(form.value)
  
  try {
    const res = await axios.put('/api/portal', form.value, { headers: getHeaders() })
    if (res.data?.success) {
      // API 成功后再次更新缓存
      saveToLocalCache(res.data.data || form.value)
      saveResult.value = isCN.value ? '✅ 保存成功' : '✅ Saved'
      if (!silent) {
        ElNotification({ title: '保存成功', message: '门户配置已成功保存', type: 'success', duration: 3000 })
      }
    } else {
      saveResult.value = isCN.value ? '❌ 保存失败' : '❌ Failed'
      if (!silent) {
        ElNotification({ title: '保存失败', message: res.data?.error || '未知错误', type: 'error', duration: 4000 })
      }
    }
  } catch (e: any) {
    const msg = e?.response?.status === 401 || e?.response?.status === 403
      ? '登录已过期，请重新登录'
      : e?.response?.status === 413
        ? '文件太大，请压缩后重试'
        : e?.code === 'ERR_NETWORK'
          ? '网络错误，请检查后端是否启动'
          : (e?.response?.data?.error || e?.message || '保存失败')
    saveResult.value = '❌ ' + msg
    if (!silent) {
      ElNotification({ title: '保存失败', message: msg, type: 'error', duration: 5000 })
    }
  } finally {
    saving.value = false
    // 3秒后恢复按钮文字
    setTimeout(() => { saveResult.value = '' }, 3000)
  }
}

function previewPortal() {
  window.open('/portal', '_blank')
}

onMounted(() => {
  loadPortal()
})
</script>

<style scoped>
.portal-admin {
  max-width: 1200px;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #303133;
}
.page-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}
.tab-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.img-upload-box {
  width: 200px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-upload-box:hover {
  border-color: #409eff;
}
.img-upload-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.img-placeholder {
  flex-direction: column;
  gap: 8px;
  color: #c0c4cc;
  font-size: 13px;
}
.banner-preview {
  width: 320px;
  height: 120px;
}
.banner-preview img {
  object-fit: cover;
}
.save-bar {
  margin-top: 24px;
  padding: 16px 0;
  display: flex;
  gap: 12px;
  border-top: 1px solid #ebeef5;
}
.solution-filename {
  display: block;
  font-size: 11px;
  color: #67c23a;
  margin-top: 2px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.img-upload-wrapper {
  position: relative;
  display: inline-block;
}
.img-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

/* 上传进度条样式 */
.upload-progress-area {
  margin-top: 20px;
  padding: 16px 20px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}
.upload-progress-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}
.upload-progress-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.upload-progress-item {
  padding: 10px 14px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}
.upload-progress-item.is-success {
  border-color: #67c23a;
  background: #f0f9eb;
}
.upload-progress-item.is-error {
  border-color: #f56c6c;
  background: #fef0f0;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.file-name {
  font-size: 13px;
  color: #606266;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.progress-percent {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
}
.status-text {
  display: block;
  font-size: 12px;
  margin-top: 4px;
  color: #909399;
}
.status-text.success {
  color: #67c23a;
}
.status-text.error {
  color: #f56c6c;
}
.status-text.uploading {
  color: #e6a23c;
}
</style>
