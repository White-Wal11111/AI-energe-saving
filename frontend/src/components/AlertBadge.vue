<template>
  <el-badge 
    :value="displayValue" 
    :is-dot="isDot"
    :hidden="hidden"
    :type="badgeType"
    :max="max"
    class="alert-badge"
  >
    <slot />
  </el-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  count?: number
  max?: number
  type?: 'critical' | 'warning' | 'info'
  showZero?: boolean
  isDot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  max: 99,
  type: 'critical',
  showZero: false,
  isDot: false
})

const hidden = computed(() => {
  if (props.isDot) return props.count === 0
  if (props.showZero) return false
  return props.count === 0
})

const displayValue = computed(() => {
  if (props.isDot) return undefined
  if (props.count > props.max) return `${props.max}+`
  return props.count
})

const badgeType = computed(() => {
  const map: Record<string, any> = {
    critical: 'danger',
    warning: 'warning',
    info: 'primary'
  }
  return map[props.type] || 'danger'
})
</script>

<style scoped>
.alert-badge {
  display: inline-flex;
}
</style>
