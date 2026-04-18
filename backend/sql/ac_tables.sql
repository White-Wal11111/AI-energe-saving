-- =============================================
-- 智慧楼宇管理系统 - 空调设备数据库表
-- Smart Building Management System - AC Device Tables
-- =============================================

-- 1. 空调设备表
CREATE TABLE IF NOT EXISTS ac_devices (
    id VARCHAR(50) PRIMARY KEY COMMENT '设备ID',
    name VARCHAR(100) NOT NULL COMMENT '设备名称',
    location VARCHAR(200) COMMENT '安装位置',
    floor INT COMMENT '楼层',
    zone VARCHAR(100) COMMENT '区域',
    status ENUM('on', 'off', 'standby') DEFAULT 'off' COMMENT '状态',
    current_temp DECIMAL(4,1) COMMENT '当前温度',
    target_temp INT DEFAULT 25 COMMENT '目标温度',
    mode ENUM('cool', 'heat', 'fan', 'auto', 'dry') DEFAULT 'cool' COMMENT '运行模式',
    power INT DEFAULT 0 COMMENT '实时功率(W)',
    energy_today DECIMAL(8,2) DEFAULT 0 COMMENT '今日能耗(kWh)',
    last_on_time DATETIME COMMENT '最后开启时间',
    last_off_time DATETIME COMMENT '最后关闭时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (location),
    INDEX idx_floor (floor),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 空调控制日志表
CREATE TABLE IF NOT EXISTS ac_control_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    action ENUM('power', 'temperature', 'mode', 'schedule') NOT NULL COMMENT '控制动作',
    old_value VARCHAR(100) COMMENT '原值',
    new_value VARCHAR(100) NOT NULL COMMENT '新值',
    operator VARCHAR(50) DEFAULT 'user' COMMENT '操作者',
    source ENUM('manual', 'schedule', 'ai', 'api') DEFAULT 'manual' COMMENT '操作来源',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_time (device_id, created_at),
    INDEX idx_action (action),
    FOREIGN KEY (device_id) REFERENCES ac_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 空调能耗记录表（每小时记录）
CREATE TABLE IF NOT EXISTS ac_energy_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    record_hour INT NOT NULL COMMENT '0-23',
    energy_kwh DECIMAL(8,3) NOT NULL COMMENT '能耗(kWh)',
    avg_temp DECIMAL(4,1) COMMENT '平均温度',
    max_temp DECIMAL(4,1) COMMENT '最高温度',
    min_temp DECIMAL(4,1) COMMENT '最低温度',
    runtime_minutes INT DEFAULT 0 COMMENT '运行时长(分钟)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_device_hour (device_id, record_date, record_hour),
    INDEX idx_date (record_date),
    FOREIGN KEY (device_id) REFERENCES ac_devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 场景模式表
CREATE TABLE IF NOT EXISTS ac_scenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '场景代码',
    name VARCHAR(100) NOT NULL COMMENT '场景名称',
    name_en VARCHAR(100) COMMENT '英文名称',
    icon VARCHAR(50) DEFAULT 'el-icon-setting' COMMENT '图标',
    description TEXT COMMENT '场景描述',
    settings JSON NOT NULL COMMENT '场景设置(JSON)',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认场景',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 定时任务表
CREATE TABLE IF NOT EXISTS ac_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) COMMENT '设备ID(NULL表示全部)',
    scene_code VARCHAR(50) COMMENT '场景代码',
    name VARCHAR(100) NOT NULL COMMENT '任务名称',
    cron_expression VARCHAR(100) NOT NULL COMMENT 'Cron表达式',
    action ENUM('power_on', 'power_off', 'scene') NOT NULL COMMENT '执行动作',
    action_value VARCHAR(100) COMMENT '动作参数',
    weekdays VARCHAR(20) DEFAULT '1,2,3,4,5' COMMENT '执行日期(1-7,逗号分隔)',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    last_run DATETIME COMMENT '上次执行时间',
    next_run DATETIME COMMENT '下次执行时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_device (device_id),
    FOREIGN KEY (device_id) REFERENCES ac_devices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 初始化数据
-- =============================================

-- 插入默认空调设备
INSERT INTO ac_devices (id, name, location, floor, zone, status, current_temp, target_temp, mode, power, energy_today) VALUES
('AC-001', '1号空调', '1楼大厅', 1, '大厅A区', 'on', 24.5, 25, 'cool', 1200, 28.5),
('AC-002', '2号空调', '2楼办公区', 2, '办公A区', 'on', 23.0, 24, 'cool', 1500, 35.2),
('AC-003', '3号空调', '3楼会议室', 3, '会议A区', 'off', 26.0, 24, 'auto', 0, 12.8),
('AC-004', '4号空调', '地下车库', -1, '车库', 'on', 22.0, 23, 'fan', 800, 18.6),
('AC-005', '5号空调', '1楼接待区', 1, '大厅B区', 'on', 25.0, 26, 'cool', 1100, 22.3),
('AC-006', '6号空调', '2楼休息区', 2, '办公B区', 'standby', 27.0, 25, 'cool', 0, 8.5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 插入默认场景
INSERT INTO ac_scenes (code, name, name_en, icon, description, settings, is_default) VALUES
('morning', '早安模式', 'Morning Mode', 'el-icon-sunny', '早上上班前自动开启空调，预热/预冷办公区域', '{"target_temp": 24, "mode": "cool", "power": true}', TRUE),
('work', '上班模式', 'Work Mode', 'el-icon-briefcase', '工作时间保持舒适温度', '{"target_temp": 25, "mode": "auto", "power": true}', FALSE),
('lunch', '午休模式', 'Lunch Mode', 'el-icon-coffee-cup', '午休时间节能运行', '{"target_temp": 27, "mode": "fan", "power": true}', FALSE),
('evening', '下班模式', 'Evening Mode', 'el-icon-moon', '下班后降低能耗', '{"target_temp": 28, "mode": "cool", "power": true}', FALSE),
('night', '夜间模式', 'Night Mode', 'el-icon-moon', '深夜节能运行', '{"target_temp": 26, "mode": "auto", "power": false}', FALSE),
('meeting', '会议模式', 'Meeting Mode', 'el-icon-user-solid', '会议室专用，温度更低', '{"target_temp": 23, "mode": "cool", "power": true}', FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 插入定时任务示例
INSERT INTO ac_schedules (device_id, scene_code, name, cron_expression, action, action_value, weekdays, is_active) VALUES
(NULL, 'morning', '早间预热', '0 30 8 * *', 'scene', 'morning', '1,2,3,4,5', TRUE),
(NULL, 'work', '上班确认', '0 0 9 * *', 'scene', 'work', '1,2,3,4,5', TRUE),
(NULL, 'lunch', '午休切换', '0 0 12 * *', 'scene', 'lunch', '1,2,3,4,5', TRUE),
(NULL, 'evening', '下班节能', '0 0 18 * *', 'scene', 'evening', '1,2,3,4,5', TRUE),
('AC-001', NULL, '大厅夜间关闭', '0 22 * * *', 'power_off', 'off', '1,2,3,4,5', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
