const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "smart-building-jwt-2024";

let pool;

async function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smart_building",
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4",
  });
  return pool;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  return res;
}

function jsonRes(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function verifyToken(req) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), JWT_SECRET);
  } catch { return null; }
}

// 模拟数据（无数据库时使用）
const DEMO_DATA = {
  portal: {
    company_name: "智慧楼宇科技有限公司",
    company_name_en: "Smart Building Technology Co., Ltd.",
    slogan: "AI驱动的智慧楼宇节能管理平台",
    slogan_en: "AI-Powered Smart Building Energy Management Platform",
    logo_url: "/logo.png",
    logo_url_2: "",
    banner_url: "",
    banner_logo_url: "",
    products: [
      { id: 1, title: "AI节能控制系统", title_en: "AI Energy Saving System", desc: "基于深度学习的能耗优化", image: "" },
      { id: 2, title: "智能空调管理", title_en: "Smart AC Management", desc: "实时监控与自动调节", image: "" },
      { id: 3, title: "能耗监测平台", title_en: "Energy Monitoring", desc: "多维度数据分析与报表", image: "" },
      { id: 4, title: "设备管理系统", title_en: "Device Management", desc: "全生命周期设备运维", image: "" }
    ],
    solutions: [
      { id: 1, title: "商业综合体解决方案", title_en: "Commercial Complex Solution" },
      { id: 2, title: "写字楼解决方案", title_en: "Office Building Solution" },
      { id: 3, title: "工业园区解决方案", title_en: "Industrial Park Solution" }
    ]
  },
  devices: [
    { id: 1, project_id: "default", device_code: "AC-001", name: "1F中央空调主机", device_type: "chiller", location: "B栋一楼机房", status: "online" },
    { id: 2, project_id: "default", device_code: "PUMP-CW001", name: "冷水泵1号", device_type: "chilled_pump", location: "B栋地下一层", status: "online" },
    { id: 3, project_id: "default", device_code: "TOWER-CT001", name: "冷却塔A", device_type: "cooling_tower", location: "楼顶北侧", status: "online" },
    { id: 4, project_id: "default", device_code: "AHU-AH001", name: "AHU新风机组1号", device_type: "ahu", location: "A栋3层", status: "offline" },
    { id: 5, project_id: "default", device_code: "METER-E001", name: "总电表", device_type: "smart_meter", location: "配电室", status: "online" }
  ],
  energy_daily: [
    { id: 1, summary_date: "2026-04-19", total_energy_kwh: 1250.50, total_cost_yuan: 937.88, chiller_energy_kwh: 680.00, pump_energy_kwh: 220.00, cooling_tower_energy_kwh: 150.50, terminal_energy_kwh: 180.00, peak_power_kw: 320, avg_power_kw: 185, saving_rate: 12.5 },
    { id: 2, summary_date: "2026-04-18", total_energy_kwh: 1380.20, total_cost_yuan: 1035.15, chiller_energy_kwh: 750.30, pump_energy_kwh: 245.00, cooling_tower_energy_kwh: 165.80, terminal_energy_kwh: 200.10, peak_power_kw: 350, avg_power_kwh: 198, saving_rate: 10.8 },
    { id: 3, summary_date: "2026-04-17", total_energy_kwh: 1420.80, total_cost_yuan: 1065.60, chiller_energy_kwh: 775.00, pump_energy_kwh: 253.40, cooling_tower_energy_kwh: 170.50, terminal_energy_kwh: 208.90, peak_power_kw: 365, avg_power_kwh: 205, saving_rate: 11.2 }
  ],
  alerts: [
    { id: 1, alert_type: "saving_low", level: "warning", title: "今日节能率偏低", message: "当前节能率仅8.2%，低于目标值12%", current_value: 8.2, threshold_value: 12, unit: "%", created_at: new Date().toISOString() },
    { id: 2, alert_type: "power_peak", level: "danger", title: "功率峰值告警", message: "当前瞬时功率380kW，接近上限400kW", current_value: 380, threshold_value: 400, unit: "kW", created_at: new Date().toISOString() }
  ],
  control_logs: [
    { id: 1, device_name: "1F中央空调主机", action: "set_target_temp", action_label: "设定温度", params: '{"temp":24}', operator: "admin", result: "success", created_at: new Date().toISOString() },
    { id: 2, device_name: "冷却塔A", action: "toggle_power", action_label: "启停控制", params: '{"power":"on"}', operator: "admin", result: "success", created_at: new Date(Date.now()-3600000).toISOString() },
    { id: 3, device_name: "冷水泵1号", action: "adjust_speed", action_label: "调速控制", params: '{"speed":80}', operator: "admin", result: "fail", created_at: new Date(Date.now()-7200000).toISOString() },
    { id: 4, device_name: "AHU新风机组1号", action: "toggle_mode", action_label: "模式切换", params: '{"mode":"eco"}', operator: "admin", result: "success", created_at: new Date(Date.now()-10800000).toISOString() }
  ],
  energy_monitor_data: Array.from({ length: 24 }, (_, i) => ({
    id: i + 1, project_id: "default", category: "total",
    power_kw: 150 + Math.random() * 100,
    energy_kwh: (150 + Math.random() * 100) * 0.5,
    cost_yuan: (150 + Math.random() * 100) * 0.5 * 0.75,
    recorded_at: `${new Date().toISOString().slice(0,10)} ${String(i).padStart(2,'0')}:00:00`
  }))
};

