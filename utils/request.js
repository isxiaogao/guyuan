// const BASE_URL = 'http://127.0.0.1:8080'
const BASE_URL = 'https://guyuan.allyd.cn'
// const BASE_URL = 'http://39.106.200.2:8080'
const ADMIN_TOKEN = 'guyuan-admin-token'

function request(url, data = {}, method = 'GET') {
  const header = { 'Content-Type': 'application/json' }
  if (method !== 'GET') {
    header['x-admin-token'] = ADMIN_TOKEN
  }
  const openid = wx.getStorageSync('openid')
  if (openid) {
    header['x-user-openid'] = openid
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
          console.error(`[request fail] ${method} ${url}`, res.data)
          reject(res.data)
        }
      },
      fail(err) {
        console.error(`[request error] ${method} ${url}`, err)
        reject(err)
      }
    })
  })
}

function login(force) {
  return new Promise((resolve, reject) => {
    if (!force && wx.getStorageSync('openid')) {
      return resolve(wx.getStorageSync('openid'))
    }

    wx.login({
      success(res) {
        if (!res.code) {
          return reject(new Error('wx.login 未返回 code'))
        }
        wx.request({
          url: `${BASE_URL}/api/auth/login`,
          method: 'POST',
          data: { code: res.code },
          success(r) {
            if (r.data.code === 200 && r.data.data.openid) {
              wx.setStorageSync('openid', r.data.data.openid)
              wx.setStorageSync('isAdmin', r.data.data.isAdmin === true)
              resolve(r.data.data.openid)
            } else {
              reject(new Error(r.data.message || '登录失败'))
            }
          },
          fail: reject
        })
      },
      fail: reject
    })
  })
}

module.exports = { BASE_URL, request, ADMIN_TOKEN, login }
