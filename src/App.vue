<script>
import { wechatLogin } from './utils/auth'

export default {
  onLaunch: async function () {
    console.log('App Launch')
    // 微信登录
    await wechatLogin()

    // 小程序更新检测
    if (uni.canIUse('getUpdateManager')) {
      const updateManager = uni.getUpdateManager()

      updateManager.onCheckForUpdate(function (res) {
        // 有新版本
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            uni.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  // 重启并应用新版本
                  updateManager.applyUpdate()
                }
              }
            })
          })

          updateManager.onUpdateFailed(function () {
            uni.showModal({
              title: '提示',
              content: '新版本下载失败，请删除小程序重新打开',
              showCancel: false
            })
          })
        }
      })
    }
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/*每个页面公共css */
</style>
