# CloudBase 部署指南

## 已完成 ✅

1. **前端部署**：已上传到 CloudBase 静态托管
2. **MySQL 数据库**：已创建，14 张数据表已初始化
3. **门户配置**：初始数据已插入 portal_config 表
4. **安全规则**：数据库安全规则已配置

## 需要手动完成的步骤

### 第 1 步：获取 MySQL 连接信息

1. 打开 CloudBase 控制台：https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/db/mysql
2. 点击"连接数据库"查看连接信息：
   - 主机地址（内网）
   - 端口（默认 3306）
   - 用户名
   - 密码
   - 数据库名：`smart-building-d2gjnbip886faebff`

### 第 2 步：部署后端到云托管

1. 打开云托管页面：https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/platform-run
2. 点击 **"新建服务"**
3. 选择 **"容器镜像"** 方式
4. 配置：
   - 服务名称：`smart-building-api`
   - CPU：1核
   - 内存：2GB
   - 最小实例：1（避免冷启动）
   - 最大实例：5
   - 端口：4000
   - 开启公网访问
5. 上传代码：选择项目根目录，Dockerfile 路径填 `deploy/Dockerfile`
6. 环境变量设置：
   ```
   PORT=4000
   NODE_ENV=production
   DB_HOST=<第1步获取的MySQL内网地址>
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=<第1步获取的密码>
   DB_NAME=smart-building-d2gjnbip886faebff
   JWT_SECRET=smart-building-jwt-secret-2024
   ```
7. 点击"部署"，等待构建完成（约 3-5 分钟）

### 第 3 步：更新前端 API 地址

后端部署成功后，会得到一个公网访问地址，例如：
`https://smart-building-api-xxxx.ap-shanghai.run.tcloudbase.com`

需要更新前端的 API 代理配置，让前端请求指向这个地址。

在 CloudBase 控制台 → 静态托管 → 设置中，配置路由重写规则：
- `/api/*` → 后端服务地址
- `/uploads/*` → 后端服务地址

### 第 4 步：绑定自定义域名（移除中间页）

CloudBase 体验版的测试域名会有安全中间页。要移除它：

1. 准备一个已备案的域名
2. 打开：https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/hosting
3. 在"域名设置"中添加自定义域名
4. 按提示完成 DNS 解析配置

### 第 5 步：上传 bg1.png

前端唯一缺失的文件是 bg1.png（3MB，上传超时）。需要手动上传：

1. 打开：https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/hosting
2. 点击"上传文件"
3. 上传 `frontend/dist/bg1.png` 到根目录

## 快速访问链接

- 前端（有中间页）：https://smart-building-d2gjnbip886faebff-1423421501.tcloudbaseapp.com/
- CloudBase 控制台：https://tcb.cloud.tencent.com/dev?envId=smart-building-d2gjnbip886faebff#/overview
