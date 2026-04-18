import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { 
  ACDevice, 
  ParkingLot, 
  LightingCircuit, 
  Camera,
  DashboardSummary 
} from '@shared/types'
import * as api from '@/api'

export const useBuildingStore = defineStore('building', () => {
  // 状态
  const acDevices = ref<ACDevice[]>([])
  const parkingLot = ref<ParkingLot | null>(null)
  const lightingCircuits = ref<LightingCircuit[]>([])
  const cameras = ref<Camera[]>([])
  const dashboardSummary = ref<DashboardSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isCN = ref(true)

  // 获取仪表盘数据
  async function fetchDashboard() {
    loading.value = true
    error.value = null
    try {
      const res = await api.getDashboardSummary()
      if (res.success && res.data) {
        dashboardSummary.value = res.data
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // 获取空调设备
  async function fetchACDevices() {
    try {
      const res = await api.getACDevices()
      if (res.success && res.data) {
        acDevices.value = res.data
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 控制空调
  async function controlAC(deviceId: string, action: string, value: any) {
    try {
      const res = await api.controlAC({ deviceId, action, value })
      if (res.success) {
        await fetchACDevices()
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 获取停车场状态
  async function fetchParkingStatus() {
    try {
      const res = await api.getParkingStatus()
      if (res.success && res.data) {
        parkingLot.value = res.data
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 获取灯光回路
  async function fetchLightingCircuits() {
    try {
      const res = await api.getLightingCircuits()
      if (res.success && res.data) {
        lightingCircuits.value = res.data
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  // 获取摄像头
  async function fetchCameras() {
    try {
      const res = await api.getCameras()
      if (res.success && res.data) {
        cameras.value = res.data
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  return {
    acDevices,
    parkingLot,
    lightingCircuits,
    cameras,
    dashboardSummary,
    loading,
    error,
    isCN,
    fetchDashboard,
    fetchACDevices,
    controlAC,
    fetchParkingStatus,
    fetchLightingCircuits,
    fetchCameras
  }
})
