const BASE_URL = 'http://localhost:3000'

/**
 * 封装 wx.request
 * @param {string} url - 接口路径
 * @param {Object} data - 请求参数
 * @param {string} method - 请求方法
 * @returns {Promise<any>}
 */
function request(url, data = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
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

module.exports = { BASE_URL, request }
