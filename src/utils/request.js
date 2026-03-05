/**
 * 基于 uni.request 的请求封装，兼容微信/抖音小程序与 H5
 * @param {Object} options - 同 uni.request，支持 url、method、data、header 等
 * @returns {Promise<{ data: any, statusCode: number }>} 成功时 resolve，失败时 reject
 */
export function request(options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ data: res.data, statusCode: res.statusCode })
        } else {
          reject(new Error(res.data?.message || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => reject(err),
    })
  })
}

/**
 * GET 请求便捷方法
 * @param {string} url
 * @param {Object} [params] - 查询参数，会拼到 url
 * @returns {Promise<{ data: any }>}
 */
export function get(url, params) {
  let finalUrl = url
  if (params && Object.keys(params).length) {
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    finalUrl = url + (url.includes('?') ? '&' : '?') + query
  }
  return request({ url: finalUrl, method: 'GET' })
}
