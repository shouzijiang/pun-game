// 认证工具类
import { api } from './api'

// 登录状态锁，防止并发调用
let isLoggingIn = false
let loginPromise = null

// 检查登录状态
export function checkLogin() {
  const token = uni.getStorageSync('token')
  const userInfo = uni.getStorageSync('userInfo')
  return !!(token && userInfo)
}

// 微信登录
export async function wechatLogin(forceRefresh = false) {
  // 如果正在登录中，返回同一个 Promise（除非强制刷新）
  if (isLoggingIn && loginPromise && !forceRefresh) {
    console.log('登录进行中，等待现有登录完成...')
    return loginPromise
  }

  // 检查是否已登录（除非强制刷新）
  if (checkLogin() && !forceRefresh) {
    return Promise.resolve(uni.getStorageSync('userInfo'))
  }

  // 设置登录锁
  isLoggingIn = true

  loginPromise = new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: async (loginRes) => {
        if (loginRes.code) {
          try {
            // 调用后端登录接口，传递 code
            const result = await api.wechatLogin(loginRes.code)

            // 保存 token 和用户信息
            uni.setStorageSync('token', result.token)
            uni.setStorageSync('userInfo', {
              user_id: result.user_id,
              openid: result.openid,
              nickname: result.nickname,
              avatar: result.avatar,
            })

            // 清除登录锁
            isLoggingIn = false
            loginPromise = null
            resolve({ code: loginRes.code })
          } catch (error) {
            console.error('登录失败:', error)
            // 清除登录锁，允许重试
            isLoggingIn = false
            loginPromise = null

            // 如果是 code 相关的错误，可以提示用户
            if (error.message && (error.message.includes('code') || error.message.includes('40163'))) {
              console.warn('Code 已被使用或过期，需要重新获取')
            }

            reject(error)
          }
        } else {
          // 清除登录锁
          isLoggingIn = false
          loginPromise = null
          reject(new Error('获取登录凭证失败'))
        }
      },
      fail: (err) => {
        console.error('登录失败:', err)
        // 清除登录锁
        isLoggingIn = false
        loginPromise = null
        reject(new Error('登录失败: ' + (err.errMsg || '未知错误')))
      },
    })
  })

  return loginPromise
}

// 强制重新登录（清除缓存并重新获取 code）
export async function forceLogin() {
  // 清除登录状态
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  // 强制刷新登录
  return wechatLogin(true)
}

// 退出登录
export function logout() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  uni.reLaunch({
    url: '/pages/index/index',
  })
}

// 获取用户信息
export function getUserInfo() {
  return uni.getStorageSync('userInfo') || null
}

// 处理登录过期（401错误）
export function handleLoginExpired() {
  // 清除登录信息
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')

  // 显示提示并重新加载小程序
  uni.showModal({
    title: '登录过期',
    content: '您的登录已过期，请重新登录',
    showCancel: false,
    confirmText: '确定',
    success: (res) => {
      if (res.confirm) {
        // 重新加载小程序
        uni.reLaunch({
          url: '/pages/index/index',
        })
      }
    },
  })
}
