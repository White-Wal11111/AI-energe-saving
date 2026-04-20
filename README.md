# AI预测中央空调控制系统 (AI-Predictive HVAC Control System)

## 🚀 部署状态
**✅ 已成功部署到腾讯云CloudBase**

**访问地址**: https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com

**部署信息**:
- **前端**: 静态托管 (Vue 3 + Vite)
- **后端**: 容器型云托管 (Node.js + Express)
- **数据库**: MySQL (已配置)
- **部署时间**: 2026-04-20
- **版本**: 1.0.1

**快速测试**: 运行 `./deploy-test.sh` 测试部署状态

## 📋 项目简介

基于前后端分离架构的AI预测中央空调控制系统，通过AI预测冷负荷需求，实时优化冷水机组运行参数，实现 **15-25% 节能效果**。

### 核心控制对象
| 设备类型 | 控制参数 |
|---------|---------|
| 🧊 冷机（冷水机组） | 启停控制、负载调节 |
| 💨 变频器 | 水泵频率调节（Hz） |
| 🚪 风阀 | 开关程度、风量调节 |
| 🚰 水阀 | 阀门开度、水流量 |
| 📡 传感器 | 温度、湿度、压力采集 |

### 核心功能模块

| 模块 | 功能描述 |
|------|----------|
| 🧊 AI控制面板 | 实时监测冷冻水温度、冷机负载、变频器频率 |
| 🤖 AI预测控制 | 预测冷负荷，智能调整设备运行参数 |
| ⚡ 能效分析 | AI vs 传统控制对比，量化节能效果 |
| 📊 数据可视化 | 冷负荷预测曲线、设备运行状态 |
| 💡 节能建议 | 基于AI模型生成优化控制策略 |

## 🛠 技术栈

### 前端
- Vue 3 + Composition API
- Vite 5 + TypeScript
- Element Plus UI
- Pinia 状态管理
- Vue Router
- ECharts 数据可视化
- Socket.IO 实时通信

### 后端
- Node.js + Express
- MySQL 数据库
- Socket.IO 实时通信
- Axios HTTP 客户端

### AI 能力
- 冷负荷预测模型
- DeepSeek API 智能分析

## 📁 项目结构

```
smart-building-system/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── api/               # API 接口
│   │   ├── components/        # 公共组件
│   │   ├── views/            # 页面视图
│   │   │   ├── dashboard/    # 系统概览
│   │   │   ├── ac-control/   # 空调控制（冷机/风阀/水阀/变频器）
│   │   │   ├── parking/      # 停车场
│   │   │   ├── lighting/     # 灯光控制
│   │   │   ├── monitor/      # 视频监控
│   │   │   └── settings/     # 系统设置
│   │   ├── stores/           # Pinia 状态
│   │   ├── router/           # 路由配置
│   │   └── styles/           # 全局样式
│   └── package.json
│
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── routes/           # API 路由
│   │   ├── config/           # 配置文件
│   │   └── server.js         # 入口文件
│   ├── package.json
│   └── .env.example
│
├── shared/                      # 共享类型定义
│   └── types/
│
└── docs/                        # 文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- MySQL >= 8.0

### 1. 克隆项目
```bash
cd "C:\Users\lmy17\Desktop\智慧楼宇管理系统"
```

### 2. 安装前端依赖
```bash
cd frontend
npm install
```

### 3. 安装后端依赖
```bash
cd ../backend
npm install
```

### 4. 配置数据库
复制 `.env.example` 为 `.env` 并修改配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_building
PORT=4000
```

