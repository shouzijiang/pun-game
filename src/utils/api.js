// API 请求工具类
import { API_BASE_URL } from '../config'
import { forceLogin, handleLoginExpired } from './auth'

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
            // token 失效：先尝试“强制重新登录 + 重试原请求（最多一次）”
            // 避免每次401都让用户手动再点一次
            if (options && options._authRetried) {
              handleLoginExpired()
              reject(new Error(res.data.message || '登录已过期，请重新登录'))
              return
            }

            forceLogin()
              .then(() => {
                const retryOptions = { ...(options || {}), _authRetried: true }
                requestWithHttp(retryOptions).then(resolve).catch(reject)
              })
              .catch(() => {
                handleLoginExpired()
                reject(new Error(res.data.message || '登录已过期，请重新登录'))
              })
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
  /**
   * @param {number} level
   * @param {string[]} userAnswer
   * @param {Record<string, unknown>} [extra] 例如 { gameTier: 'mid' } 供后端区分题库
   */
  submitAnswer(level, userAnswer, extra = {}) {
    return request({
      url: '/pun/answer/submit',
      method: 'POST',
      data: { level, userAnswer, ...extra },
    })
  },

  /**
   * 当前用户关卡进度（历史答题情况）
   */
  getLevelProgress(params = {}) {
    return request({ url: `/pun/level/progress${buildQueryString(params)}`, method: 'GET' })
  },

  /**
   * 提交意见反馈
   * @param {Object} data - { type?, content, contact? }
   */
  submitFeedback(data) {
    return request({
      url: '/pun/feedback/submit',
      method: 'POST',
      data,
    })
  },

  /**
   * 更新用户信息（头像/昵称），需登录
   * @param {Object} data - { nickname?, avatar? } avatar 可为 base64 或 URL，与后端约定
   */
  updateUserInfo(data) {
    return request({
      url: '/auth/user/update',
      method: 'POST',
      data,
    })
  },

  /** 共创：生成选词（20 个，含答案） */
  generateCocreateWords(answer) {
    return request({
      url: '/pun/cocreate/words/generate',
      method: 'POST',
      data: { answer },
    })
  },

  /** 共创：AI 生成图片，type 为 hint | answer */
  generateCocreateImage(prompt, type) {
    return request({
      url: '/pun/cocreate/image/generate',
      method: 'POST',
      data: { prompt, type },
    })
  },

  /** 共创：提交关卡 */
  submitCocreate(data) {
    return request({
      url: '/pun/cocreate/submit',
      method: 'POST',
      data,
    })
  },

  /** 共创：列表分页 */
  getCocreateList(params = {}) {
    return request({
      url: `/pun/cocreate/list${buildQueryString(params)}`,
      method: 'GET',
    })
  },

  /** 共创：详情（玩某条时拉题） */
  getCocreateDetail(id) {
    return request({
      url: `/pun/cocreate/detail${buildQueryString({ id })}`,
      method: 'GET',
    }).then((data) => {
      if (!data) return null
      return {
        imageUrl: data.imageUrl || data.answerImageUrl || data.answer_image_url || '',
        hintText: data.hintText || data.hintImagePrompt || data.hint_image_prompt || '',
        wordArray: data.wordArray || data.word_array || [],
        answerLength: data.answerLength ?? data.answer_length ?? 0,
        answer: data.answer || '',
      }
    })
  },

  /** 共创：提交共创题目答案 */
  submitCocreateAnswer(cocreateId, userAnswer) {
    return request({
      url: '/pun/cocreate/answer/submit',
      method: 'POST',
      data: { cocreateId, userAnswer },
    })
  },
}
