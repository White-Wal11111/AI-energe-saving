/**
 * 审计日志中间件
 * 自动记录所有API请求
 */

// 日志类型映射
const PATH_TYPE_MAP = {
  '/api/auth/login': 'login',
  '/api/auth/logout': 'logout',
  '/api/ac': 'control',
  '/api/lighting': 'control',
  '/api/parking': 'control',
  '/api/monitor': 'control',
  '/api/settings': 'config',
  '/api/alert': 'alert',
  '/api/user': 'user'
}

/**
 * 获取请求对应的日志类型
 */
function getLogType(path) {
  for (const [prefix, type] of Object.entries(PATH_TYPE_MAP)) {
    if (path.startsWith(prefix)) {
      return type
    }
  }
  return 'control'
}

/**
 * 获取用户信息（从请求头或token解析）
 */
function getUserFromRequest(req) {
  // 尝试从Authorization头获取
  const authHeader = req.headers.authorization
  if (authHeader) {
    // 简单解析，实际项目中应使用JWT解析
    try {
      const token = authHeader.replace('Bearer ', '')
      // 如果有用户信息在token中，这里解析
      // 目前返回默认值
    } catch (e) {
      // ignore
    }
  }
  
  // 从请求体或查询参数获取
  return req.body?.user || req.query?.user || req.headers['x-user'] || 'anonymous'
}

/**
 * 获取客户端真实IP
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         '0.0.0.0'
}

/**
 * 审计日志中间件
 */
export function auditLogger(req, res, next) {
  const startTime = Date.now()
  const originalSend = res.send
  
  // 捕获响应完成事件
  res.send = function(body) {
    res.send = originalSend
    res.body = body
    
    // 请求完成后的处理
    setImmediate(() => {
      try {
        const duration = Date.now() - startTime
        const logType = getLogType(req.path)
        const user = getUserFromRequest(req)
        const ip = getClientIP(req)
        
        // 记录日志
        const logEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: logType,
          user,
          action: `${req.method} ${req.path}`,
          detail: `参数: ${JSON.stringify(req.query || req.body || {}).slice(0, 200)}`,
          ip,
          timestamp: Date.now(),
          duration,
          status: res.statusCode >= 400 ? 'failed' : 'success'
        }
        
        // 存储日志（可扩展为数据库存储）
        if (!global.auditLogs) {
          global.auditLogs = []
        }
        
        // 保留最近1000条日志
        global.auditLogs.unshift(logEntry)
        if (global.auditLogs.length > 1000) {
          global.auditLogs.pop()
        }
        
        // 控制台输出（开发环境）
        if (process.env.NODE_ENV !== 'production') {
          const statusIcon = logEntry.status === 'success' ? '✓' : '✗'
          console.log(`[AUDIT] ${statusIcon} ${logEntry.type.padEnd(8)} | ${logEntry.user.padEnd(15)} | ${logEntry.action}`)
        }
      } catch (error) {
        console.error('[AUDIT] 日志记录失败:', error.message)
      }
      
      return originalSend.call(this, body)
    })
  }
  
  next()
}

/**
 * 手动记录操作日志
 */
export function logAction(type, user, action, detail, req) {
  const logEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    user,
    action,
    detail,
    ip: getClientIP(req || {}),
    timestamp: Date.now(),
    status: 'success'
  }
  
  if (!global.auditLogs) {
    global.auditLogs = []
  }
  
  global.auditLogs.unshift(logEntry)
  
  return logEntry
}

export default auditLogger
