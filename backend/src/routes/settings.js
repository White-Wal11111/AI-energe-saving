import express from 'express'
const router = express.Router()

// 默认设置
let settings = {
  language: 'zh-CN',
  theme: 'dark',
  apiKey: '',
  serverUrl: 'http://localhost:4000',
  refreshInterval: 10000
}

// 获取设置
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: settings
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// 更新设置
router.put('/', async (req, res) => {
  try {
    const newSettings = req.body
    settings = { ...settings, ...newSettings }

    res.json({
      success: true,
      message: 'Settings updated',
      data: settings
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