### 5. 创建数据库
```sql
CREATE DATABASE smart_building CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. 启动后端服务
```bash
npm run dev
```

### 7. 启动前端开发服务器
```bash
cd ../frontend
npm run dev
```

### 8. 访问系统
- 前端地址: http://localhost:3000
- 后端地址: http://localhost:4000

## 📡 API 接口

### 仪表盘
- `GET /api/dashboard/summary` - 获取系统概览

### 空调控制模块
- `GET /api/ac/devices` - 获取设备列表（冷机/变频器/风阀/水阀）
- `POST /api/ac/control` - 控制设备启停
- `POST /api/ac/param` - 调整设备参数（频率/阀门开度）
- `GET /api/ac/monitor` - 实时监测数据
- `GET /api/ac/energy/stats` - 能耗统计
- `POST /api/ac/ai/predict` - AI 冷负荷预测

### 停车场
- `GET /api/parking/status` - 车位状态
- `POST /api/parking/reserve` - 预约车位
- `GET /api/parking/records` - 停车记录

### 灯光控制
- `GET /api/lighting/circuits` - 回路列表
- `POST /api/lighting/control` - 控制灯光
- `GET /api/lighting/energy` - 能耗数据

### 视频监控
- `GET /api/monitor/cameras` - 摄像头列表
- `GET /api/monitor/stream/:id` - 视频流
- `GET /api/monitor/alerts` - 告警记录

## 🌐 部署

### CloudBase 云部署

项目已部署到腾讯云CloudBase，包含完整的后端API服务和前端静态托管。

#### 部署信息

**版本**: 1.0.1 (2026-04-20)

**后端API服务**:
- 服务名称: `smart-building-api`
- 访问地址: `https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com`
- 服务类型: 容器型云托管 (CloudRun)
- 配置: 1核CPU / 2GB内存 / 端口4000
- 环境变量: 已配置MySQL数据库连接、JWT密钥等

**前端应用**:
- 静态托管域名: `https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com`
- 构建版本: Vue 3 + Vite 生产构建
- API代理: 已配置指向后端API服务

**数据库**:
- MySQL数据库已配置并运行
- 连接信息通过环境变量管理

#### 访问地址

1. **生产环境**:
   - 前端应用: https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com
   - 后端API: https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com
   - 健康检查: https://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com/api/health
   - Socket.IO: wss://smart-building-api-248043-6-1423421501.sh.run.tcloudbase.com

2. **开发环境**:
   - 前端: http://localhost:3000
   - 后端: http://localhost:4000

#### 部署流程

1. **更新版本号**:
   ```bash
   # 更新后端版本
   cd backend && npm version patch
   # 更新前端版本  
   cd frontend && npm version patch
   ```

2. **构建前端**:
   ```bash
   cd frontend
   npm run build
   ```

3. **部署后端** (如果需要更新):
   ```bash
   # 使用CloudBase MCP工具部署
   # 或通过CloudBase控制台更新
   ```

4. **上传前端文件**:
   ```bash
   # 使用CloudBase MCP工具上传dist目录到静态托管
   ```

#### 环境配置

后端环境变量已配置:
- `NODE_ENV=production`
- `DB_HOST=TENCENT64.site`
- `DB_PORT=28266`
- `DB_USER=root`
- `DB_PASSWORD=******`
- `DB_NAME=smart-building-d2gjnbip886faebff`
- `JWT_SECRET=smart-building-jwt-secret-2024`
- `PORT=4000`

#### 监控和管理

1. **CloudBase控制台**:
   - 环境管理: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/overview
   - 云托管服务: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/platform-run
   - 静态托管: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/static-hosting
   - 数据库管理: https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/db/mysql/table/default/

2. **日志查看**:
   - 后端日志: CloudBase控制台 → 云托管 → 服务详情 → 日志
   - 前端访问日志: CloudBase控制台 → 静态托管 → 访问日志

#### 本地开发

### 前端部署
```bash
cd frontend
npm run build
```

### 后端部署
1. 设置环境变量
2. 部署到服务器

## 📝 开发说明

### 中英双语
系统支持中英文切换，核心文案使用 `isCN` 变量控制：
```javascript
const isCN = inject('isCN', ref(true))
// 使用: {{ isCN ? '中文' : 'English' }}
```

### 响应式设计
支持 PC、平板、手机三种设备尺寸自适应。

### Socket.IO 实时通信
后端实时推送设备状态更新。

## 📄 许可证

MIT License - REII Automation
