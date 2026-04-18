import axios from 'axios'

// 先登录获取有效 token
try {
  const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  })
  console.log('login success:', loginRes.data.success)
  const token = loginRes.data.data?.token
  console.log('token:', token?.substring(0, 50) + '...')

  // 用有效 token 测试设备列表
  const res = await axios.get('http://localhost:4000/api/device/list?project_id=1&page=1&pageSize=5', {
    headers: { Authorization: `Bearer ${token}` }
  })
  console.log('\n--- /api/device/list ---')
  console.log('success:', res.data.success)
  console.log('total:', res.data.data?.total)
  console.log('list length:', res.data.data?.list?.length)
  if (res.data.data?.list?.length > 0) {
    console.log('first:', res.data.data.list[0].name, '|', res.data.data.list[0].device_type)
  }

  // 测试控制面板
  const ctrlRes = await axios.get('http://localhost:4000/api/control/devices?project_id=1', {
    headers: { Authorization: `Bearer ${token}` }
  })
  console.log('\n--- /api/control/devices ---')
  console.log('success:', ctrlRes.data.success)
  console.log('devices:', ctrlRes.data.data?.length)

} catch (e) {
  console.error('error:', e.response?.status, JSON.stringify(e.response?.data))
}
