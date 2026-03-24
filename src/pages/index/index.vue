<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
      <view class="bg-glow" />
    </view>

    <!-- 用户头像与昵称（微信内可点击授权/修改，保存到本地与后端） -->
    <view class="user-header">
      <!-- #ifdef MP-WEIXIN -->
      <view class="user-info">
        <view class="avatar-wrapper">
          <button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image
              v-if="userInfo?.avatar"
              class="user-avatar"
              :src="userInfo.avatar"
              mode="aspectFill"
            />
            <view v-else class="user-avatar user-avatar-placeholder">👤</view>
          </button>
          <!-- <text class="edit-hint">点击修改头像</text> -->
        </view>
        <view class="nickname-wrapper">
          <input
            type="nickname"
            class="nickname-input"
            placeholder="点击设置昵称"
            :value="userInfo?.nickname || ''"
            @blur="handleNicknameBlur"
            @confirm="handleNicknameConfirm"
          />
          <text class="edit-hint">点击昵称/头像即可修改</text>
        </view>
      </view>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="user-info user-info-readonly">
        <image
          v-if="userInfo?.avatar"
          class="user-avatar"
          :src="userInfo.avatar"
          mode="aspectFill"
        />
        <view v-else class="user-avatar user-avatar-placeholder">👤</view>
        <text class="user-nickname">{{ userInfo?.nickname || '用户' }}</text>
      </view>
      <!-- #endif -->
    </view>

    <!-- 删除了原有的文字标题，改用统一的副标题 -->
    <view class="hero">
      <view class="hero-badge">
        <text class="hero-emoji">💡</text>
      </view>
      <text class="title">谐音梗猜一猜</text>
      <text class="subtitle">看图猜词 · 挑战你的脑洞</text>
    </view>

    <view class="start-wrap">
      <view class="btn-start btn-start-2" @click="startGameMid">
        <text class="btn-start-icon">🔥</text>
        <text class="btn-start-text">开始游戏(中级)</text>
      </view>
      <view class="btn-start" @click="startGame">
        <text class="btn-start-icon">🌱</text>
        <text class="btn-start-text">开始游戏(初级)</text>
      </view>
      <view class="btn-cocreate" @click="goCocreate">
        <text class="btn-cocreate-text">进入共创</text>
      </view>
    </view>

    <view class="top-actions">
      <view class="btn-entry" @click="goRank">
        <text class="btn-icon">🏆</text>
        <text class="btn-text">排行榜</text>
      </view>
      <view class="btn-entry btn-levels" @click="goLevels">
        <text class="btn-icon">📖</text>
        <text class="btn-text">我的关卡</text>
      </view>
    </view>

    <view class="stats">
      <text class="stats-text">已有 {{ stats.players }} 位好友在玩 · 累计 {{ stats.answers }} 次答题</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentLevel } from '../../data/levels'
import { getUserInfo } from '../../utils/auth'
import { api } from '../../utils/api'

const stats = ref({ players: 28, answers: 45684 })
const userInfo = ref(null)

function loadUserInfo() {
  const info = getUserInfo()
  userInfo.value = info || { nickname: '', avatar: '', user_id: null, openid: '' }
}

// 将图片转为 base64（微信小程序选头像后上传用）
function imageToBase64(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        const ext = (filePath.split('.').pop() || 'jpg').toLowerCase()
        const mime = ext === 'png' ? 'png' : 'jpeg'
        resolve(`data:image/${mime};base64,${res.data}`)
      },
      fail: (err) => {
        console.error('读取头像失败', err)
        reject(new Error('读取头像失败'))
      },
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('仅微信小程序支持'))
    // #endif
  })
}

// 微信：选择头像后保存到后端并更新本地
async function onChooseAvatar(e) {
  // #ifdef MP-WEIXIN
  const avatarUrl = e.detail.avatarUrl
  if (!avatarUrl) return
  const currentNickname = userInfo.value?.nickname || '微信用户'
  try {
    uni.showLoading({ title: '上传中…', mask: true })
    const avatarBase64 = await imageToBase64(avatarUrl)
    await api.updateUserInfo({ nickname: currentNickname, avatar: avatarBase64 })
    const updated = { ...userInfo.value, avatar: avatarUrl }
    uni.setStorageSync('userInfo', updated)
    userInfo.value = updated
    uni.hideLoading()
    uni.showToast({ title: '头像已更新', icon: 'success' })
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: err.message || '更新失败', icon: 'none' })
  }
  // #endif
}

