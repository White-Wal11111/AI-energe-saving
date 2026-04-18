import express from 'express'
const router = express.Router()
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'smart-building-secret-key-2026'
const JWT_EXPIRES_IN = '24h'

// Mock用户数据 - SaaS多租户
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    name_en: 'Administrator',
    email: 'admin@smartbuilding.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    lastLogin: '2026-04-17T08:30:00Z',
    tenantId: 'admin',
    projects: [
      { id: 'all', name: '所有项目', name_en: 'All Projects' },
      { id: '1', name: 'Grand Indonesia', name_en: 'Grand Indonesia Mall' },
      { id: '2', name: 'Plaza Senayan', name_en: 'Plaza Senayan' },
      { id: '3', name: 'Central Park Jakarta', name_en: 'Central Park Jakarta Mall' },
      { id: '4', name: 'Pondok Indah Mall', name_en: 'PIM' }
    ]
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    name: 'Budi Santoso',
    name_en: 'Budi Santoso',
    email: 'budi@grandindonesia.co.id',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=budi',
    lastLogin: '2026-04-17T14:20:00Z',
    tenantId: '1',
    company: 'Grand Indonesia',
    company_en: 'Grand Indonesia Mall',
    projects: [
      { id: '1', name: 'Grand Indonesia', name_en: 'Grand Indonesia Mall' }
    ]
  },
  {
    id: 3,
    username: 'user2',
    password: 'user123',
    name: 'Siti Rahmawati',
    name_en: 'Siti Rahmawati',
    email: 'siti@plazasenayan.co.id',
    role: 'user',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=siti',
    lastLogin: '2026-04-16T10:15:00Z',
    tenantId: '2',
    company: 'Plaza Senayan',
    company_en: 'Plaza Senayan Shopping Center',
    projects: [
      { id: '2', name: 'Plaza Senayan', name_en: 'Plaza Senayan' }
    ]
  },
  {
    id: 4,
    username: 'operator',
    password: 'operator123',
    name: 'Ahmad Wijaya',
    name_en: 'Ahmad Wijaya',
    email: 'ahmad@centralpark.id',
    role: 'operator',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad',
    lastLogin: '2026-04-16T10:15:00Z',
    tenantId: '3',
    company: 'Central Park Jakarta',
    company_en: 'Central Park Jakarta Mall',
    projects: [
      { id: '3', name: 'Central Park Jakarta', name_en: 'Central Park Jakarta Mall' }
    ]
  }
]

// JWT认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, error: '需要登录' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token已过期' })
    }
    req.user = user
    next()
  })
}

// 角色权限中间件
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: '权限不足' })
    }
    next()
  }
}

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = mockUsers.find(u => u.username === username && u.password === password)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      name_en: user.name_en,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      tenantId: user.tenantId,
      company: user.company,
      company_en: user.company_en,
      projects: user.projects
    }

    res.json({
      success: true,
      data: {
        token,
        user: userInfo,
        expiresIn: 86400
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 用户登出
router.post('/logout', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  })
})

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.id)

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        name_en: user.name_en,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 刷新Token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      { id: req.user.id, username: req.user.username, role: req.user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: 86400
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取用户列表 (管理员)
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = mockUsers.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      name_en: u.name_en,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      lastLogin: u.lastLogin
    }))

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 创建用户 (管理员)
router.post('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body

    if (mockUsers.find(u => u.username === username)) {
      return res.status(400).json({ success: false, error: '用户名已存在' })
    }

    const newUser = {
      id: mockUsers.length + 1,
      username,
      password,
      name: name || username,
      name_en: name || username,
      email: email || `${username}@smartbuilding.com`,
      role: role || 'user',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      lastLogin: null
    }

    mockUsers.push(newUser)

    res.json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新用户 (管理员)
router.put('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, password } = req.body

    const userIndex = mockUsers.findIndex(u => u.id === parseInt(id))

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }

    if (name) mockUsers[userIndex].name = name
    if (name) mockUsers[userIndex].name_en = name
    if (email) mockUsers[userIndex].email = email
    if (role) mockUsers[userIndex].role = role
    if (password) mockUsers[userIndex].password = password

    res.json({
      success: true,
      data: {
        id: mockUsers[userIndex].id,
        username: mockUsers[userIndex].username,
        name: mockUsers[userIndex].name,
        role: mockUsers[userIndex].role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 删除用户 (管理员)
router.delete('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params

    if (parseInt(id) === 1) {
      return res.status(400).json({ success: false, error: '不能删除管理员账户' })
    }

    const userIndex = mockUsers.findIndex(u => u.id === parseInt(id))

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }

    mockUsers.splice(userIndex, 1)

    res.json({
      success: true,
      message: '用户已删除'
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
export { authenticateToken, requireRole }
