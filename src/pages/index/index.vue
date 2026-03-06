<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
      <view class="bg-glow" />
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
      <text class="title">谐音梗图</text>
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
import { getCurrentLevel } from '../../data/levels'
import { api } from '../../utils/api'

const stats = ref({ players: 8, answers: parseInt(parseInt(new Date().getTime())/100000/24/60) })

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

.top-actions {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 20rpx;
  width: 100%;
  max-width: 520rpx;
  margin-bottom: 12vh;
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
  margin-bottom: 12vh;
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
