#!/bin/bash
# ============================================================
#  智慧楼宇管理系统 - 一键部署脚本
#  服务器: 124.222.103.22
#  用法: bash deploy.sh
# ============================================================

set -e
echo "========================================="
echo "  智慧楼宇管理系统 - 部署中..."
echo "========================================="

# ---- 1. 安装依赖 ----
echo ""
echo "[1/6] 安装系统依赖..."
apt-get update -qq
apt-get install -y -qq mysql-server nginx curl unzip > /dev/null 2>&1 || true

# 启动 MySQL（如果没启动）
service mysql start > /dev/null 2>&1 || true
echo "  ✅ 系统依赖安装完成"

# ---- 2. 创建数据库和表 ----
echo ""
echo "[2/6] 配置数据库..."

# 创建数据库
mysql -u root -e "CREATE DATABASE IF NOT EXISTS smart_building DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

# 创建数据表
mysql -u root smart_building << 'EOSQL' 2>/dev/null
-- 空调设备表
CREATE TABLE IF NOT EXISTS ac_devices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  status ENUM('on', 'off') DEFAULT 'off',
  temperature DECIMAL(4,1), target_temp DECIMAL(4,1) DEFAULT 24,
  mode ENUM('cool', 'heat', 'fan', 'auto') DEFAULT 'cool',
  power INT DEFAULT 0, energy_today DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 停车场表
CREATE TABLE IF NOT EXISTS parking_spaces (
  id VARCHAR(50) PRIMARY KEY, floor INT NOT NULL, zone VARCHAR(10),
  number VARCHAR(20) NOT NULL,
  status ENUM('available', 'occupied', 'reserved', 'disabled') DEFAULT 'available',
  plate_number VARCHAR(20), entry_time DATETIME,
  UNIQUE KEY unique_space (floor, number)
);

