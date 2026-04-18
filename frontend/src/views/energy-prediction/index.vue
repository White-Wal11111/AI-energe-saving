<template>
  <div class="energy-prediction">
    <div class="page-title">
      <div class="title-left">
        <h1>
          <i class="el-icon-data-analysis"></i>
          {{ isCN ? '节能效率预测' : 'Energy Efficiency Prediction' }}
        </h1>
        <p>{{ isCN ? 'AI驱动的中央空调系统节能潜力分析' : 'AI-driven Energy Saving Potential Analysis' }}</p>
      </div>
    </div>

    <div class="main-content">
      <div class="form-panel">
        <el-tabs v-model="activeTab" type="border-card" class="custom-tabs">
          <!-- 基础信息 -->
          <el-tab-pane :label="isCN ? '基础信息' : 'Basic Info'" name="basic">
            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-office-building"></i>
                <span>{{ isCN ? '建筑信息' : 'Building Information' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '建筑类型' : 'Building Type'">
                      <el-select v-model="form.buildingType" style="width: 100%">
                        <el-option label="办公楼 Office" value="office" />
                        <el-option label="商业综合体 Commercial" value="commercial" />
                        <el-option label="酒店 Hotel" value="hotel" />
                        <el-option label="医院 Hospital" value="hospital" />
                        <el-option label="数据中心 Data Center" value="datacenter" />
                        <el-option label="工业厂房 Industrial" value="industrial" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '建筑面积 (m²)' : 'Building Area (m²)'">
                      <el-input-number v-model="form.buildingArea" :min="100" :max="500000" :step="1000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '运行天数 (天/年)' : 'Operating Days (days/year)'">
                      <el-input-number v-model="form.operatingDays" :min="30" :max="365" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '是否满载运行' : 'Full Load Operation'">
                      <el-switch v-model="form.isFullLoad" :active-text="isCN ? '是' : 'Yes'" :inactive-text="isCN ? '否' : 'No'" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-coin"></i>
                <span>{{ isCN ? '费用信息' : 'Cost Information' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '空调类型' : 'AC Type'">
                      <el-select v-model="form.acType" style="width: 100%">
                        <el-option label="水冷冷水机组 Water Chiller" value="water_chiller" />
                        <el-option label="风冷冷水机组 Air-cooled Chiller" value="air_chiller" />
                        <el-option label="VRF系统 VRF System" value="vrf" />
                        <el-option label="热泵系统 Heat Pump" value="heat_pump" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '空调费用占比 (%)' : 'AC Cost Ratio (%)'">
                      <el-input-number v-model="form.acCostRatio" :min="10" :max="80" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '电单价 (元/kWh)' : 'Electricity Price (CNY/kWh)'">
                      <el-input-number v-model="form.electricityPrice" :min="0.1" :max="2" :precision="2" :step="0.01" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '客户预期节能率 (%)' : 'Expected Saving (%)'">
                      <el-input-number v-model="form.expectedSaving" :min="5" :max="50" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item :label="isCN ? '近12月电费账单 (元)' : 'Last 12 Months Electricity Bills (CNY)'">
                  <el-input v-model="form.electricityBills" type="textarea" :rows="2" :placeholder="isCN ? '可选，填写后可提高预测精度' : 'Optional, improves accuracy'" />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 冷机参数 -->
          <el-tab-pane :label="isCN ? '冷机参数' : 'Chiller'" name="chiller">
            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-box"></i>
                <span>{{ isCN ? '冷机信息' : 'Chiller Information' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '品牌' : 'Brand'">
                      <el-select v-model="form.chiller.brand" style="width: 100%">
                        <el-option label="York" value="york" />
                        <el-option label="Carrier" value="carrier" />
                        <el-option label="Trane" value="trane" />
                        <el-option label="Daikin" value="daikin" />
                        <el-option label="Midea" value="midea" />
                        <el-option label="Other" value="other" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '型号' : 'Model'">
                      <el-input v-model="form.chiller.model" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '出厂年份' : 'Year'">
                      <el-input-number v-model="form.chiller.year" :min="2000" :max="2026" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '铭牌制冷量 (RT)' : 'Capacity (RT)'">
                      <el-input-number v-model="form.chiller.capacity" :min="50" :max="5000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定输入功率 (kW)' : 'Rated Power (kW)'">
                      <el-input-number v-model="form.chiller.ratedPower" :min="10" :max="2000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '数量' : 'Quantity'">
                      <el-input-number v-model="form.chiller.quantity" :min="1" :max="20" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item label="COP">
                      <el-input-number v-model="form.chiller.cop" :min="3" :max="8" :precision="1" :step="0.1" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="IPLV">
                      <el-input-number v-model="form.chiller.iplv" :min="4" :max="10" :precision="1" :step="0.1" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '压缩机类型' : 'Compressor Type'">
                      <el-select v-model="form.chiller.compressorType" style="width: 100%">
                        <el-option label="离心 Centrifugal" value="centrifugal" />
                        <el-option label="螺杆 Screw" value="screw" />
                        <el-option label="活塞 Piston" value="piston" />
                        <el-option label="涡旋 Scroll" value="scroll" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '冷媒种类' : 'Refrigerant'">
                      <el-select v-model="form.chiller.refrigerant" style="width: 100%">
                        <el-option label="R410A" value="r410a" />
                        <el-option label="R134a" value="r134a" />
                        <el-option label="R407C" value="r407c" />
                        <el-option label="R22" value="r22" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '现有控制方式' : 'Control Mode'">
                      <el-select v-model="form.chiller.controlMode" style="width: 100%">
                        <el-option :label="isCN ? '本地手动 Manual' : 'Local Manual'" value="manual" />
                        <el-option :label="isCN ? '简单PLC' : 'Simple PLC'" value="plc" />
                        <el-option :label="isCN ? '有通讯接口' : 'With Comm Port'" value="comm" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 水泵参数 -->
          <el-tab-pane :label="isCN ? '水泵参数' : 'Pumps'" name="pumps">
            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-water-perfect"></i>
                <span>{{ isCN ? '冷冻水泵' : 'Chilled Water Pump' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '品牌' : 'Brand'">
                      <el-input v-model="form.chilledPump.brand" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '型号' : 'Model'">
                      <el-input v-model="form.chilledPump.model" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '出厂年份' : 'Year'">
                      <el-input-number v-model="form.chilledPump.year" :min="2000" :max="2026" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定流量 (m³/h)' : 'Flow Rate (m³/h)'">
                      <el-input-number v-model="form.chilledPump.flowRate" :min="10" :max="5000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定扬程 (m)' : 'Head (m)'">
                      <el-input-number v-model="form.chilledPump.head" :min="5" :max="200" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定功率 (kW)' : 'Power (kW)'">
                      <el-input-number v-model="form.chilledPump.power" :min="1" :max="500" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定电压 (V)' : 'Voltage (V)'">
                      <el-input-number v-model="form.chilledPump.voltage" :min="220" :max="10000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定电流 (A)' : 'Current (A)'">
                      <el-input-number v-model="form.chilledPump.current" :min="1" :max="1000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '额定转速 (rpm)' : 'RPM'">
                      <el-input-number v-model="form.chilledPump.rpm" :min="500" :max="3000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item :label="isCN ? '是否有变频器 (VFD)' : 'Has VFD'">
                  <el-switch v-model="form.chilledPump.hasVfd" :active-text="isCN ? '是' : 'Yes'" :inactive-text="isCN ? '否' : 'No'" />
                </el-form-item>
              </el-form>
            </div>

            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-heavy-rain"></i>
                <span>{{ isCN ? '冷却水泵' : 'Condenser Water Pump' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '额定流量 (m³/h)' : 'Flow Rate (m³/h)'">
                      <el-input-number v-model="form.condenserPump.flowRate" :min="10" :max="5000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '额定扬程 (m)' : 'Head (m)'">
                      <el-input-number v-model="form.condenserPump.head" :min="5" :max="200" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '额定功率 (kW)' : 'Power (kW)'">
                      <el-input-number v-model="form.condenserPump.power" :min="1" :max="500" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '是否有变频器 (VFD)' : 'Has VFD'">
                      <el-switch v-model="form.condenserPump.hasVfd" :active-text="isCN ? '是' : 'Yes'" :inactive-text="isCN ? '否' : 'No'" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 冷却塔 -->
          <el-tab-pane :label="isCN ? '冷却塔' : 'Cooling Tower'" name="tower">
            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-wind"></i>
                <span>{{ isCN ? '冷却塔参数' : 'Cooling Tower Parameters' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '品牌' : 'Brand'">
                      <el-input v-model="form.coolingTower.brand" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '型号' : 'Model'">
                      <el-input v-model="form.coolingTower.model" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '台数' : 'Quantity'">
                      <el-input-number v-model="form.coolingTower.quantity" :min="1" :max="20" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '处理流量 (m³/h)' : 'Flow Rate (m³/h)'">
                      <el-input-number v-model="form.coolingTower.flowRate" :min="100" :max="10000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '风机电机功率 (kW)' : 'Fan Power (kW)'">
                      <el-input-number v-model="form.coolingTower.fanPower" :min="1" :max="200" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '进水温度 (℃)' : 'Inlet Temp (℃)'">
                      <el-input-number v-model="form.coolingTower.inletTemp" :min="20" :max="45" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '出水温度 (℃)' : 'Outlet Temp (℃)'">
                      <el-input-number v-model="form.coolingTower.outletTemp" :min="15" :max="35" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '设计湿球温度 (℃)' : 'Wet Bulb Temp (℃)'">
                      <el-input-number v-model="form.coolingTower.wetBulbTemp" :min="20" :max="35" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item :label="isCN ? '风机是否变频' : 'Variable Frequency Fan'">
                  <el-switch v-model="form.coolingTower.variableFan" :active-text="isCN ? '是' : 'Yes'" :inactive-text="isCN ? '否' : 'No'" />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 末端设备 -->
          <el-tab-pane :label="isCN ? '末端设备' : 'Terminal'" name="terminal">
            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-magic-stick"></i>
                <span>{{ isCN ? '末端设备参数' : 'Terminal Equipment' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-form-item :label="isCN ? 'AHU数量' : 'AHU Quantity'">
                      <el-input-number v-model="form.terminal.ahuQuantity" :min="0" :max="500" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? 'FCU数量' : 'FCU Quantity'">
                      <el-input-number v-model="form.terminal.fauQuantity" :min="0" :max="5000" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item :label="isCN ? '新风机组数量' : 'Fresh Air Unit'">
                      <el-input-number v-model="form.terminal.totalQuantity" :min="0" :max="100" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item :label="isCN ? '分布情况' : 'Distribution'">
                  <el-input v-model="form.terminal.flowDistribution" type="textarea" :rows="2" :placeholder="isCN ? '如：楼层分布、送风方式等' : 'e.g., floor distribution, air supply method'" />
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '是否有电动二通阀' : 'Has Electric Valve'">
                      <el-switch v-model="form.terminal.hasValve" :active-text="isCN ? '是' : 'Yes'" :inactive-text="isCN ? '否' : 'No'" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '温控器类型' : 'Thermostat Type'">
                      <el-select v-model="form.terminal.thermostatType" style="width: 100%">
                        <el-option :label="isCN ? '本地温控' : 'Local'" value="local" />
                        <el-option :label="isCN ? 'DDC控制' : 'DDC'" value="ddc" />
                        <el-option :label="isCN ? 'BA系统接入' : 'BA Connected'" value="ba" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item :label="isCN ? '滤网清洁状况' : 'Filter Condition'">
                  <el-select v-model="form.terminal.filterCondition" style="width: 100%">
                    <el-option :label="isCN ? '正常 Normal' : 'Normal'" value="normal" />
                    <el-option :label="isCN ? '轻微脏堵' : 'Slightly Dirty'" value="slight" />
                    <el-option :label="isCN ? '严重脏堵' : 'Severely Dirty'" value="severe" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>

            <div class="section-card">
              <div class="section-header">
                <i class="el-icon-set-up"></i>
                <span>{{ isCN ? '阀门与管路' : 'Valves & Piping' }}</span>
              </div>
              <el-form label-position="top" class="compact-form">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '旁通阀类型' : 'Bypass Valve'">
                      <el-select v-model="form.valves.bypassValve" style="width: 100%">
                        <el-option :label="isCN ? '手动阀' : 'Manual'" value="manual" />
                        <el-option :label="isCN ? '电动阀' : 'Electric'" value="electric" />
                        <el-option :label="isCN ? '无旁通阀' : 'No Bypass'" value="none" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item :label="isCN ? '平衡阀类型' : 'Balance Valve'">
                      <el-select v-model="form.valves.balanceValve" style="width: 100%">
                        <el-option :label="isCN ? '静态平衡阀' : 'Static'" value="static" />
                        <el-option :label="isCN ? '动态平衡阀' : 'Dynamic'" value="dynamic" />
                        <el-option :label="isCN ? '无平衡阀' : 'None'" value="none" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item :label="isCN ? '管路保温状况' : 'Insulation Condition'">
                  <el-select v-model="form.valves.insulation" style="width: 100%">
                    <el-option :label="isCN ? '良好 Good' : 'Good'" value="good" />
                    <el-option :label="isCN ? '一般 Normal' : 'Normal'" value="normal" />
                    <el-option :label="isCN ? '老化/破损' : 'Aging/Damaged'" value="poor" />
                  </el-select>
                </el-form-item>
                <el-form-item :label="isCN ? '是否有智能电表' : 'Smart Meter'">
                  <el-switch v-model="form.valves.hasSmartMeter" :active-text="isCN ? '是' : 'Yes'" :inactive-text="isCN ? '否' : 'No'" />
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="form-actions">
          <el-button type="primary" size="large" :loading="isCalculating" @click="calculateSavings">
            <i class="el-icon-magic-stick"></i>
            {{ isCN ? '开始分析' : 'Analyze' }}
          </el-button>
          <el-button type="success" size="large" @click="saveFormData">
            <i class="el-icon-folder-checked"></i>
            {{ isCN ? '保存' : 'Save' }}
          </el-button>
          <el-button size="large" @click="resetForm">
            <i class="el-icon-refresh"></i>
            {{ isCN ? '重置' : 'Reset' }}
          </el-button>
        </div>
      </div>

      <!-- 结果面板 -->
      <div class="results-panel">
        <div class="results-card" :class="{ 'has-result': hasResult }">
          <div class="results-header">
            <i class="el-icon-data-line"></i>
            <span>{{ isCN ? '分析结果' : 'Analysis Result' }}</span>
          </div>

          <div v-if="!hasResult" class="empty-state">
            <i class="el-icon-pie-chart"></i>
            <p>{{ isCN ? '请填写设备参数并点击"开始分析"' : 'Fill in parameters and click "Analyze"' }}</p>
          </div>

          <div v-else class="results-content">
            <!-- 节能率 -->
            <div class="saving-rate-section">
              <el-progress type="circle" :percentage="result.totalSaving" :width="160" :stroke-width="12" :color="savingRateColor">
                <template #default>
                  <div class="rate-text">
                    <span class="rate-value">{{ result.totalSaving.toFixed(1) }}%</span>
                    <span class="rate-label">{{ isCN ? '节能率' : 'Saving Rate' }}</span>
                  </div>
                </template>
              </el-progress>
              <div class="rate-tags">
                <el-tag :type="result.totalSaving >= form.expectedSaving ? 'success' : 'warning'" size="small">
                  {{ isCN ? '预期' : 'Expected' }}: {{ form.expectedSaving }}%
                </el-tag>
                <el-tag :type="result.method === 'deepseek' ? 'primary' : 'info'" size="small">
                  <i :class="result.method === 'deepseek' ? 'el-icon-moon-night' : 'el-icon-odometer'"></i>
                  {{ result.method === 'deepseek' ? 'AI' : 'Local' }}
                </el-tag>
              </div>
            </div>

            <!-- 年度节省 -->
            <div class="saving-amount-section">
              <div class="amount-card">
                <span class="amount-label">{{ isCN ? '年节省电费' : 'Yearly Saving' }}</span>
                <span class="amount-value">¥{{ result.yearlySaving.toLocaleString() }}</span>
              </div>
              <div class="amount-card">
                <span class="amount-label">{{ isCN ? '年节省电量' : 'Yearly Saving' }}</span>
                <span class="amount-value">{{ result.yearlySavingKwh.toLocaleString() }} kWh</span>
              </div>
            </div>

            <!-- 可信度 -->
            <div class="confidence-section">
              <div class="confidence-title">
                <span>{{ isCN ? '预测可信度' : 'Confidence' }}</span>
                <span class="confidence-value" :style="{ color: confidenceColor }">{{ (result.confidence * 100).toFixed(0) }}%</span>
              </div>
              <el-progress :percentage="result.confidence * 100" :color="confidenceColor" :show-text="false" />
            </div>

            <!-- 系统节能明细 -->
            <div class="breakdown-section">
              <h4>{{ isCN ? '系统节能明细' : 'Energy Saving Breakdown' }}</h4>
              <div class="breakdown-list">
                <div v-for="item in result.breakdown" :key="item.name" class="breakdown-item">
                  <div class="breakdown-info">
                    <span class="breakdown-name">{{ item.name }}</span>
                    <span class="breakdown-value">{{ item.saving }}%</span>
                  </div>
                  <el-progress :percentage="item.saving" :color="item.color" :show-text="false" :stroke-width="6" />
                </div>
              </div>
            </div>

            <!-- AI建议 -->
            <div class="ai-recommendations" v-if="result.recommendations && result.recommendations.length > 0">
              <h4><i class="el-icon-chat-dot-round"></i> {{ isCN ? '优化建议' : 'Recommendations' }}</h4>
              <ul class="recommendation-list">
                <li v-for="(rec, idx) in result.recommendations" :key="idx">{{ rec }}</li>
              </ul>
            </div>

            <!-- 操作按钮 -->
            <div class="result-actions">
              <el-button type="primary" plain @click="exportReport">
                <i class="el-icon-download"></i>
                {{ isCN ? '导出报告' : 'Export Report' }}
              </el-button>
              <el-button type="primary" plain @click="saveProject">
                <i class="el-icon-folder-opened"></i>
                {{ isCN ? '保存项目' : 'Save Project' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { analyzeEnergy } from './api'

const isCN = inject('isCN', ref(true))
const activeTab = ref('basic')

const form = ref({
  buildingType: '',
  buildingArea: undefined,
  isFullLoad: false,
  operatingDays: undefined,
  acType: '',
  acCostRatio: undefined,
  electricityPrice: undefined,
  electricityBills: '',
  expectedSaving: undefined,
  chiller: {
    brand: '',
    model: '',
    year: undefined,
    capacity: undefined,
    ratedPower: undefined,
    cop: undefined,
    iplv: undefined,
    quantity: undefined,
    compressorType: '',
    refrigerant: '',
    controlMode: ''
  },
  chilledPump: {
    brand: '',
    model: '',
    year: undefined,
    flowRate: undefined,
    head: undefined,
    power: undefined,
    voltage: undefined,
    current: undefined,
    rpm: undefined,
    hasVfd: false
  },
  condenserPump: {
    flowRate: undefined,
    head: undefined,
    power: undefined,
    hasVfd: false
  },
  coolingTower: {
    brand: '',
    model: '',
    quantity: undefined,
    year: undefined,
    flowRate: undefined,
    fanPower: undefined,
    variableFan: false,
    inletTemp: undefined,
    outletTemp: undefined,
    wetBulbTemp: undefined
  },
  terminal: {
    ahuQuantity: undefined,
    fauQuantity: undefined,
    totalQuantity: undefined,
    flowDistribution: '',
    hasValve: false,
    thermostatType: '',
    filterCondition: ''
  },
  valves: {
    bypassValve: '',
    balanceValve: '',
    insulation: '',
    hasSmartMeter: false
  }
})

const isCalculating = ref(false)
const hasResult = ref(false)

const result = ref({
  totalSaving: 0,
  yearlySaving: 0,
  yearlySavingKwh: 0,
  confidence: 0,
  method: 'local',
  breakdown: [],
  recommendations: []
})

const savingRateColor = computed(() => {
  if (result.value.totalSaving >= 25) return '#67c23a'
  if (result.value.totalSaving >= 15) return '#409eff'
  if (result.value.totalSaving >= 10) return '#e6a23c'
  return '#909399'
})

const confidenceColor = computed(() => {
  if (result.value.confidence >= 0.85) return '#67c23a'
  if (result.value.confidence >= 0.65) return '#e6a23c'
  return '#f56c6c'
})

async function calculateSavings() {
  isCalculating.value = true
  hasResult.value = false

  try {
    const apiResult = await analyzeEnergy({
      ...form.value,
      isCN: isCN.value
    })
    
    result.value = {
      totalSaving: apiResult.totalSaving || 0,
      yearlySaving: apiResult.yearlySaving || 0,
      yearlySavingKwh: apiResult.yearlySavingKwh || 0,
      confidence: apiResult.confidence || 0.5,
      method: apiResult.method || 'local',
      breakdown: apiResult.breakdown || [
        { name: isCN.value ? '冷水机组' : 'Chiller', saving: 35, color: '#409eff' },
        { name: isCN.value ? '冷冻水泵' : 'Pump', saving: 20, color: '#67c23a' },
        { name: isCN.value ? '冷却塔' : 'Tower', saving: 15, color: '#909399' },
        { name: isCN.value ? '末端设备' : 'Terminal', saving: 18, color: '#e6a23c' },
        { name: isCN.value ? '智能控制' : 'Control', saving: 12, color: '#6f42c1' }
      ],
      recommendations: apiResult.recommendations || []
    }

    hasResult.value = true

    if (apiResult.method === 'deepseek') {
      ElMessage.success(isCN.value ? 'AI分析完成！' : 'AI Analysis Complete!')
    } else {
      ElMessage.warning(isCN.value ? '使用本地计算，建议配置API Key提高准确度' : 'Using local calculation')
    }
  } catch (error) {
    console.error('Analysis failed:', error)
    ElMessage.error(isCN.value ? '分析失败，请重试' : 'Analysis failed')
  } finally {
    isCalculating.value = false
  }
}

function saveFormData() {
  const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}')
  const storageKey = `energyForm_${currentProject.id || 'default'}`
  localStorage.setItem(storageKey, JSON.stringify(form.value))
  ElMessage.success(isCN.value ? '表单数据已保存' : 'Form data saved')
}

function resetForm() {
  const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}')
  const storageKey = `energyForm_${currentProject.id || 'default'}`
  localStorage.removeItem(storageKey)
  window.location.reload()
}

onMounted(() => {
  const currentProject = JSON.parse(localStorage.getItem('currentProject') || '{}')
  const storageKey = `energyForm_${currentProject.id || 'default'}`
  const saved = localStorage.getItem(storageKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      form.value = { ...form.value, ...parsed }
    } catch (e) { /* ignore */ }
  }
})

function exportReport() {
  ElMessage.info(isCN.value ? '报告导出功能开发中...' : 'Export feature coming soon...')
}

function saveProject() {
  ElMessage.info(isCN.value ? '项目保存功能开发中...' : 'Save project feature coming soon...')
}
</script>

<style scoped>
.energy-prediction {
  padding: 24px;
  min-height: calc(100vh - 120px);
}

.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title h1 i {
  color: #409eff;
}

.page-title p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.main-content {
  display: flex;
  gap: 24px;
}

.form-panel {
  flex: 1;
}

.custom-tabs {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.section-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-header {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header i {
  color: #409eff;
}

.compact-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.compact-form :deep(.el-form-item__label) {
  font-size: 13px;
  color: #606266;
}

.compact-form :deep(.el-input__wrapper),
.compact-form :deep(.el-input-number),
.compact-form :deep(.el-textarea__inner) {
  background-color: #f5f7fa;
  border-color: #dcdfe6;
}

.compact-form :deep(.el-input__wrapper:hover),
.compact-form :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

.compact-form :deep(.el-input__wrapper.is-focus),
.compact-form :deep(.el-textarea__inner:focus) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.compact-form :deep(.el-select .el-input__wrapper) {
  background-color: #f5f7fa;
}

.compact-form :deep(.el-select .el-input.is-focus .el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.form-actions .el-button {
  flex: 1;
  height: 48px;
  font-size: 16px;
}

.results-panel {
  width: 380px;
  flex-shrink: 0;
}

.results-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 24px;
}

.results-header {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-header i {
  color: #67c23a;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  display: block;
}

.results-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.saving-rate-section {
  text-align: center;
  margin-bottom: 24px;
}

.rate-text {
  display: flex;
  flex-direction: column;
}

.rate-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.rate-label {
  font-size: 14px;
  color: #909399;
}

.rate-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.saving-amount-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.amount-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #fff;
}

.amount-card:last-child {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.amount-label {
  font-size: 12px;
  opacity: 0.9;
  display: block;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 18px;
  font-weight: 600;
}

.confidence-section {
  margin-bottom: 20px;
}

.confidence-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.confidence-value {
  font-weight: 600;
}

.breakdown-section h4 {
  font-size: 15px;
  color: #303133;
  margin: 0 0 14px 0;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.breakdown-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.breakdown-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.breakdown-name {
  font-size: 13px;
  color: #606266;
}

.breakdown-value {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.ai-recommendations {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.ai-recommendations h4 {
  font-size: 15px;
  color: #303133;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-recommendations h4 i {
  color: #6f42c1;
}

.recommendation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendation-list li {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #606266;
  border-left: 4px solid #6f42c1;
  line-height: 1.5;
}

.recommendation-list li:last-child {
  margin-bottom: 0;
}

.result-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.result-actions .el-button {
  flex: 1;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }
  
  .results-panel {
    width: 100%;
  }
  
  .results-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .page-title {
    flex-direction: column;
    gap: 16px;
  }
  
  .saving-amount-section {
    grid-template-columns: 1fr;
  }
}
</style>
