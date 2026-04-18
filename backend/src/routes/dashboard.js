import express from 'express'
const router = express.Router()

// 模拟数据
const mockSummary = {
  totalDevices: 12,
  activeDevices: 8,
  totalEnergy: 1256.8,
  energyChange: -5.2,
  alerts: 3,
  parking: {
    total: 200,
    available: 45
  }
}

// 获取仪表盘概览
router.get('/summary', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockSummary
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