-- 停车记录表
CREATE TABLE IF NOT EXISTS parking_records (
  id VARCHAR(50) PRIMARY KEY, plate_number VARCHAR(20) NOT NULL,
  space_id VARCHAR(50), entry_time DATETIME NOT NULL, exit_time DATETIME,
  fee DECIMAL(10,2), status ENUM('parking', 'exited') DEFAULT 'parking',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 灯光回路表
CREATE TABLE IF NOT EXISTS lighting_circuits (
  id VARCHAR(50) PRIMARY KEY, name VARCHAR(100) NOT NULL,
  zone VARCHAR(50), floor INT NOT NULL,
  status ENUM('on', 'off') DEFAULT 'off', brightness INT DEFAULT 50,
  power INT DEFAULT 0, mode ENUM('normal', 'eco', 'off-peak') DEFAULT 'normal'
);

-- 摄像头表
CREATE TABLE IF NOT EXISTS cameras (
  id VARCHAR(50) PRIMARY KEY, name VARCHAR(100) NOT NULL,
  location VARCHAR(100), floor INT,
  status ENUM('online', 'offline') DEFAULT 'online',
  stream_url VARCHAR(255), has_ai BOOLEAN DEFAULT FALSE, last_motion DATETIME
);

-- 告警记录表
CREATE TABLE IF NOT EXISTS monitor_alerts (
  id VARCHAR(50) PRIMARY KEY, camera_id VARCHAR(50),
  type ENUM('motion', 'intrusion', 'disconnect', 'ai') NOT NULL,
  message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged BOOLEAN DEFAULT FALSE
);

-- 能耗记录表
CREATE TABLE IF NOT EXISTS energy_records (
  id VARCHAR(50) PRIMARY KEY,
  device_type ENUM('ac', 'lighting') NOT NULL, device_id VARCHAR(50),
  energy DECIMAL(10,2) NOT NULL, recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 设备管理表
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL, device_code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  device_type ENUM('smart_meter','smart_valve_air','smart_valve_water',
    'temp_sensor_water','temp_sensor_air','pressure_sensor',
    'chiller','cooling_tower','ahu') NOT NULL,
  location VARCHAR(200), floor INT, brand VARCHAR(100), model VARCHAR(100),
  rated_power DECIMAL(10,2), rated_flow DECIMAL(10,2), rated_pressure DECIMAL(10,2),
  install_date DATE, warranty_date DATE,
  status ENUM('online','offline','fault','maintenance') DEFAULT 'online',
  last_data_time DATETIME, description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_device_code (project_id, device_code)
);

-- 设备实时数据表
CREATE TABLE IF NOT EXISTS device_realtime_data (
  id INT AUTO_INCREMENT PRIMARY KEY, device_id INT NOT NULL,
  data_type VARCHAR(50) NOT NULL, value DECIMAL(12,4) NOT NULL,
  unit VARCHAR(20), recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device (device_id), INDEX idx_time (recorded_at)
);

-- API Key配置表
CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'deepseek',
  api_key VARCHAR(500) NOT NULL,
  api_url VARCHAR(255) DEFAULT 'https://api.deepseek.com/chat/completions',
  model VARCHAR(100) DEFAULT 'deepseek-chat',
  is_active TINYINT(1) DEFAULT 1,
  last_verified_at DATETIME, last_verified_status ENUM('success', 'failed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider (provider)
);

-- 设备控制操作日志表
CREATE TABLE IF NOT EXISTS device_control_logs (
  id INT AUTO_INCREMENT PRIMARY KEY, device_id INT NOT NULL,
  device_name VARCHAR(100) NOT NULL, device_code VARCHAR(50), device_type VARCHAR(30) NOT NULL,
  action VARCHAR(50) NOT NULL, action_label VARCHAR(100), params JSON,
  operator VARCHAR(50) NOT NULL, result ENUM('success', 'fail') DEFAULT 'success',
  result_message VARCHAR(255), project_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device (device_id), INDEX idx_action (action), INDEX idx_created (created_at)
);

-- 能耗实时监测数据表
CREATE TABLE IF NOT EXISTS energy_monitor_data (
  id INT AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(50) NOT NULL,
  category ENUM('total','chiller','chilled_pump','condenser_pump',
    'cooling_tower','terminal','other') NOT NULL DEFAULT 'total',
  meter_code VARCHAR(50), power_kw DECIMAL(10,2),
  energy_kwh DECIMAL(12,4), cost_yuan DECIMAL(12,2),
  recorded_at DATETIME NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_cat_time (project_id, category, recorded_at)
);

-- 能耗日汇总表
CREATE TABLE IF NOT EXISTS energy_daily_summary (
  id INT AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(50) NOT NULL,
  summary_date DATE NOT NULL,
  total_energy_kwh DECIMAL(14,2) DEFAULT 0, total_cost_yuan DECIMAL(14,2) DEFAULT 0,
  chiller_energy_kwh DECIMAL(12,2) DEFAULT 0, chiller_cost_yuan DECIMAL(12,2) DEFAULT 0,
  pump_energy_kwh DECIMAL(12,2) DEFAULT 0, pump_cost_yuan DECIMAL(12,2) DEFAULT 0,
  cooling_tower_energy_kwh DECIMAL(12,2) DEFAULT 0, cooling_tower_cost_yuan DECIMAL(12,2) DEFAULT 0,
  terminal_energy_kwh DECIMAL(12,2) DEFAULT 0, terminal_cost_yuan DECIMAL(12,2) DEFAULT 0,
  other_energy_kwh DECIMAL(12,2) DEFAULT 0, other_cost_yuan DECIMAL(12,2) DEFAULT 0,
  peak_power_kw DECIMAL(10,2), avg_power_kw DECIMAL(10,2), saving_rate DECIMAL(6,2),
  compare_date DATE, compare_energy_kwh DECIMAL(14,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_proj_date (project_id, summary_date)
);

-- 能耗告警记录表
CREATE TABLE IF NOT EXISTS energy_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY, project_id VARCHAR(50) NOT NULL,
  alert_type ENUM('saving_low','power_peak','cost_abnormal') NOT NULL,
  level ENUM('info','warning','danger') DEFAULT 'warning',
  title VARCHAR(200), message TEXT,
  current_value DECIMAL(12,4), threshold_value DECIMAL(12,4), unit VARCHAR(20),
  is_acknowledged TINYINT(1) DEFAULT 0,
  acknowledged_by VARCHAR(50), acknowledged_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 公司门户配置表
CREATE TABLE IF NOT EXISTS portal_config (
  id INT PRIMARY KEY, content JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(100), role ENUM('admin', 'operator', 'viewer') DEFAULT 'admin',
  department VARCHAR(100), phone VARCHAR(20), email VARCHAR(100),
  avatar VARCHAR(255), status TINYINT(1) DEFAULT 1,
  last_login DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
EOSQL

# 插入默认管理员账号（密码: admin123 的 bcrypt hash）
mysql -u root smart_building -e "
INSERT IGNORE INTO users (username, password, real_name, role, status)
VALUES ('admin', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 'admin', 1);
" 2>/dev/null || true

# 插入门户默认配置
mysql -u root smart_building -e "
INSERT IGNORE INTO portal_config (id, content) VALUES (1, '{\"company_name\":\"智慧楼宇\",\"company_name_en\":\"Smart Building\",\"slogan\":\"AI驱动的智慧楼宇节能管理平台\"}');
" 2>/dev/null || true

echo "  ✅ 数据库配置完成"

# ---- 3. 部署后端 ----
echo ""
echo "[3/6] 部署后端服务..."
cd /opt
mkdir -p smart-building
cd smart-building

# 如果代码还没上传到这里，提示用户
if [ ! -f "/opt/smart-building/backend/package.json" ]; then
    echo "  ⚠️  请先上传项目代码到 /opt/smart-building/"
    echo "     上传后重新运行此脚本"
    exit 1
fi

# 安装后端依赖
cd backend && npm ci --production > /dev/null 2>&1
mkdir -p public/uploads public/app

# 复制前端构建产物
if [ -d "/opt/smart-building/frontend/dist" ]; then
    cp -r /opt/smart-building/frontend/dist/* /opt/smart-building/backend/public/app/
fi
cd /opt/smart-building/backend

echo "  ✅ 后端安装完成"

# ---- 4. 配置 PM2 守护进程 ----
echo ""
echo "[4/6] 配置进程守护..."
npm install -g pm2 > /dev/null 2>&1

# 先停掉旧进程（如果有）
pm2 delete smart-building-api 2>/dev/null || true

# 设置环境变量并启动
export PORT=4000
export NODE_ENV=production
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=''
export DB_NAME=smart_building
export JWT_SECRET=smart-building-jwt-2024

pm2 start src/server.js --name smart-building-api > /dev/null 2>&1
pm2 save > /dev/null 2>&1

# 开机自启
pm2 startup > /dev/null 2>&1 || true

echo "  ✅ 后端服务已启动 (端口: 4000)"

# ---- 5. 配置 Nginx 反向代理（可选）----
echo ""
echo "[5/6] 配置 Web 服务..."
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/smart-building/backend/public/app;
        try_files $uri $uri/ /index.html;
        index index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO 代理
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

nginx -t > /dev/null 2>&1 && service nginx reload > /dev/null 2>&1 || service nginx restart > /dev/null 2>&1 || true

echo "  ✅ Nginx 已配置"

# ---- 6. 防火墙开放端口 ----
echo ""
echo "[6/6] 开放防火墙端口..."
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 4000/tcp > /dev/null 2>&1 || true
iptables -I INPUT -p tcp --dport 80 -j ACCEPT > /dev/null 2>&1 || true
iptables -I INPUT -p tcp --dport 4000 -j ACCEPT > /dev/null 2>&1 || true

echo ""
echo "========================================="
echo "  🎉 部署完成！"
echo "========================================="
echo ""
echo "  访问地址:"
echo "    🌐 主页:   http://124.222.103.22/"
echo "    🔧 API:   http://124.222.103.22/api/"
echo ""
echo "  登录账号:"
echo "    用户名: admin"
echo "    密码:   admin123"
echo ""
echo "  管理命令:"
echo "    pm2 status          # 查看状态"
echo "    pm2 logs smart-building-api  # 查看日志"
echo "    pm2 restart smart-building-api  # 重启服务"
echo ""
echo "========================================="