function handleNicknameBlur(e) {
  saveNickname(e.detail.value)
}
function handleNicknameConfirm(e) {
  saveNickname(e.detail.value)
}

async function saveNickname(nickname) {
  if (!userInfo.value) return
  const trimmed = (nickname || '').trim() || '微信用户'
  if (trimmed === userInfo.value.nickname) return
  const currentAvatar = userInfo.value.avatar || ''
  try {
    await api.updateUserInfo({ nickname: trimmed, avatar: currentAvatar })
    const updated = { ...userInfo.value, nickname: trimmed }
    uni.setStorageSync('userInfo', updated)
    userInfo.value = updated
    uni.showToast({ title: '昵称已保存', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
    loadUserInfo()
  }
}

onShow(() => loadUserInfo())

function goRank() {
  uni.navigateTo({ url: '/pages/rank/rank' })
}
function goLevels() {
  uni.navigateTo({ url: '/pages/levels/levels' })
}
function goCocreate() {
  // uni.navigateTo({ url: '/pages/cocreate/list' })
  uni.showToast({ title: '敬请期待~', icon: 'none' })
}
function startGameMid() {
  const goPlay = (level) => { uni.navigateTo({ url: `/pages/playMid/playMid?level=${level}` }) }
  api.getLevelProgress({ gameTier: 'mid' })
    .then((data) => {
      if (data.totalLevels > 0 && data.currentLevel >= data.totalLevels) {
        uni.showToast({ title: '恭喜您已通关中级,关卡持续更新中,敬请期待~', icon: 'none' })
        return
      }
      goPlay(data.currentLevel != null ? data.currentLevel : 0)
    })
    .catch(() => goPlay(0))
}

function startGame() {
  const goPlay = (level) => { uni.navigateTo({ url: `/pages/play/play?level=${level}` }) }
  api.getLevelProgress()
    .then((data) => {
      if(data.currentLevel >= 270) {
        uni.showToast({ title: '恭喜您已通关,关卡持续更新中,敬请期待~', icon: 'none' })
        return
      }
      goPlay(data.currentLevel != null ? data.currentLevel : 1)
    })
    .catch(() => goPlay(getCurrentLevel()))
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 0 40rpx;
  padding-top: 10vh; /* 稍微上移一点，给下面留出更多空间 */
  box-sizing: border-box;
}

.bg-wrap {
  position: fixed;
  inset: 0;
  z-index: 0;
}
.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, #f0f7ff 0%, #e0eafd 35%, #d1e1fb 70%, #c4d7f9 100%); /* 改为清新的蓝底色，更显活泼 */
}
.bg-dots {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  background-image: radial-gradient(circle at 2px 2px, rgba(160,190,240,0.4) 2px, transparent 0);
  background-size: 48rpx 48rpx;
}
.bg-glow {
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 140%;
  height: 60%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, rgba(255,255,255,0) 70%);
  pointer-events: none;
}

.user-header {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 520rpx;
  margin-bottom: 40rpx;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 100rpx; /* 胶囊状，更显精致 */
  box-shadow: 0 8rpx 24rpx rgba(100, 140, 200, 0.15), inset 0 2rpx 0 rgba(255,255,255,0.8);
  border: 4rpx solid rgba(255, 255, 255, 0.6);
}
.user-info-readonly {
  padding: 16rpx 24rpx;
  border-radius: 100rpx;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.avatar-btn {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1;
  position: relative;
}
.avatar-btn::after {
  border: none;
}
.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  display: block;
}
.user-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  background: #e8f0fe;
  color: #8ab4f8;
}
.nickname-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4rpx;
}
.nickname-input {
  width: 100%;
  font-size: 32rpx;
  font-weight: 800;
  color: #2c3e50;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  height: auto;
  line-height: 1.2;
}
.nickname-input::placeholder {
  color: #94a3b8;
  font-weight: 600;
}
.edit-hint {
  font-size: 20rpx;
  color: #64748b;
  font-weight: 500;
  background: rgba(255,255,255,0.6);
  padding: 2rpx 12rpx;
  border-radius: 12rpx;
  display: inline-block;
  align-self: flex-start;
}
.user-nickname {
  flex: 1;
  font-size: 32rpx;
  font-weight: 800;
  color: #2c3e50;
}

.hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8vh;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12rpx); }
}
.hero-badge {
  width: 200rpx;
  height: 200rpx;
  border-radius: 40rpx; /* 圆角矩形，像游戏App图标 */
  background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
  border: 8rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  box-shadow: 0 20rpx 40rpx rgba(100, 140, 200, 0.25), inset 0 -8rpx 16rpx rgba(0,0,0,0.05);
  transform: rotate(-5deg);
}
.hero-emoji {
  font-size: 100rpx;
  filter: drop-shadow(0 8rpx 8rpx rgba(0,0,0,0.1));
}
.title {
  font-size: 72rpx;
  font-weight: 900;
  color: #1e293b;
  letter-spacing: 0.1em;
  margin-bottom: 12rpx;
  text-shadow: 0 4rpx 0 #fff, 0 8rpx 16rpx rgba(100,140,200,0.3);
}
.subtitle {
  font-size: 28rpx;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
  background: rgba(255,255,255,0.7);
  padding: 8rpx 24rpx;
  border-radius: 100rpx;
}

.start-wrap {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  margin-bottom: 60rpx;
}
.btn-start {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx 48rpx;
  background: linear-gradient(135deg, #ff7a63 0%, #e04a35 100%);
  border-radius: 32rpx;
  color: #fff;
  font-size: 36rpx;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 16rpx 32rpx rgba(224, 74, 53, 0.4), 0 10rpx 0 #b33624, inset 0 4rpx 10rpx rgba(255, 255, 255, 0.4);
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to bottom, rgba(255,255,255,0.2), transparent);
    border-radius: 32rpx 32rpx 0 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: skewX(-20deg);
    animation: shine 3s infinite;
  }

  &.btn-start-2 {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    box-shadow: 0 16rpx 32rpx rgba(59, 130, 246, 0.4), 0 10rpx 0 #2563eb, inset 0 4rpx 10rpx rgba(255, 255, 255, 0.4);
    &::after {
      animation-delay: 1.5s;
    }
  }
}
.btn-start:active {
  transform: translateY(8rpx);
  box-shadow: 0 4rpx 10rpx rgba(224, 74, 53, 0.4), 0 2rpx 0 #b33624, inset 0 4rpx 10rpx rgba(255, 255, 255, 0.4);
  &.btn-start-2 {
    box-shadow: 0 4rpx 10rpx rgba(59, 130, 246, 0.4), 0 2rpx 0 #2563eb, inset 0 4rpx 10rpx rgba(255, 255, 255, 0.4);
  }
}
.btn-start-icon {
  font-size: 40rpx;
  line-height: 1;
  filter: drop-shadow(0 4rpx 4rpx rgba(0,0,0,0.2));
}

@keyframes shine {
  0% { left: -100%; }
  20% { left: 200%; }
  100% { left: 200%; }
}

.btn-cocreate {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 48rpx;
  background: linear-gradient(to bottom, #ffffff, #f1f5f9);
  border-radius: 32rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 12rpx 24rpx rgba(100, 140, 200, 0.15), 0 8rpx 0 #cbd5e1;
  transition: all 0.1s;
}
.btn-cocreate:active {
  transform: translateY(6rpx);
  box-shadow: 0 4rpx 12rpx rgba(100, 140, 200, 0.15), 0 2rpx 0 #cbd5e1;
}
.btn-cocreate-text {
  font-size: 32rpx;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.08em;
}

.top-actions {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 24rpx;
  width: 100%;
  max-width: 480rpx;
}
.btn-entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx 20rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 28rpx;
  color: #475569;
  font-size: 26rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 20rpx rgba(100, 140, 200, 0.1), 0 6rpx 0 #e2e8f0;
  border: 4rpx solid #fff;
  transition: all 0.1s;
}
.btn-entry:active {
  transform: translateY(4rpx);
  box-shadow: 0 4rpx 10rpx rgba(100, 140, 200, 0.1), 0 2rpx 0 #e2e8f0;
}
.btn-icon {
  font-size: 48rpx;
  line-height: 1;
  filter: drop-shadow(0 4rpx 4rpx rgba(0,0,0,0.1));
}

.stats {
  position: relative;
  z-index: 2;
  margin-top: auto;
  padding: 32rpx;
  margin-bottom: 20rpx;
}
.stats-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.04em;
  background: rgba(255,255,255,0.6);
  padding: 8rpx 24rpx;
  border-radius: 100rpx;
}
</style>
