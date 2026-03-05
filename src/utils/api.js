// API 请求工具类
import { API_BASE_URL } from '../config'
import { handleLoginExpired } from './auth'

const BASE_URL = API_BASE_URL

// 构建查询字符串（兼容微信小程序，不使用 URLSearchParams）
function buildQueryString(params) {
  const queryParts = []
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    }
  }
  return queryParts.length > 0 ? '?' + queryParts.join('&') : ''
}

// 获取 token
function getToken() {
  return uni.getStorageSync('token') || ''
}

// 使用 HTTP 的请求方法
function requestWithHttp(options) {
  return new Promise((resolve, reject) => {
    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    }

    const token = getToken()
    if (!options.skipAuth && token) {
      header['Authorization'] = `Bearer ${token}`
    }

    const requestUrl = BASE_URL + options.url
    console.log('发起 HTTP 请求:', requestUrl, options.method || 'GET', options.data)

    uni.request({
      url: requestUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success: (res) => {
        if (res.statusCode === 200) {
          console.log('请求响应:', res.statusCode, res.data)
          if (res.data.code === 200) {
            resolve(res.data.data)
          } else if (res.data.code === 401) {
            // token 失效，显示提示并重新加载小程序
            handleLoginExpired()
            reject(new Error(res.data.message || '登录已过期，请重新登录'))
          } else {
            reject(new Error(res.data.message || '请求失败'))
          }
        } else {
          const errorMsg = `网络请求失败 (状态码: ${res.statusCode})，请检查：\n1. 后端服务是否正常运行\n2. 请求地址是否正确: ${requestUrl}\n3. 小程序后台是否配置了合法域名`
          console.error(errorMsg)
          reject(new Error(errorMsg))
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        let errorMsg = '网络请求失败'
        if (err.errMsg) {
          if (err.errMsg.includes('timeout') || err.errMsg.includes('超时')) {
            errorMsg = `请求超时，请检查：\n1. 后端服务是否正常运行 (${BASE_URL})\n2. 网络连接是否正常\n3. 微信开发者工具 -> 设置 -> 项目设置 -> 是否勾选"不校验合法域名"\n\n错误详情: ${err.errMsg}`
          } else if (err.errMsg.includes('fail')) {
            errorMsg = `网络请求失败，可能的原因：\n1. 后端服务未启动或无法访问 (${BASE_URL})\n2. 请求地址错误: ${requestUrl}\n3. 微信开发者工具 -> 设置 -> 项目设置 -> 是否勾选"不校验合法域名"\n4. 网络连接问题\n\n错误详情: ${err.errMsg}`
          } else {
            errorMsg = `网络请求失败: ${err.errMsg}`
          }
        } else if (err instanceof Error) {
          errorMsg = err.message
        } else {
          errorMsg = String(err)
        }
        reject(new Error(errorMsg))
      },
    })
  })
}

function request(options) {
  return requestWithHttp(options)
}

// API 接口
export const api = {
  // 微信登录（不需要 token）
  wechatLogin(code) {
    return request({
      url: '/auth/wechat/login',
      method: 'POST',
      data: { code },
      skipAuth: true,
    })
  },

  /** 排行榜：page 从 1 开始 */
  getRankList(params = {}) {
    return request({
      url: `/pun/rank/list${buildQueryString(params)}`,
      method: 'GET',
    })
  },

  /**
   * 提交答案
   */
  submitAnswer(level, userAnswer) {
    return request({
      url: '/pun/answer/submit',
      method: 'POST',
      data: { level, userAnswer },
    })
  },

  /**
   * 当前用户关卡进度（历史答题情况）
   */
  getLevelProgress() {
    return request({ url: '/pun/level/progress', method: 'GET' })
  },
}
