import mysql from 'mysql2/promise'
const pool = await mysql.createPool({ host:'localhost', user:'root', password:'', database:'smart_building' })
const [r] = await pool.query('SELECT id,name,device_code,device_type,status,location,floor FROM devices WHERE project_id=? ORDER BY device_type, name', ['1'])
console.log('total:', r.length)
console.log(JSON.stringify(r, null, 2))
await pool.end()
