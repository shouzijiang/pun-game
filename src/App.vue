<script>
import { wechatLogin } from './utils/auth'

export default {
  onLaunch: async function () {
    console.log('App Launch')
    // 微信登录
    await wechatLogin()
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
