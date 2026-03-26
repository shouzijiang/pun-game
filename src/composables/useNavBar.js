import { ref } from 'vue'

export function useNavBar() {
  const statusBarHeight = ref(20)
  const navBarHeight = ref(44)
  const menuButtonHeight = ref(32)

  // #ifdef MP-WEIXIN
  try {
    const systemInfo = uni.getSystemInfoSync()
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
    
    if (systemInfo && menuButtonInfo) {
      statusBarHeight.value = systemInfo.statusBarHeight
      navBarHeight.value = menuButtonInfo.height + (menuButtonInfo.top - systemInfo.statusBarHeight) * 2
      menuButtonHeight.value = menuButtonInfo.height
    }
  } catch (e) {
    console.error('获取导航栏信息失败', e)
  }
  // #endif

  return {
    statusBarHeight,
    navBarHeight,
    menuButtonHeight
  }
}
