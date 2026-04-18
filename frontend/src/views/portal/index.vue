<template>
  <div class="portal-page">
    <!-- 导航栏 -->
    <nav class="portal-nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <!-- 小 Logo 图标 + 公司名称 -->
          <img :src="data.logo_url || '/logo.png'" alt="Logo" class="nav-icon-logo" />
          <span class="nav-title">{{ data.company_name }}</span>
        </div>
        <div class="nav-links">
          <a href="#products">{{ t('产品', 'Products', 'Produk') }}</a>
          <a href="#solutions">{{ t('解决方案', 'Solutions', 'Solusi') }}</a>
          <a href="#about">{{ t('关于我们', 'About', 'Tentang') }}</a>
          <a href="#contact">{{ t('联系我们', 'Contact', 'Kontak') }}</a>
          <el-dropdown trigger="click" @command="switchLang" class="lang-dropdown">
            <span class="lang-trigger">
              <el-icon><Promotion /></el-icon>
              {{ langLabel }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="zh" :class="{ 'is-active': lang === 'zh' }">中文</el-dropdown-item>
                <el-dropdown-item command="en" :class="{ 'is-active': lang === 'en' }">English</el-dropdown-item>
                <el-dropdown-item command="id" :class="{ 'is-active': lang === 'id' }">Bahasa Indonesia</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="primary" size="small" @click="$router.push('/login')">
            {{ t('管理平台', 'Platform', 'Platform') }}
          </el-button>
        </div>
      </div>
    </nav>

    <!-- Banner -->
    <section class="portal-banner" :style="bannerStyle">
      <div class="banner-overlay"></div>
      <!-- Banner Logo 位 -->
      <div v-if="data.banner_logo_url" class="banner-logo-wrap">
        <img :src="data.banner_logo_url" alt="Banner Logo" class="banner-logo-img" />
      </div>
      <div class="banner-content">
        <h1>{{ data.company_name }}</h1>
        <p class="banner-tagline">{{ pick(data.tagline, data.tagline_en, data.tagline_id) }}</p>
        <div class="banner-actions">
          <el-button type="primary" size="large" round @click="scrollTo('#products')">
            {{ t('了解产品', 'Explore Products', 'Jelajahi Produk') }}
          </el-button>
          <el-button size="large" round @click="scrollTo('#contact')">
            {{ t('联系我们', 'Contact Us', 'Hubungi Kami') }}
          </el-button>
        </div>
      </div>
    </section>

    <!-- 数据统计 -->
    <section class="portal-stats">
      <div class="stats-inner">
        <div v-for="stat in data.stats" :key="stat.label" class="stat-item">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ pick(stat.label, stat.label_en, stat.label_id) }}</div>
        </div>
      </div>
    </section>

    <!-- 产品介绍 -->
    <section id="products" class="portal-section">
      <div class="section-inner">
        <h2 class="section-title">{{ t('核心产品', 'Core Products', 'Produk Utama') }}</h2>
        <p class="section-subtitle">{{ t('AI 驱动的智能楼宇节能产品矩阵', 'AI-Driven Smart Building Energy Product Suite', 'Rangkaian Produk Energi Cerdas Berbasis AI untuk Bangunan') }}</p>
        <div class="products-grid">
          <div v-for="product in data.products" :key="product.id" class="product-card" @click="openProductDetail(product)">
            <div class="product-img-wrap" v-if="product.image">
              <img :src="product.image" :alt="pick(product.title, product.title_en, product.title_id)" />
            </div>
            <div class="product-img-wrap product-icon-wrap" v-else>
              <el-icon :size="48"><component :is="iconMap[product.icon] || Monitor" /></el-icon>
            </div>
            <h3>{{ pick(product.title, product.title_en, product.title_id) }}</h3>
            <p>{{ pick(product.desc, product.desc_en, product.desc_id) }}</p>
            <el-button type="primary" size="small" round class="product-btn">
              {{ t('查看详情', 'View Details', 'Lihat Detail') }}
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 解决方案 -->
    <section id="solutions" class="portal-section section-alt">
      <div class="section-inner">
        <h2 class="section-title">{{ t('解决方案', 'Solutions', 'Solusi') }}</h2>
        <p class="section-subtitle">{{ t('覆盖多种业态的节能运营方案', 'Energy-saving operation solutions for various industries', 'Solusi operasi hemat energi untuk berbagai industri') }}</p>
        <div class="solutions-grid">
          <div v-for="sol in data.solutions" :key="sol.id" class="solution-card">
            <img v-if="sol.image" :src="sol.image" :alt="pick(sol.title, sol.title_en, sol.title_id)" class="solution-img" />
            <div class="solution-body">
              <h3>{{ pick(sol.title, sol.title_en, sol.title_id) }}</h3>
              <p>{{ pick(sol.desc, sol.desc_en, sol.desc_id) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 关于我们 -->
    <section id="about" class="portal-section">
      <div class="section-inner">
        <h2 class="section-title">{{ t('关于我们', 'About Us', 'Tentang Kami') }}</h2>
        <div class="about-content">
          <p>{{ pick(data.about, data.about_en, data.about_id) }}</p>
        </div>
      </div>
    </section>

    <!-- 联系我们 -->
    <section id="contact" class="portal-section section-alt">
      <div class="section-inner">
        <h2 class="section-title">{{ t('联系我们', 'Contact Us', 'Hubungi Kami') }}</h2>
        <div class="contact-grid">
          <div class="contact-item">
            <el-icon :size="28"><Location /></el-icon>
            <div>
              <h4>{{ t('公司地址', 'Address', 'Alamat') }}</h4>
              <p>{{ pick(data.address, data.address_en, data.address_id) }}</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon :size="28"><Phone /></el-icon>
            <div>
              <h4>{{ t('电话', 'Phone', 'Telepon') }}</h4>
              <p>{{ data.phone }}</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon :size="28"><Message /></el-icon>
            <div>
              <h4>{{ t('邮箱', 'Email', 'Email') }}</h4>
              <p>{{ data.email }}</p>
            </div>
          </div>
          <div class="contact-item">
            <el-icon :size="28"><Link /></el-icon>
            <div>
              <h4>{{ t('官网', 'Website', 'Website') }}</h4>
              <p><a :href="data.website" target="_blank">{{ data.website }}</a></p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="portal-footer">
      <p>&copy; {{ new Date().getFullYear() }} {{ data.company_name }}. {{ t('版权所有', 'All Rights Reserved.', 'Hak Cipta Dilindungi.') }}</p>
    </footer>

    <!-- 产品方案预览弹窗 -->
    <el-dialog
      v-model="detailVisible"
      :title="currentProduct ? pick(currentProduct.title, currentProduct.title_en, currentProduct.title_id) : ''"
      :width="detailFullscreen ? '100vw' : '720px'"
      :fullscreen="detailFullscreen"
      :close-on-click-modal="true"
      class="product-detail-dialog"
      :class="{ 'is-fullscreen': detailFullscreen }"
    >
      <template #header="{ close }">
        <div class="dialog-header">
          <span class="dialog-title">{{ currentProduct ? pick(currentProduct.title, currentProduct.title_en, currentProduct.title_id) : '' }}</span>
          <div class="dialog-header-actions">
            <el-button :icon="detailFullscreen ? 'Crop' : 'FullScreen'" circle size="small" @click="detailFullscreen = !detailFullscreen" />
            <el-button icon="Close" circle size="small" @click="close" />
          </div>
        </div>
      </template>
      <div v-if="currentProduct" class="detail-body">
        <div class="detail-desc">
          <p>{{ pick(currentProduct.desc, currentProduct.desc_en, currentProduct.desc_id) }}</p>
        </div>
        <!-- 图片/文档预览区 -->
        <div v-if="currentProduct.solution_file" class="solution-preview">
          <template v-if="isPdfFile(currentProduct.solution_file)">
            <iframe :src="currentProduct.solution_file" class="pdf-iframe" frameborder="0"></iframe>
          </template>
          <template v-else>
            <img :src="currentProduct.solution_file" alt="Solution" class="solution-img-preview" />
          </template>
        </div>
        <el-empty v-else :description="t('暂无方案文件', 'No solution file available', 'Belum ada file solusi')" />
        <div class="detail-actions" v-if="currentProduct.solution_file">
          <el-button type="primary" @click="downloadSolution(currentProduct)">
            <el-icon><Download /></el-icon> {{ t('下载方案', 'Download Solution', 'Unduh Solusi') }}
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { Monitor, Location, Phone, Message, Link, Cpu, DataLine, Operation, TrendCharts, OfficeBuilding, Promotion, Download } from '@element-plus/icons-vue'

const router = useRouter()
const lang = ref(localStorage.getItem('portalLang') || 'id')

const iconMap: Record<string, any> = { Monitor, Cpu, DataLine, Operation, TrendCharts, OfficeBuilding }

// 三语辅助函数
function t(zh: string, en: string, id: string): string {
  if (lang.value === 'en') return en
  if (lang.value === 'id') return id
  return zh
}

function pick(zhVal: string, enVal: string, idVal?: string): string {
  if (lang.value === 'en') return enVal || zhVal
  if (lang.value === 'id') return idVal || enVal || zhVal
  return zhVal
}

const langLabel = computed(() => {
  const map: Record<string, string> = { zh: '中文', en: 'EN', id: 'ID' }
  return map[lang.value] || '中文'
})

function switchLang(cmd: string) {
  lang.value = cmd
  localStorage.setItem('portalLang', cmd)
}

const defaultData = {
  company_name: 'REII AUTOMATION',
  company_name_en: 'REII AUTOMATION',
  company_name_id: 'REII AUTOMATION',
  tagline: '智能楼宇，节能未来',
  tagline_en: 'Smart Building, Energy Future',
  tagline_id: 'Bangunan Cerdas, Masa Depan Hemat Energi',
  about: 'REII AUTOMATION 是一家专注于智能楼宇节能自动化解决方案的高科技企业，致力于通过 AI 驱动的预测算法和物联网技术，为商业建筑提供全方位的能源管理服务。我们的系统覆盖从冷机群控、照明管理到能耗监测的全链路，帮助客户实现 20%-40% 的节能目标。',
  about_en: 'REII AUTOMATION is a high-tech enterprise focused on smart building energy-saving automation solutions. We are committed to providing comprehensive energy management services for commercial buildings through AI-driven predictive algorithms and IoT technology. Our system covers the full chain from chiller group control, lighting management to energy monitoring, helping customers achieve 20%-40% energy savings.',
  about_id: 'REII AUTOMATION adalah perusahaan teknologi tinggi yang berfokus pada solusi otomasi hemat energi untuk bangunan cerdas. Kami berkomitmen menyediakan layanan manajemen energi komprehensif untuk bangunan komersial melalui algoritma prediktif berbasis AI dan teknologi IoT. Sistem kami mencakup seluruh rantai dari kontrol grup chiller, manajemen pencahayaan hingga pemantauan energi, membantu pelanggan mencapa penghematan energi 20%-40%.',
  address: '上海市浦东新区张江高科技园区博云路2号',
  address_en: 'No.2 Boyun Road, Zhangjiang Hi-Tech Park, Pudong, Shanghai',
  address_id: 'No.2 Boyun Road, Zhangjiang Hi-Tech Park, Pudong, Shanghai',
  phone: '+86 21 5080 8888',
  email: 'info@reii-automation.com',
  website: 'https://www.reii-automation.com',
  logo_url: '/logo.png',
  logo_url_2: '',
  banner_url: '',
  banner_logo_url: '',
  products: [
    { id: 'p1', icon: 'TrendCharts', title: 'AI预测节能控制系统', title_en: 'AI Predictive Energy-Saving Control System', title_id: 'Sistem Kontrol Hemat Energi Prediktif AI', desc: '基于 AI 预测算法的智能节能控制系统，精准预测建筑用能趋势，自动优化冷机群控、空调末端及照明策略，综合节能率达 20%-40%', desc_en: 'AI prediction-based intelligent energy-saving control system that accurately forecasts building energy trends and auto-optimizes chiller group control, HVAC terminals and lighting strategies, achieving 20%-40% energy savings', desc_id: 'Sistem kontrol hemat energi cerdas berbasis prediksi AI yang secara akurat memperkirakan tren energi bangunan dan mengoptimalkan kontrol grup chiller, terminal HVAC dan strategi pencahayaan, mencapai penghematan energi 20%-40%', image: '', solution_file: '' },
    { id: 'p2', icon: 'Cpu', title: 'PHM设备预测性维护系统', title_en: 'PHM Predictive Maintenance System', title_id: 'Sistem Perawatan Prediktif PHM', desc: '基于故障预测与健康管理（PHM）技术，实时监测设备运行状态，提前预警潜在故障，降低非计划停机率 60% 以上', desc_en: 'Based on Prognostics and Health Management (PHM) technology, real-time monitoring of equipment status, early warning of potential faults, reducing unplanned downtime by over 60%', desc_id: 'Berdasarkan teknologi Prognostics dan Health Management (PHM), pemantauan status peralatan secara real-time, peringatan dini potensi kerusakan, mengurangi waktu henti tidak terencana lebih dari 60%', image: '', solution_file: '' },
    { id: 'p3', icon: 'DataLine', title: '矿山选矿实验室', title_en: 'Mining Mineral Processing Laboratory', title_id: 'Laboratorium Pengolahan Mineral Pertambangan', desc: '为矿山企业提供选矿工艺优化与能耗分析服务，通过数据驱动优化磨矿、浮选等关键工序，提升回收率并降低能耗', desc_en: 'Providing mineral processing optimization and energy consumption analysis for mining enterprises, optimizing grinding, flotation and other key processes through data-driven approaches to improve recovery and reduce energy consumption', desc_id: 'Menyediakan optimasi pengolahan mineral dan analisis konsumsi energi untuk perusahaan pertambangan, mengoptimalkan grinding, flotasi dan proses kunci lainnya melalui pendekatan berbasis data untuk meningkatkan pemulihan dan mengurangi konsumsi energi', image: '', solution_file: '' },
    { id: 'p4', icon: 'Operation', title: '微电网光伏解决方案', title_en: 'Microgrid Solar PV Solution', title_id: 'Solusi PV Surya Microgrid', desc: '分布式光伏与储能一体化微电网解决方案，实现自发自用、余电上网，结合 AI 预测优化充放电策略，缩短投资回收期', desc_en: 'Integrated distributed solar PV and energy storage microgrid solution, achieving self-consumption and grid feed-in, combined with AI prediction to optimize charge/discharge strategies and shorten payback period', desc_id: 'Solusi microgrid terintegrasi PV surya terdistribusi dan penyimpanan energi, mewujudkan konsumsi sendiri dan umpan jaringan, dikombinasikan dengan prediksi AI untuk mengoptimalkan strategi pengisian/pengosongan dan memperpendek periode pengembalian', image: '', solution_file: '' }
  ] as any[],
  solutions: [
    { id: 's1', title: '商业综合体节能方案', title_en: 'Commercial Complex Solution', title_id: 'Solusi Kompleks Komersial', desc: '面向大型购物中心和综合体，提供从冷站优化到末端管控的全链路节能方案，平均投资回报期 1.5-2 年', desc_en: 'Full-chain energy-saving solution from chiller station optimization to terminal control for large shopping centers and complexes, with average payback period of 1.5-2 years', desc_id: 'Solusi hemat energi rantai penuh dari optimasi stasiun chiller hingga kontrol terminal untuk pusat perbelanjaan dan kompleks besar, dengan periode pengembalian rata-rata 1,5-2 tahun', image: '' },
    { id: 's2', title: '写字楼智能管控方案', title_en: 'Office Building Smart Control', title_id: 'Kontrol Cerdas Gedung Perkantoran', desc: '结合人数感应与 AI 预测，实现按需供冷供热，在保障舒适度的同时最大化节能', desc_en: 'Combining occupancy sensing with AI prediction for on-demand cooling and heating, maximizing energy savings while ensuring comfort', desc_id: 'Menggabungkan sensor hunian dengan prediksi AI untuk pendinginan dan pemanasan sesuai permintaan, memaksimalkan penghematan energi sambil memastikan kenyamanan', image: '' },
    { id: 's3', title: '工业园区能管方案', title_en: 'Industrial Park Energy Management', title_id: 'Manajemen Energi Taman Industri', desc: '覆盖动力站、生产线和办公区的一体化能源监测与优化，支持多能源介质协同管理', desc_en: 'Integrated energy monitoring and optimization covering power stations, production lines and office areas, supporting collaborative management of multiple energy sources', desc_id: 'Pemantauan dan optimasi energi terintegrasi yang mencakup stasiun daya, lini produksi dan area kantor, mendukung manajemen kolaboratif berbagai sumber energi', image: '' },
    { id: 's4', title: '酒店节能运营方案', title_en: 'Hotel Energy Operation Solution', title_id: 'Solusi Operasi Energi Hotel', desc: '基于客房入住率的动态空调和照明策略，与 PMS 系统联动，实现无人区自动节能', desc_en: 'Dynamic HVAC and lighting strategies based on room occupancy, integrated with PMS system for automatic energy saving in unoccupied areas', desc_id: 'Strategi HVAC dan pencahayaan dinamis berdasarkan hunian kamar, terintegrasi dengan sistem PMS untuk penghematan energi otomatis di area yang tidak ditempati', image: '' }
  ] as any[],
  stats: [
    { label: '服务项目', label_en: 'Projects', label_id: 'Proyek', value: '200+', icon: 'OfficeBuilding' },
    { label: '节能率', label_en: 'Energy Savings', label_id: 'Penghematan Energi', value: '35%', icon: 'TrendCharts' },
    { label: '接入设备', label_en: 'Connected Devices', label_id: 'Perangkat Terhubung', value: '50,000+', icon: 'Cpu' },
    { label: '覆盖城市', label_en: 'Cities', label_id: 'Kota', value: '30+', icon: 'Location' }
  ] as any[]
}

const data = ref({ ...defaultData })

const bannerStyle = computed(() => {
  if (data.value.banner_url) {
    return {
      backgroundImage: `url(${data.value.banner_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)'
  }
})

function scrollTo(selector: string) {
  requestAnimationFrame(() => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
  })
}

onMounted(() => {
  // 确保页面已渲染后再请求数据，避免 getBoundingClientRect 等报错
  nextTick(() => {
    loadPortalData()
  })
})

async function loadPortalData() {
  try {
    const res = await axios.get('/api/portal', { timeout: 10000 })
    if (res.data?.success && res.data.data) {
      data.value = { ...defaultData, ...res.data.data }
    }
  } catch (e: any) {
    console.warn('Portal data fetch failed, using defaults:', e?.message || e)
  }
}

// ── 产品方案预览 & 下载 ──
const detailVisible = ref(false)
const detailFullscreen = ref(false)
const currentProduct = ref<any>(null)

function openProductDetail(product: any) {
  currentProduct.value = product
  detailFullscreen.value = false
  detailVisible.value = true
}

function isPdfFile(url: string): boolean {
  if (!url) return false
  return url.toLowerCase().includes('.pdf') || url.startsWith('data:application/pdf')
}

function downloadSolution(product: any) {
  const url = product.solution_file
  const fileName = `${pick(product.title, product.title_en, product.title_id)}_solution${isPdfFile(url) ? '.pdf' : ''}`
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
.portal-page {
  font-family: 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #303133;
  background: #fff;
  min-width: 100vw;
}

/* ── 导航栏 ── */
.portal-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #ebeef5;
  z-index: 1000;
  display: flex;
  align-items: center;
}
.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 40px;
  padding-right: 30px !important;
  box-sizing: border-box;
  width: 100%;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-icon-logo {
  height: 50px;
  width: 50px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
}
.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  letter-spacing: 0.5px;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 28px !important;
  margin-left: auto !important;
  padding-right: 30px !important;
}
.nav-links :deep(.el-button) {
  margin-right: 0 !important;
}
.nav-links :deep(.el-dropdown) {
  margin-right: 0 !important;
}
.nav-links a {
  font-size: 14px;
  color: #606266;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}
.nav-links a:hover {
  color: #409eff;
}
.lang-dropdown {
  cursor: pointer;
}
.lang-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.lang-trigger:hover {
  color: #409eff;
  background: #f5f7fa;
}

/* ── Banner ── */
.portal-banner {
  margin-top: 64px;
  width: 100%;
  min-height: 520px;
  background-color: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.banner-logo-wrap {
  position: absolute;
  top: 32px;
  left: 40px;
  z-index: 2;
}
.banner-logo-img {
  height: 60px;
  object-fit: contain;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.banner-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(64, 158, 255, 0.15), transparent 60%),
              radial-gradient(ellipse at 70% 50%, rgba(103, 194, 58, 0.1), transparent 50%);
}
.banner-content {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
  padding: 40px 24px;
}
.banner-content h1 {
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 16px;
  letter-spacing: 2px;
}
.banner-tagline {
  font-size: 20px;
  opacity: 0.85;
  margin: 0 0 32px;
  font-weight: 300;
}
.banner-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* ── 数据统计 ── */
.portal-stats {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0;
  width: 100%;
}
.stats-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 0 40px;
}
.stat-item {
  text-align: center;
  padding: 36px 16px;
  border-right: 1px solid #ebeef5;
}
.stat-item:last-child { border-right: none; }
.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #409eff;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 14px;
  color: #909399;
}

/* ── 通用 Section ── */
.portal-section {
  padding: 80px 40px;
}
.section-inner {
}
.section-alt {
  background: #f5f7fa;
}
.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1a1a2e;
}
.section-subtitle {
  text-align: center;
  font-size: 16px;
  color: #909399;
  margin: 0 0 48px;
}

/* ── 产品卡片 ── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  cursor: pointer;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border-color: #d9ecff;
}
.product-img-wrap img {
  width: 100%;
  max-height: 160px;
  object-fit: contain;
  margin-bottom: 16px;
  border-radius: 8px;
}
.product-icon-wrap {
  margin-bottom: 16px;
  color: #409eff;
}
.product-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px;
  color: #303133;
}
.product-card p {
  font-size: 14px;
  color: #606266;
  line-height: 1.7;
  margin: 0;
}
.product-card .product-btn {
  margin-top: 16px;
}

/* ── 解决方案 ── */
.solutions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.solution-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  display: flex;
  transition: all 0.3s ease;
}
.solution-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}
.solution-img {
  width: 200px;
  min-height: 140px;
  object-fit: cover;
  flex-shrink: 0;
}
.solution-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.solution-body h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #303133;
}
.solution-body p {
  font-size: 13px;
  color: #606266;
  line-height: 1.7;
  margin: 0;
}

/* ── 关于我们 ── */
.about-content {
  max-width: 800px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.9;
  color: #606266;
  text-align: center;
}

/* ── 联系我们 ── */
.contact-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
}
.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  color: #409eff;
}
.contact-item h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #303133;
}
.contact-item p {
  font-size: 14px;
  color: #606266;
  margin: 0;
}
.contact-item a {
  color: #409eff;
  text-decoration: none;
}
.contact-item a:hover {
  text-decoration: underline;
}

/* ── 页脚 ── */
.portal-footer {
  background: #1a1a2e;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 24px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .banner-content h1 { font-size: 28px; }
  .stats-inner { grid-template-columns: repeat(2, 1fr); }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .solutions-grid { grid-template-columns: 1fr; }
  .contact-grid { grid-template-columns: 1fr; }
  .nav-links a:not(:last-child) { display: none; }
}

/* ── 产品方案弹窗 ── */
.detail-body {
  text-align: center;
}
.detail-desc p {
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
  text-align: left;
  margin-bottom: 20px;
}
.solution-preview {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  background: #f5f7fa;
}
.pdf-iframe {
  width: 100%;
  height: 500px;
  border: none;
}
.solution-img-preview {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
}
.detail-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}
.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.dialog-header-actions {
  display: flex;
  gap: 4px;
}
.product-detail-dialog.is-fullscreen .pdf-iframe {
  height: calc(100vh - 200px);
}
.product-detail-dialog.is-fullscreen .solution-img-preview {
  max-height: calc(100vh - 200px);
}
</style>
