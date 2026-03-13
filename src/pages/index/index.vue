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
          <text class="edit-hint">点击修改头像</text>
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
          <text class="edit-hint">点击修改昵称</text>
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
        <text class="user-nickname">{{ userInfo?.nickname || '微信用户' }}</text>
      </view>
      <!-- #endif -->
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

    <view class="hero">
      <view class="hero-badge">
        <text class="hero-emoji">💡</text>
      </view>
      <text class="title">谐音梗猜一猜</text>
      <text class="subtitle">看图猜词，挑战你的脑洞</text>
    </view>

    <view class="start-wrap">
      <view class="btn-start" @click="startGame">
        <text class="btn-start-text">开始游戏</text>
        <text class="btn-start-arrow">→</text>
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

const stats = ref({ players: 8, answers: parseInt(parseInt(new Date().getTime())/100000/24/60) })
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
function startGame() {
  const goPlay = (level) => { uni.navigateTo({ url: `/pages/play/play?level=${level}` }) }
  api.getLevelProgress()
    .then((data) => goPlay(data.currentLevel != null ? data.currentLevel : 1))
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
  padding-top: 14vh;
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
  background: linear-gradient(165deg, #fff9f3 0%, #ffefe6 35%, #fce8e0 70%, #f5e6e0 100%);
}
.bg-dots {
  position: absolute;
  inset: 0;
  opacity: 0.4;
  background-image: radial-gradient(circle at 1px 1px, #e8d5ce 1px, transparent 0);
  background-size: 40rpx 40rpx;
}
.bg-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 50%;
  background: radial-gradient(ellipse at center, rgba(255, 180, 150, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

.user-header {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 520rpx;
  margin-bottom: 32rpx;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 22rpx;
  box-shadow: 0 4rpx 20rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.user-info-readonly {
  padding: 18rpx 24rpx;
}
.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.avatar-btn {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: 1;
}
.avatar-btn::after {
  border: none;
}
.user-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(212, 93, 74, 0.3);
  display: block;
}
.user-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  background: rgba(240, 230, 220, 0.9);
}
.nickname-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.nickname-input {
  width: 100%;
  font-size: 30rpx;
  font-weight: 600;
  color: #3d3530;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  height: auto;
  line-height: 1.4;
}
.nickname-input::placeholder {
  color: #a89f98;
  font-weight: 500;
}
.edit-hint {
  font-size: 22rpx;
  color: #a89f98;
}
.user-nickname {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #3d3530;
}

.top-actions {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 20rpx;
  width: 100%;
  max-width: 520rpx;
  margin-bottom: 6vh;
}
.btn-entry {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx 28rpx;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20rpx;
  color: #5c534d;
  font-size: 28rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 20rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.btn-entry.btn-levels {
  color: #6b5b52;
}
.btn-icon {
  font-size: 36rpx;
}

.hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6vh;
}
.hero-badge {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff8f0 0%, #ffe4d4 100%);
  border: 6rpx solid rgba(210, 140, 110, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(200, 130, 100, 0.15), inset 0 2rpx 0 rgba(255,255,255,0.8);
}
.hero-emoji {
  font-size: 80rpx;
}
.title {
  font-size: 72rpx;
  font-weight: 800;
  color: #3d3530;
  letter-spacing: 0.12em;
  margin-bottom: 16rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #8a7f78;
  letter-spacing: 0.04em;
}

.start-wrap {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480rpx;
}
.btn-start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx 48rpx;
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  border-radius: 28rpx;
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  letter-spacing: 0.08em;
  box-shadow: 0 12rpx 36rpx rgba(192, 74, 56, 0.35), 0 4rpx 0 rgba(160, 50, 40, 0.2);
}
.btn-start:active {
  transform: scale(0.98);
}
.btn-start-arrow {
  font-size: 32rpx;
  opacity: 0.95;
}

.stats {
  position: relative;
  z-index: 2;
  margin-top: auto;
  padding: 28rpx 32rpx;
  margin-bottom: 48rpx;
}
.stats-text {
  font-size: 24rpx;
  color: #a89f98;
  letter-spacing: 0.02em;
}
</style>
