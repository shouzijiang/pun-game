<template>
  <view class="page">
    <!-- 背景渐变 + 装饰 -->
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-deco">
        <text class="deco-icon">☁️</text>
        <text class="deco-icon">⭐</text>
        <text class="deco-icon">🎮</text>
      </view>
    </view>

    <!-- 中央问号 + 标题 -->
    <view class="hero">
      <view class="question-mark">?</view>
      <view class="title-box">
        <text class="title">谐音梗图</text>
      </view>
      <view class="subtitle-box">
        <text class="subtitle">看图猜词 · 挑战你的想象力</text>
      </view>
    </view>

    <!-- 开始游戏 -->
    <view class="start-wrap">
      <view class="btn-start" @click="startGame">
        <text class="btn-start-icon">▶</text>
        <text class="btn-start-text">开始游戏</text>
      </view>
    </view>

    <!-- 右上角入口 -->
    <view class="top-actions">
      <view class="btn-entry" @click="goRank">
        <text class="btn-icon">🏆</text>
        <text class="btn-text">排行</text>
      </view>
      <view class="btn-entry btn-levels" @click="goLevels">
        <text class="btn-icon">📋</text>
        <text class="btn-text">关卡</text>
      </view>
    </view>

    <!-- 参与统计 -->
    <view class="stats">
      <text class="stats-text">您有 {{ stats.players }} 好友正在参与答题 {{ stats.answers }} 次</text>
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
  padding-top: 10vh;
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
  background: linear-gradient(180deg, #ff9a56 0%, #87ceeb 45%, #e8e0d0 100%);
}
.bg-deco {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  padding-bottom: 80rpx;
  opacity: 0.6;
}
.deco-icon {
  font-size: 48rpx;
}

.top-actions {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 24rpx;
  align-self: auto;
  margin: 80rpx 32rpx 0 32rpx;
}
.btn-entry {
  background: linear-gradient(135deg, #7ec8e3, #9dd5ed);
  color: #333;
  padding: 16rpx 28rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
  width:45%;
}
.btn-levels {
  background: linear-gradient(135deg, #ffb6c1, #ffc0cb);
}
.btn-icon { font-size: 36rpx; }
.btn-text { font-size: 28rpx; font-weight: 500; }

.hero {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 60rpx;
}
.question-mark {
  width: 320rpx;
  height: 320rpx;
  background: linear-gradient(145deg, #ffd54f, #ff9800);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 200rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 2rpx 4rpx 8rpx rgba(0,0,0,0.2);
  box-shadow: 0 12rpx 32rpx rgba(255,152,0,0.4);
  margin-bottom: 24rpx;
}
.title-box {
  // background: #fff;
  // border: 4rpx solid #e74c3c;
  // border-radius: 16rpx;
  // padding: 16rpx 40rpx;
  // box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.1);
}
.title {
  font-size: 128rpx;
  font-weight: bold;
  color: rgb(232, 93, 4);
  text-shadow: rgb(208, 0, 0) 1px 1px 0px, rgb(208, 0, 0) 2px 2px 0px, rgb(208, 0, 0) 3px 3px 0px, rgb(208, 0, 0) 4px 4px 0px, rgb(208, 0, 0) 5px 5px 0px, rgb(208, 0, 0) 6px 6px 0px, rgb(208, 0, 0) 7px 7px 0px, rgba(0, 0, 0, 0.4) 8px 8px 15px;
  -webkit-text-stroke: 3px rgb(255, 255, 255);
  letter-spacing: 0.05em;
}
.subtitle-box {
  background: rgba(255,255,255,0.9);
  border-radius: 24rpx;
  padding: 12rpx 32rpx;
  margin-top: 16rpx;
}
.subtitle {
  font-size: 26rpx;
  color: #666;
}

.start-wrap {
  position: relative;
  z-index: 2;
  margin-top: 80rpx;
}
.btn-start {
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  color: #fff;
  padding: 28rpx 80rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(255,107,53,0.4);
}
.btn-start-icon { font-size: 40rpx; }
.btn-start-text { font-size: 36rpx; font-weight: 600; }

.stats {
  position: relative;
  z-index: 2;
  margin-top: auto;
  margin-bottom: 60rpx;
  padding: 20rpx 40rpx;
  background: rgba(120,130,150,0.25);
  border-radius: 24rpx;
}
.stats-text {
  font-size: 24rpx;
  color: #555;
}
</style>
