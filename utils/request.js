// const BASE_URL = 'http://127.0.0.1:8080'
const BASE_URL = 'http://39.106.200.2:8080'
const ADMIN_TOKEN = 'guyuan-admin-token'

function request(url, data = {}, method = 'GET') {
  const header = { 'Content-Type': 'application/json' }
  if (method !== 'GET') {
    header['x-admin-token'] = ADMIN_TOKEN
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: 10000,
      success(res) {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data.data)
        } else {
          reject(res.data)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

module.exports = { BASE_URL, request, ADMIN_TOKEN }
