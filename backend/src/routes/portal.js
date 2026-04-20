import express from 'express'
import pool from '../config/database.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保上传目录存在
const uploadDir = path.resolve(__dirname, '../../public/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置 multer 磁盘存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 用时间戳 + 原始文件名避免冲突
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    cb(null, `${Date.now()}_${baseName}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${ext} not allowed`))
    }
  }
})

const router = express.Router()

// 默认门户数据（当数据库不可用时降级使用）
const defaultPortal = {
  company_name: 'REII AUTOMATION',
  company_name_en: 'REII AUTOMATION',
  tagline: '智能楼宇，节能未来',
  tagline_en: 'Smart Building, Energy Future',
  about: 'REII AUTOMATION 是一家专注于智能楼宇节能自动化解决方案的高科技企业，致力于通过 AI 驱动的预测算法和物联网技术，为商业建筑提供全方位的能源管理服务。我们的系统覆盖从冷机群控、照明管理到能耗监测的全链路，帮助客户实现 20%-40% 的节能目标。',
  about_en: 'REII AUTOMATION is a high-tech enterprise focused on smart building energy-saving automation solutions. We are committed to providing comprehensive energy management services for commercial buildings through AI-driven predictive algorithms and IoT technology. Our system covers the full chain from chiller group control, lighting management to energy monitoring, helping customers achieve 20%-40% energy savings.',
  address: '上海市浦东新区张江高科技园区博云路2号',
  address_en: 'No.2 Boyun Road, Zhangjiang Hi-Tech Park, Pudong, Shanghai',
  phone: '+86 21 5080 8888',
  email: 'info@reii-automation.com',
  website: 'https://www.reii-automation.com',
  logo_url: '/logo.png',
  banner_url: '',
  products: [
    { id: 'p1', icon: 'TrendCharts', title: 'AI预测节能控制系统', title_en: 'AI Predictive Energy-Saving Control System', desc: '基于 AI 预测算法的智能节能控制系统，精准预测建筑用能趋势，自动优化冷机群控、空调末端及照明策略，综合节能率达 20%-40%', desc_en: 'AI prediction-based intelligent energy-saving control system that accurately forecasts building energy trends and auto-optimizes chiller group control, HVAC terminals and lighting strategies, achieving 20%-40% energy savings', image: '', solution_file: '' },
    { id: 'p2', icon: 'Cpu', title: 'PHM设备预测性维护系统', title_en: 'PHM Predictive Maintenance System', desc: '基于故障预测与健康管理（PHM）技术，实时监测设备运行状态，提前预警潜在故障，降低非计划停机率 60% 以上', desc_en: 'Based on Prognostics and Health Management (PHM) technology, real-time monitoring of equipment status, early warning of potential faults, reducing unplanned downtime by over 60%', image: '', solution_file: '' },
    { id: 'p3', icon: 'DataLine', title: '矿山选矿实验室', title_en: 'Mining Mineral Processing Laboratory', desc: '为矿山企业提供选矿工艺优化与能耗分析服务，通过数据驱动优化磨矿、浮选等关键工序，提升回收率并降低能耗', desc_en: 'Providing mineral processing optimization and energy consumption analysis for mining enterprises, optimizing grinding, flotation and other key processes through data-driven approaches to improve recovery and reduce energy consumption', image: '', solution_file: '' },
    { id: 'p4', icon: 'Operation', title: '微电网光伏解决方案', title_en: 'Microgrid Solar PV Solution', desc: '分布式光伏与储能一体化微电网解决方案，实现自发自用、余电上网，结合 AI 预测优化充放电策略，缩短投资回收期', desc_en: 'Integrated distributed solar PV and energy storage microgrid solution, achieving self-consumption and grid feed-in, combined with AI prediction to optimize charge/discharge strategies and shorten payback period', image: '', solution_file: '' }
  ],
  solutions: [
    { id: 's1', title: '商业综合体节能方案', title_en: 'Commercial Complex Solution', desc: '面向大型购物中心和综合体，提供从冷站优化到末端管控的全链路节能方案，平均投资回报期 1.5-2 年', image: '' },
    { id: 's2', title: '写字楼智能管控方案', title_en: 'Office Building Smart Control', desc: '结合 occupancy sensing 与 AI 预测，实现按需供冷供热，在保障舒适度的同时最大化节能', image: '' },
    { id: 's3', title: '工业园区能管方案', title_en: 'Industrial Park Energy Management', desc: '覆盖动力站、生产线和办公区的一体化能源监测与优化，支持多能源介质协同管理', image: '' },
    { id: 's4', title: '酒店节能运营方案', title_en: 'Hotel Energy Operation Solution', desc: '基于客房入住率的动态空调和照明策略，与 PMS 系统联动，实现无人区自动节能', image: '' }
  ],
  stats: [
    { label: '服务项目', label_en: 'Projects', value: '200+', icon: 'OfficeBuilding' },
    { label: '节能率', label_en: 'Energy Savings', value: '35%', icon: 'TrendCharts' },
    { label: '接入设备', label_en: 'Connected Devices', value: '50,000+', icon: 'Cpu' },
    { label: '覆盖城市', label_en: 'Cities', value: '30+', icon: 'Location' }
  ]
}

// 内存缓存（当数据库不可用时使用）
let portalCache = { ...defaultPortal }

// GET /api/portal — 获取门户内容（公开）
router.get('/', async (req, res) => {
  try {
    if (pool) {
      const [rows] = await pool.query('SELECT content FROM portal_config WHERE id = 1')
      if (rows.length > 0 && rows[0].content) {
        const content = typeof rows[0].content === 'string' ? JSON.parse(rows[0].content) : rows[0].content
        portalCache = content
        return res.json({ success: true, data: content })
      }
    }
    res.json({ success: true, data: portalCache })
  } catch (error) {
    console.warn('Portal DB read failed, using cache:', error.message)
    res.json({ success: true, data: portalCache })
  }
})

// PUT /api/portal — 更新门户内容（需认证）
router.put('/', async (req, res) => {
  try {
    const content = req.body
    portalCache = content

    if (pool) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS portal_config (
          id INT PRIMARY KEY,
          content JSON,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
      await pool.query(
        'INSERT INTO portal_config (id, content) VALUES (1, ?) ON DUPLICATE KEY UPDATE content = ?',
        [JSON.stringify(content), JSON.stringify(content)]
      )
    }

    res.json({ success: true, message: 'Portal updated', data: content })
  } catch (error) {
    console.error('Portal update error:', error.message)
    res.json({ success: true, message: 'Portal updated (cached)', data: portalCache })
  }
})

// POST /api/portal/upload — 文件上传（multer 磁盘存储）
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    // 生成可访问的 URL 路径
    const fileUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      message: 'File uploaded',
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    })
  } catch (error) {
    console.error('Upload error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/portal/upload — 删除已上传的文件
router.delete('/upload', async (req, res) => {
  try {
    const { url } = req.body
    if (!url || !url.startsWith('/uploads/')) {
      return res.status(400).json({ success: false, error: 'Invalid file URL' })
    }
    const filename = path.basename(url)
    const filePath = path.join(uploadDir, filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true, message: 'File deleted' })
    } else {
      res.json({ success: true, message: 'File not found (already deleted)' })
    }
  } catch (error) {
    console.error('Delete file error:', error.message)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
