<template>
  <div class="ac-control">
    <h2>空调控制</h2>
    
    <div class="device-list">
      <div v-for="device in devices" :key="device.id" class="device-card">
        <div class="device-header">
          <h3>{{ device.name }}</h3>
          <span :class="['status', device.status]">{{ device.statusText }}</span>
        </div>
        <div class="device-body">
          <p>温度: {{ device.currentTemp }}°C</p>
          <p>功率: {{ device.power }}W</p>
          <button @click="toggleDevice(device)">
            {{ device.status === 'on' ? '关闭' : '开启' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const devices = ref([
  { id: 1, name: '1号冷机', currentTemp: 24, power: 1200, status: 'on', statusText: '运行中' },
  { id: 2, name: '2号冷机', currentTemp: 23, power: 1500, status: 'on', statusText: '运行中' },
  { id: 3, name: '变频器1', currentTemp: 22, power: 800, status: 'off', statusText: '已关闭' },
])

function toggleDevice(device) {
  device.status = device.status === 'on' ? 'off' : 'on'
  device.statusText = device.status === 'on' ? '运行中' : '已关闭'
  device.power = device.status === 'on' ? 1000 : 0
}
</script>

<style>
.ac-control {
  padding: 20px;
}

.device-list {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.device-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 250px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.device-header h3 {
  margin: 0;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.on {
  background: #e7f7e7;
  color: #52c41a;
}

.status.off {
  background: #f5f5f5;
  color: #999;
}

.device-body p {
  margin: 8px 0;
}

.device-body button {
  width: 100%;
  padding: 8px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.device-body button:hover {
  background: #66b1ff;
}
</style>
