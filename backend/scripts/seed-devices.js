/**
 * 设备测试数据生成脚本
 * - 为 devices 表补充完整设备数据（覆盖所有类型，project_id=1）
 * - 补充 device_realtime_data 实时数据
 * - 添加 ahu 枚举值到 device_type
 */
import mysql from 'mysql2/promise'

const pool = await mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smart_building',
  waitForConnections: true
})

// ====== 1. 给 devices.device_type 枚举加上 ahu ======
async function fixEnum() {
  console.log('\n🔧  检查/修复 device_type 枚举...')
  try {
    // MySQL 修改枚举需要 ALTER TABLE
    await pool.query(`
      ALTER TABLE devices MODIFY COLUMN device_type 
      ENUM('smart_meter','smart_valve_air','smart_valve_water','temp_sensor_water',
           'temp_sensor_air','pressure_sensor','chiller','cooling_tower','ahu')
      NOT NULL
    `)
    console.log('✅ device_type 枚举已添加 ahu')
  } catch (e) {
    if (e.message.includes('already')) {
      console.log('✅ ahu 已存在于枚举中')
    } else {
      console.log('⚠️ 修改枚举时出错(可能已存在):', e.message)
    }
  }
}

// ====== 2. 清理旧数据，插入新设备 ======
async function seedDevices() {
  console.log('\n🏗️  生成设备数据...')

  // 清理旧数据（保留表结构）
  await pool.query('DELETE FROM device_realtime_data')
  await pool.query('DELETE FROM devices')

  const now = new Date()
  const devices = [
    // ---- 冷机类 (Chiller) x3 ----
    { code: 'CH-01', name: 'Centrifugal Chiller No.1', type: 'chiller',          status: 'online',       loc: 'LG Chiller Plant Room',     floor: -1, brand: 'Carrier', model: '19XR-600', power: 520, flow: 900, pressure: 0.9 },
    { code: 'CH-02', name: 'Centrifugal Chiller No.2', type: 'chiller',          status: 'online',       loc: 'LG Chiller Plant Room',     floor: -1, brand: 'Trane', model: 'CVHE-550', power: 450, flow: 800, pressure: 0.85 },
    { code: 'CH-03', name: 'Screw Chiller No.3',        type: 'chiller',          status: 'maintenance',  loc: 'LG Chiller Plant Room',     floor: -1, brand: 'York', model: 'YVWA-280', power: 220, flow: 420, pressure: 0.75 },

    // ---- Cooling Tower x2 ----
    { code: 'CT-01', name: 'Cooling Tower No.1',         type: 'cooling_tower',    status: 'online',       loc: 'Rooftop Tower Zone',       floor: 10, brand: 'Marley', model: 'NC-350',   power: 18.5, flow: 700, pressure: null },
    { code: 'CT-02', name: 'Cooling Tower No.2',         type: 'cooling_tower',    status: 'fault',        loc: 'Rooftop Tower Zone',       floor: 10, brand: 'BAC', model: 'Serie3000', power: 15, flow: 580, pressure: null },

    // ---- AHU x4 ----
    { code: 'AHU-GF-A', name: 'Main Lobby AHU',           type: 'ahu',              status: 'online',       loc: 'Ground Floor Main Lobby',  floor: 0,  brand: 'Carrier', model: '39CQ-20',  power: 15, flow: 18000, pressure: 650 },
    { code: 'AHU-L1-B', name: 'Level 1 Retail AHU',       type: 'ahu',              status: 'online',       loc: 'L1 East Wing Retail',      floor: 1,  brand: 'Trane', model: 'AHU-15K',   power: 11, flow: 12000, pressure: 550 },
    { code: 'AHU-L2-C', name: 'Level 2 Food Court AHU',   type: 'ahu',              status: 'offline',      loc: 'L2 Food Court Area',       floor: 2,  brand: 'York', model: 'YKAC-10',   power: 7.5, flow: 9000,  pressure: 450 },
    { code: 'AHU-LG-D', name: 'Basement Parking AHU',     type: 'ahu',              status: 'online',       loc: 'LG Basement Parking',      floor: -1, brand: 'Daikin', model: 'AHU-08K',  power: 7.5, flow: 14000, pressure: 580 },

    // ---- Smart Meter x3 ----
    { code: 'SM-TOTAL', name: 'Main Incomer Smart Meter', type: 'smart_meter',      status: 'online',       loc: 'LV Switchgear Room',       floor: -1, brand: 'Schneider', model: 'iEM3310', power: null, flow: null, pressure: null },
    { code: 'SM-HVAC',  name: 'HVAC System Smart Meter',  type: 'smart_meter',      status: 'online',       loc: 'LV Switchgear Room',       floor: -1, brand: 'Schneider', model: 'iEM3315', power: null, flow: null, pressure: null },
    { code: 'SM-LIGHT', name: 'Lighting System Meter',     type: 'smart_meter',      status: 'online',       loc: 'LV Switchgear Room',       floor: -1, brand: 'ABB', model: 'B23',     power: null, flow: null, pressure: null },

    // ---- Air Damper x4 ----
    { code: 'VA-GF-01', name: 'GF Fresh Air Damper',      type: 'smart_valve_air',  status: 'online',       loc: 'GF AHU Room',              floor: 0,  brand: 'Honeywell', model: 'ML7420A',  power: null, flow: null, pressure: null },
    { code: 'VA-L1-01', name: 'L1 Return Air Damper',     type: 'smart_valve_air',  status: 'online',       loc: 'L1 Mechanical Room',       floor: 1,  brand: 'Honeywell', model: 'ML7420B',  power: null, flow: null, pressure: null },
    { code: 'VA-L2-01', name: 'L2 Exhaust Damper',         type: 'smart_valve_air',  status: 'fault',       loc: 'L2 Exhaust Fan Room',      floor: 2,  brand: 'Johnson', model: 'VA-9100',  power: null, flow: null, pressure: null },
    { code: 'VA-LG-01', name: 'LG Supply Damper',          type: 'smart_valve_air',  status: 'online',       loc: 'LG Supply Fan Room',       floor: -1, brand: 'Honeywell', model: 'ML7420C',  power: null, flow: null, pressure: null },

    // ---- Water Valve x3 ----
    { code: 'VW-CHW-01',name: 'Chilled Water Supply Valve',type:'smart_valve_water',status:'online',       loc: 'LG Chiller Plant Room',     floor: -1, brand: 'Siemens', model: 'SKC62',   power: null, flow: null, pressure: null },
    { code: 'VW-CW-01', name: 'Condenser Water Valve',     type:'smart_valve_water',status:'online',       loc: 'LG Chiller Plant Room',     floor: -1, brand: 'Siemens', model: 'SKD60',   power: null, flow: null, pressure: null },
    { code: 'VW-AHU-01',name: 'AHU LG-D Water Valve',     type:'smart_valve_water',status:'online',       loc: 'LG Mechanical Room',       floor: -1, brand: 'Honeywell',model: 'V5050',   power: null, flow: null, pressure: null },

    // ---- Temp Sensor x4 ----
    { code: 'TW-CHWS',  name: 'CHW Supply Temp Sensor',   type:'temp_sensor_water',status:'online',       loc: 'LG Chiller Plant Room',     floor: -1, brand: 'PT100', model: 'WRNK-191', power: null, flow: null, pressure: null },
    { code: 'TW-CHWR',  name: 'CHW Return Temp Sensor',   type:'temp_sensor_water',status:'online',       loc: 'LG Chiller Plant Room',     floor: -1, brand: 'PT100', model: 'WRNK-192', power: null, flow: null, pressure: null },
    { code: 'TA-SA-01', name: 'Supply Air Temp Sensor',   type:'temp_sensor_air',  status:'online',       loc: 'GF Main Lobby',           floor: 0,  brand: 'Siemens', model: 'QFM2160', power: null, flow: null, pressure: null },
    { code: 'TA-RA-01', name: 'Return Air Temp Sensor',   type:'temp_sensor_air',  status:'online',       loc: 'GF Main Lobby',           floor: 0,  brand: 'Siemens', model: 'QFM2170', power: null, flow: null, pressure: null },

    // ---- Pressure Sensor x2 ----
    { code: 'PS-CHWP',  name: 'CHW Pump Discharge Sensor',type:'pressure_sensor', status:'online',       loc: 'LG Pump Room',             floor: -1, brand: 'E+H', model: 'Cerabar PMP51', power: null, flow: null, pressure: null },
    { code: 'PS-CWP',   name: 'CW Pump Discharge Sensor', type:'pressure_sensor', status:'offline',      loc: 'LG Pump Room',             floor: -1, brand: 'E+H', model: 'Cerabar PMC51', power: null, flow: null, pressure: null }
  ]

  for (const d of devices) {
    const installDate = new Date(now.getTime() - Math.random() * 365 * 86400000)
    installDate.setMonth(0, 1)
    const warrantyDate = new Date(installDate)
    warrantyDate.setFullYear(warrantyDate.getFullYear() + 5)

    await pool.query(
      `INSERT INTO devices (project_id, device_code, name, device_type, location, floor, brand, model,
        rated_power, rated_flow, rated_pressure, install_date, warranty_date, status, description,
        last_data_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
      ['1', d.code, d.name, d.type, d.loc, d.floor, d.brand, d.model,
        d.power, d.flow, d.pressure,
        installDate.toISOString().slice(0, 10),
        warrantyDate.toISOString().slice(0, 10),
        d.status, `${d.brand} ${d.model} - ${d.loc}`]
    )
  }

  console.log(`✅ 设备数据完成：${devices.length} 台`)
}

// ====== 3. 实时数据 ======
async function seedRealtimeData() {
  console.log('\n📊  生成实时数据...')
  const now = new Date()

  // 获取所有设备ID
  const [devices] = await pool.query('SELECT id, device_type, name FROM devices WHERE project_id = "1"')
  let totalData = 0

  for (const dev of devices) {
    const dataRows = generateDeviceRealtime(dev.id, dev.device_type)
    if (dataRows.length > 0) {
      const values = dataRows.map(r => [
        r.device_id, r.data_type, r.value, r.unit,
        new Date(now.getTime() - Math.random() * 3600000) // 最近1小时内随机时间
      ])
      await pool.query(
        'INSERT INTO device_realtime_data (device_id, data_type, value, unit, recorded_at) VALUES ?',
        [values]
      )
      totalData += dataRows.length
    }

    // 更新 last_data_time（在线设备才有）
    if (dev.status === 'online') {
      await pool.query(
        'UPDATE devices SET last_data_time = NOW() WHERE id = ?',
        [dev.id]
      )
    }
  }

  console.log(`✅ 实时数据完成：${totalData} 条`)
}

function generateDeviceRealtime(deviceId, deviceType) {
  const base = () => +(Math.random() * 20 + 10).toFixed(2)

  switch (deviceType) {
    case 'chiller':
      return [
        { device_id: deviceId, data_type: 'power_kw', value: +(200 + Math.random() * 200).toFixed(1), unit: 'kW' },
        { device_id: deviceId, data_type: 'supply_temp_c', value: +(6 + Math.random() * 2).toFixed(1), unit: '℃' },
        { device_id: deviceId, data_type: 'return_temp_c', value: +(11 + Math.random() * 3).toFixed(1), unit: '℃' },
        { device_id: deviceId, data_type: 'capacity_pct', value: +(40 + Math.random() * 50).toFixed(0), unit: '%' },
        { device_id: deviceId, data_type: 'cop', value: +(4.5 + Math.random() * 2).toFixed(2), unit: '' },
        { device_id: deviceId, data_type: 'running_status', value: 'running', unit: '' }
      ]
    case 'cooling_tower':
      return [
        { device_id: deviceId, data_type: 'fan_speed_rpm', value: +(80 + Math.random() * 120).toFixed(0), unit: 'rpm' },
        { device_id: deviceId, data_type: 'fan_speed_pct', value: +(30 + Math.random() * 60).toFixed(0), unit: '%' },
        { device_id: deviceId, data_type: 'inlet_temp_c', value: +(35 + Math.random() * 3).toFixed(1), unit: '℃' },
        { device_id: deviceId, data_type: 'outlet_temp_c', value: +(29 + Math.random() * 2).toFixed(1), unit: '℃' },
        { device_id: deviceId, data_type: 'power_kw', value: +(5 + Math.random() * 10).toFixed(1), unit: 'kW' }
      ]
    case 'ahu':
      return [
        { device_id: deviceId, data_type: 'supply_air_temp_c', value: +(16 + Math.random() * 4).toFixed(1), unit: '℃' },
        { device_id: deviceId, data_type: 'return_air_temp_c', value: +(24 + Math.random() * 3).toFixed(1), unit: '℃' },
        { device_id: deviceId, data_type: 'fan_speed_pct', value: +(45 + Math.random() * 45).toFixed(0), unit: '%' },
        { device_id: deviceId, data_type: 'valve_opening_pct', value: +(20 + Math.random() * 70).toFixed(0), unit: '%' },
        { device_id: deviceId, data_type: 'air_flow_m3h', value: +(5000 + Math.random() * 8000).toFixed(0), unit: 'm³/h' },
        { device_id: deviceId, data_type: 'power_kw', value: +(3 + Math.random() * 8).toFixed(1), unit: 'kW' }
      ]
    case 'smart_meter':
      return [
        { device_id: deviceId, data_type: 'total_kwh', value: +(100000 + Math.random() * 900000).toFixed(1), unit: 'kWh' },
        { device_id: deviceId, data_type: 'active_power_kw', value: +(150 + Math.random() * 500).toFixed(1), unit: 'kW' },
        { device_id: deviceId, data_type: 'voltage_v', value: +(380 + Math.random() * 20 - 10).toFixed(1), unit: 'V' },
        { device_id: deviceId, data_type: 'current_a', value: +(200 + Math.random() * 300).toFixed(1), unit: 'A' },
        { device_id: deviceId, data_type: 'power_factor', value: +(0.88 + Math.random() * 0.1).toFixed(2), unit: '' }
      ]
    case 'smart_valve_air':
    case 'smart_valve_water':
      return [
        { device_id: deviceId, data_type: 'opening_pct', value: +(Math.random() * 100).toFixed(0), unit: '%' },
        { device_id: deviceId, data_type: 'flow_rate_m3h', value: +(10 + Math.random() * 90).toFixed(1), unit: 'm³/h' },
        { device_id: deviceId, data_type: 'feedback_signal', value: +(4 + Math.random() * 16).toFixed(1), unit: 'mA' }
      ]
    case 'temp_sensor_water':
      return [
        { device_id: deviceId, data_type: 'temperature_c', value: +(5 + Math.random() * 15).toFixed(2), unit: '℃' },
        { device_id: deviceId, data_type: 'humidity_pct', value: +(85 + Math.random() * 14).toFixed(1), unit: '%RH' }
      ]
    case 'temp_sensor_air':
      return [
        { device_id: deviceId, data_type: 'temperature_c', value: +(18 + Math.random() * 12).toFixed(2), unit: '℃' },
        { device_id: deviceId, data_type: 'humidity_pct', value: +(40 + Math.random() * 35).toFixed(1), unit: '%RH' },
        { device_id: deviceId, data_type: 'co2_ppm', value: +(400 + Math.random() * 600).toFixed(0), unit: 'ppm' }
      ]
    case 'pressure_sensor':
      return [
        { device_id: deviceId, data_type: 'pressure_mpa', value: +(0.3 + Math.random() * 1.2).toFixed(3), unit: 'MPa' },
        { device_id:deviceId, data_type: 'pressure_kpa', value: +(300 + Math.random() * 1200).toFixed(1), unit: 'kPa' }
      ]
    default:
      return []
  }
}

// ====== 主流程 ======
console.log('═══════════════════════════════════════')
console.log('   设备管理 & 控制面板 测试数据生成工具')
console.log('═══════════════════════════════════════')

await fixEnum()
await seedDevices()
await seedRealtimeData()

// 验证结果
const [count] = await pool.query("SELECT COUNT(*) as c FROM devices WHERE project_id='1'")
const [rdCount] = await pool.query(`SELECT COUNT(*) as c FROM device_realtime_data drd JOIN devices d ON drd.device_id=d.id WHERE d.project_id='1'`)
const [byType] = await pool.query("SELECT device_type, COUNT(*) as cnt FROM devices WHERE project_id='1' GROUP BY device_type")
const [byStatus] = await pool.query("SELECT status, COUNT(*) as cnt FROM devices WHERE project_id='1' GROUP BY status")

console.log('\n═══════════════════════════════════════')
console.log(`📋 设备总数：${count[0].c} 台`)
console.log(`📊 实时数据：${rdCount[0].c} 条`)
console.log('\n📂 按类型分布：')
for (const t of byType) console.log(`   ${t.device_type.padEnd(22)} ${t.cnt} 台`)
console.log('\n🔌 按状态分布：')
for (const s of byStatus) console.log(`   ${(s.status || 'N/A').padEnd(12)} ${s.cnt} 台`)
console.log('\n✨ 全部完成！\n')

await pool.end()
process.exit(0)
