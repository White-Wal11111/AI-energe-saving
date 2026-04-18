import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_building',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
})

// 测试连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ MySQL 数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ MySQL 数据库连接失败:', error.message)
    return false
  }
}

// 初始化数据库表
export async function initDatabase() {
  const createTables = `
    -- 空调设备表
    CREATE TABLE IF NOT EXISTS ac_devices (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(100),
      status ENUM('on', 'off') DEFAULT 'off',
      temperature DECIMAL(4,1),
      target_temp DECIMAL(4,1) DEFAULT 24,
      mode ENUM('cool', 'heat', 'fan', 'auto') DEFAULT 'cool',
      power INT DEFAULT 0,
      energy_today DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    -- 停车场表
    CREATE TABLE IF NOT EXISTS parking_spaces (
      id VARCHAR(50) PRIMARY KEY,
      floor INT NOT NULL,
      zone VARCHAR(10),
      number VARCHAR(20) NOT NULL,
      status ENUM('available', 'occupied', 'reserved', 'disabled') DEFAULT 'available',
      plate_number VARCHAR(20),
      entry_time DATETIME,
      UNIQUE KEY unique_space (floor, number)
    );

    -- 停车记录表
    CREATE TABLE IF NOT EXISTS parking_records (
      id VARCHAR(50) PRIMARY KEY,
      plate_number VARCHAR(20) NOT NULL,
      space_id VARCHAR(50),
      entry_time DATETIME NOT NULL,
      exit_time DATETIME,
      fee DECIMAL(10,2),
      status ENUM('parking', 'exited') DEFAULT 'parking',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 灯光回路表
    CREATE TABLE IF NOT EXISTS lighting_circuits (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      zone VARCHAR(50),
      floor INT NOT NULL,
      status ENUM('on', 'off') DEFAULT 'off',
      brightness INT DEFAULT 50,
      power INT DEFAULT 0,
      mode ENUM('normal', 'eco', 'off-peak') DEFAULT 'normal'
    );

    -- 摄像头表
    CREATE TABLE IF NOT EXISTS cameras (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      location VARCHAR(100),
      floor INT,
      status ENUM('online', 'offline') DEFAULT 'online',
      stream_url VARCHAR(255),
      has_ai BOOLEAN DEFAULT FALSE,
      last_motion DATETIME
    );

    -- 告警记录表
    CREATE TABLE IF NOT EXISTS monitor_alerts (
      id VARCHAR(50) PRIMARY KEY,
      camera_id VARCHAR(50),
      type ENUM('motion', 'intrusion', 'disconnect', 'ai') NOT NULL,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      acknowledged BOOLEAN DEFAULT FALSE
    );

    -- 能耗记录表
    CREATE TABLE IF NOT EXISTS energy_records (
      id VARCHAR(50) PRIMARY KEY,
      device_type ENUM('ac', 'lighting') NOT NULL,
      device_id VARCHAR(50),
      energy DECIMAL(10,2) NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 设备管理表
    CREATE TABLE IF NOT EXISTS devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL COMMENT '所属项目ID',
      device_code VARCHAR(50) NOT NULL COMMENT '设备编号',
      name VARCHAR(100) NOT NULL COMMENT '设备名称',
      device_type ENUM('smart_meter', 'smart_valve_air', 'smart_valve_water', 'temp_sensor_water', 'temp_sensor_air', 'pressure_sensor', 'chiller', 'cooling_tower', 'ahu') NOT NULL COMMENT '设备类型',
      location VARCHAR(200) COMMENT '安装位置',
      floor INT COMMENT '楼层',
      brand VARCHAR(100) COMMENT '品牌',
      model VARCHAR(100) COMMENT '型号',
      rated_power DECIMAL(10,2) COMMENT '额定功率(kW)',
      rated_flow DECIMAL(10,2) COMMENT '额定流量(m³/h)',
      rated_pressure DECIMAL(10,2) COMMENT '额定压力(MPa)',
      install_date DATE COMMENT '安装日期',
      warranty_date DATE COMMENT '质保到期日',
      status ENUM('online', 'offline', 'fault', 'maintenance') DEFAULT 'online' COMMENT '运行状态',
      last_data_time DATETIME COMMENT '最后数据上报时间',
      description TEXT COMMENT '备注说明',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_device_code (project_id, device_code),
      INDEX idx_project (project_id),
      INDEX idx_type (device_type),
      INDEX idx_status (status)
    ) COMMENT='项目设备表';

    -- 设备实时数据表
    CREATE TABLE IF NOT EXISTS device_realtime_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_id INT NOT NULL COMMENT '设备ID',
      data_type VARCHAR(50) NOT NULL COMMENT '数据类型(如power,chilled_water_temp等)',
      value DECIMAL(12,4) NOT NULL COMMENT '数据值',
      unit VARCHAR(20) COMMENT '单位',
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
      INDEX idx_device (device_id),
      INDEX idx_time (recorded_at),
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
    ) COMMENT='设备实时数据表';

    -- API Key配置表
    CREATE TABLE IF NOT EXISTS api_keys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      provider VARCHAR(50) NOT NULL DEFAULT 'deepseek' COMMENT 'API提供商',
      api_key VARCHAR(500) NOT NULL COMMENT 'API Key',
      api_url VARCHAR(255) DEFAULT 'https://api.deepseek.com/chat/completions' COMMENT 'API地址',
      model VARCHAR(100) DEFAULT 'deepseek-chat' COMMENT '模型名称',
      is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
      last_verified_at DATETIME COMMENT '最后校验时间',
      last_verified_status ENUM('success', 'failed') COMMENT '最后校验状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_provider (provider)
    );

    -- 设备控制操作日志表
    CREATE TABLE IF NOT EXISTS device_control_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      device_id INT NOT NULL COMMENT '设备ID',
      device_name VARCHAR(100) NOT NULL COMMENT '设备名称',
      device_code VARCHAR(50) COMMENT '设备编号',
      device_type VARCHAR(30) NOT NULL COMMENT '设备类型',
      action VARCHAR(50) NOT NULL COMMENT '执行的动作',
      action_label VARCHAR(100) COMMENT '动作描述',
      params JSON COMMENT '操作参数(JSON)',
      operator VARCHAR(50) NOT NULL COMMENT '操作人',
      result ENUM('success', 'fail') DEFAULT 'success' COMMENT '执行结果',
      result_message VARCHAR(255) COMMENT '结果说明',
      project_id VARCHAR(50) COMMENT '所属项目ID',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_device (device_id),
      INDEX idx_project (project_id),
      INDEX idx_action (action),
      INDEX idx_created (created_at)
    ) COMMENT='设备控制操作日志表';

    -- 能耗实时监测数据表（按采集周期记录）
    CREATE TABLE IF NOT EXISTS energy_monitor_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL COMMENT '所属项目ID',
      category ENUM('total', 'chiller', 'chilled_pump', 'condenser_pump', 'cooling_tower', 'terminal', 'other') NOT NULL DEFAULT 'total' COMMENT '能耗分类',
      meter_code VARCHAR(50) COMMENT '电表编号/数据源标识',
      power_kw DECIMAL(10,2) COMMENT '当前瞬时功率(kW)',
      energy_kwh DECIMAL(12,4) COMMENT '本周期累计电量(kWh)',
      cost_yuan DECIMAL(12,2) COMMENT '本周期累计电费(元)',
      recorded_at DATETIME NOT NULL COMMENT '记录时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_project_cat_time (project_id, category, recorded_at),
      INDEX idx_project_time (project_id, recorded_at),
      INDEX idx_category (category)
    ) COMMENT='能耗实时监测数据表';

    -- 能耗日汇总表
    CREATE TABLE IF NOT EXISTS energy_daily_summary (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL COMMENT '所属项目ID',
      summary_date DATE NOT NULL COMMENT '统计日期',
      total_energy_kwh DECIMAL(14,2) DEFAULT 0 COMMENT '总用电量(kWh)',
      total_cost_yuan DECIMAL(14,2) DEFAULT 0 COMMENT '总电费(元)',
      chiller_energy_kwh DECIMAL(12,2) DEFAULT 0 COMMENT '冷机用电(kWh)',
      chiller_cost_yuan DECIMAL(12,2) DEFAULT 0 COMMENT '冷机电费(元)',
      pump_energy_kwh DECIMAL(12,2) DEFAULT 0 COMMENT '水泵用电(kWh)',
      pump_cost_yuan DECIMAL(12,2) DEFAULT 0 COMMENT '水泵电费(元)',
      cooling_tower_energy_kwh DECIMAL(12,2) DEFAULT 0 COMMENT '冷却塔用电(kWh)',
      cooling_tower_cost_yuan DECIMAL(12,2) DEFAULT 0 COMMENT '冷却塔电费(元)',
      terminal_energy_kwh DECIMAL(12,2) DEFAULT 0 COMMENT '末端设备用电(kWh)',
      terminal_cost_yuan DECIMAL(12,2) DEFAULT 0 COMMENT '末端设备电费(元)',
      other_energy_kwh DECIMAL(12,2) DEFAULT 0 COMMENT '其他用电(kWh)',
      other_cost_yuan DECIMAL(12,2) DEFAULT 0 COMMENT '其他电费(元)',
      peak_power_kw DECIMAL(10,2) COMMENT '峰值功率(kW)',
      avg_power_kw DECIMAL(10,2) COMMENT '平均功率(kW)',
      saving_rate DECIMAL(6,2) COMMENT '节能率(%)，正值为节能',
      compare_date DATE COMMENT '对比基准日期',
      compare_energy_kwh DECIMAL(14,2) COMMENT '对比期总用电量',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_proj_date (project_id, summary_date),
      INDEX idx_date_range (summary_date)
    ) COMMENT='能耗日汇总表';

    -- 能耗告警记录表
    CREATE TABLE IF NOT EXISTS energy_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id VARCHAR(50) NOT NULL COMMENT '所属项目ID',
      alert_type ENUM('saving_low', 'power_peak', 'cost_abnormal') NOT NULL COMMENT '告警类型:节能过低/功率峰值/费用异常',
      level ENUM('info', 'warning', 'danger') DEFAULT 'warning' COMMENT '告警级别',
      title VARCHAR(200) COMMENT '告警标题',
      message TEXT COMMENT '告警内容',
      current_value DECIMAL(12,4) COMMENT '当前值',
      threshold_value DECIMAL(12,4) COMMENT '阈值',
      unit VARCHAR(20) COMMENT '单位',
      is_acknowledged TINYINT(1) DEFAULT 0 COMMENT '是否已确认',
      acknowledged_by VARCHAR(50) COMMENT '确认人',
      acknowledged_at DATETIME COMMENT '确认时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_project_alert (project_id, is_acknowledged),
      INDEX idx_created (created_at)
    ) COMMENT='能耗告警记录表';

    -- 公司门户配置表
    CREATE TABLE IF NOT EXISTS portal_config (
      id INT PRIMARY KEY,
      content JSON COMMENT '门户页面配置内容(JSON)',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT='公司门户配置表';
  `

  try {
    const connection = await pool.getConnection()
    const statements = createTables.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement)
      }
    }
    
    console.log('✅ 数据库表初始化完成')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库表初始化失败:', error.message)
    return false
  }
}

export default pool