exports.main = async (event, context) => {
  const { method, path, headers, query, body } = event;
  const db = await getPool();
  const req = { method, path, headers, query, body };
  const res = { statusCode: 200, headers: {}, setHeader(k,v){this.headers[k]=v}, end(d){this.body=d} };
  cors(res);
  
  if (method === "OPTIONS") { jsonRes(res, 204, ""); return { statusCode:204, headers:res.headers, body:"" }; }

  // 检查数据库是否可用
  let dbOk = false;
  try {
    const conn = await db.getConnection(); await conn.ping(); conn.release(); dbOk = true;
  } catch(e) { /* 数据库不可用，用模拟数据 */ }

  try {
    // === 认证 ===
    if (path === "/api/auth/login" && method === "POST") {
      jsonRes(res, 200, { success: true, token: jwt.sign({id:1,username:"admin",role:"admin"},JWT_SECRET,{expiresIn:'7d'}), user:{id:1,username:"admin",role:"admin"} });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 门户 ===
    if (path === "/api/portal" && method === "GET") {
      if (dbOk) { const [rows]=await db.execute("SELECT content FROM portal_config WHERE id=1"); jsonRes(res,200,{success:true,data:rows.length?JSON.parse(rows[0].content):DEEMO_DATA.portal}); }
      else { jsonRes(res, 200, { success: true, data: DEMO_DATA.portal }); }
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    if (path === "/api/portal" && method === "PUT") {
      const user=verifyToken(req); if(!user){jsonRes(res,403,{success:false,error:"未授权"});return{statusCode:res.statusCode,headers:res.headers,body:res.body};}
      jsonRes(res, 200, { success: true, message: "已保存（演示模式）" });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 设备 ===
    if (path === "/api/devices" && method === "GET") {
      if(dbOk){const [rows]=await db.execute("SELECT * FROM devices ORDER BY id DESC");jsonRes(res,200,{success:true,data:rows});}
      else{jsonRes(res,200,{success:true,data:DEMO_DATA.devices});}
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === Dashboard ===
    if (path === "/api/dashboard/overview" && method === "GET") {
      jsonRes(res, 200, { success: true, data: { device_count: DEMO_DATA.devices.length, alert_count: DEMO_ALERTS.length, total_energy: 3851.50, saving_rate: 11.5 } });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 能耗数据 ===
    if (path?.startsWith("/api/energy-monitor/data") && method === "GET") {
      jsonRes(res, 200, { success: true, data: dbOk ? [] : DEMO_DATA.energy_monitor_data });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    if (path?.startsWith("/api/energy-monitor/daily") && method === "GET") {
      jsonRes(res, 200, { success: true, data: DEMO_DATA.energy_daily });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    if (path?.startsWith("/api/energy-monitor/alerts") && method === "GET") {
      jsonRes(res, 200, { success: true, data: DEMO_DATA.alerts });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 控制日志 ===
    if (path === "/api/control/logs" && method === "GET") {
      jsonRes(res, 200, { success: true, data: DEMO_DATA.control_logs });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 设置 ===
    if (path === "/api/settings/api-key" && method === "GET") {
      jsonRes(res, 200, { success: true, data: [{id:1,provider:"deepseek",model:"deepseek-chat",is_active:1}] });
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 空调设备 ===
    if (path === "/api/ac/devices" && method === "GET") {
      jsonRes(res,200,{success:true,data:[
        {id:"ac-1",name:"1F大堂空调",location:"一层大厅",status:"on",temperature:24.5,target_temp:24,mode:"cool"},
        {id:"ac-2",name:"2F办公区空调",location:"二层办公区",status:"off",temperature:27.2,target_temp:26,mode:"cool"},
        {id:"ac-3",name:"3F会议室空调",location:"三层会议室",status:"on",temperature:23.8,target_temp:24,mode:"auto"}
      ]});
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    if (path === "/api/ac/toggle" && method === "POST") {
      jsonRes(res,200,{success:true,message:"操作成功"});
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 停车场 ===
    if (path === "/api/parking/spaces" && method === "GET") {
      const spaces=[];
      for(let f=1;f<=3;f++)for(let n=1;n<=10;n++)spaces.push({id:`p${f}-${n}`,floor:f,zone:`${f}F区`,number:n,status:["available","occupied","reserved"][Math.floor(Math.random()*3)]});
      jsonRes(res,200,{success:true,data:spaces});
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 灯光回路 ===
    if (path === "/api/lighting/circuits" && method === "GET") {
      jsonRes(res,200,{success:true,data:[
        {id:"l1",name:"1F走廊灯",zone:"公共区域",floor:1,status:"on",brightness:80},
        {id:"l2",name:"2F办公室灯",zone:"办公区域",floor:2,status:"on",brightness:70},
        {id:"l3",name:"3F会议室灯",zone:"会议区域",floor:3,status:"off",brightness:0},
        {id:"l4",name:"地下车库灯",zone:"停车场",floor:-1,status:"on",brightness:50}
      ]});
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // === 摄像头 ===
    if (path === "/api/cameras" && method === "GET") {
      jsonRes(res,200,{success:true,data:[
        {id:"cam1","name":"正门入口摄像头","location":"大门入口",status:"online"},
        {id:"cam2","name":"大堂摄像头","location":"一楼大厅",status:"online"},
        {id:"cam3","name":"电梯间摄像头","location":"电梯厅",status:"offline"}
      ]});
      return { statusCode: res.statusCode, headers: res.headers, body: res.body };
    }

    // 404
    jsonRes(res, 404, { success:false, error: "Not found" });

  } catch(err) {
    console.error("API Error:", err);
    jsonRes(res, 500, { success:false, error: err.message });
  }

  return { statusCode: res.statusCode, headers: res.headers, body: res.body };
};
