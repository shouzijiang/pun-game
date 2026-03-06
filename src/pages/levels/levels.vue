<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
      <view class="bg-glow" />
    </view>

    <view class="nav-bar">
      <view class="nav-btn" @click="back">
        <text class="nav-icon">‹</text>
      </view>
      <text class="nav-title">我的关卡</text>
      <view class="btn-feedback" @click="feedback">
        <text class="feedback-icon">💬</text>
        <text class="feedback-text">反馈</text>
      </view>
    </view>

    <view class="grid-wrap">
      <view
        v-for="n in perPage"
        :key="currentStart + n"
        class="cell-wrap"
      >
        <view
          v-if="currentStart + n <= totalLevels"
          :class="['cell', statusClass(currentStart + n)]"
          @click="onLevelClick(currentStart + n)"
        >
          <text v-if="isCompleted(currentStart + n)" class="cell-star">⭐</text>
          <text class="cell-num">{{ currentStart + n }}</text>
          <view v-if="isCompleted(currentStart + n)" class="cell-done">✓</view>
          <view v-else-if="isLocked(currentStart + n)" class="cell-lock">🔒</view>
        </view>
      </view>
    </view>

    <view class="pager">
      <view class="pager-btn" @click="prevPage">
        <text class="pager-icon">‹</text>
      </view>
      <text class="pager-text">{{ currentPage }}/{{ totalPages }}</text>
      <view class="pager-btn" @click="nextPage">
        <text class="pager-icon">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { LEVELS_PER_PAGE, getCurrentLevel, getPassedLevels } from '../../data/levels'
import { api } from '../../utils/api'

// 总关卡数仅由接口 GET /pun/level/progress 的 totalLevels 决定
const totalLevels = ref(0)
const perPage = LEVELS_PER_PAGE
const currentPage = ref(1)
const passedSet = ref(new Set(getPassedLevels()))
const currentLevel = ref(getCurrentLevel())

const totalPages = computed(() => Math.ceil(totalLevels.value / perPage) || 1)
const currentStart = computed(() => (currentPage.value - 1) * perPage)

function isCompleted(n) {
  return passedSet.value.has(n)
}
function isLocked(n) {
  return n > currentLevel.value
}
function statusClass(n) {
  if (passedSet.value.has(n)) return 'done'
  if (n === currentLevel.value) return 'current'
  return 'locked'
}

function onLevelClick(n) {
  if (n > currentLevel.value) {
    uni.showToast({ title: '请先通过上一关', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/play/play?level=${n}` })
}

function prevPage() {
  if (currentPage.value <= 1) return
  currentPage.value--
}
function nextPage() {
  if (currentPage.value >= totalPages.value) return
  currentPage.value++
}

function loadProgress() {
  api.getLevelProgress()
    .then((data) => {
      currentLevel.value = data.currentLevel != null ? data.currentLevel : getCurrentLevel()
      passedSet.value = new Set(Array.isArray(data.passedLevels) ? data.passedLevels : getPassedLevels())
      if (data.totalLevels != null) {
        totalLevels.value = data.totalLevels
      }
    })
    .catch(() => {
      passedSet.value = new Set(getPassedLevels())
      currentLevel.value = getCurrentLevel()
    })
}

onShow(() => loadProgress())

function back() {
  uni.reLaunch({ url: '/pages/index/index' })
}
function feedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 160rpx;
  padding-top: 12vh;
  padding-left: 40rpx;
  padding-right: 40rpx;
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
  background: linear-gradient(165deg, #fff9f3 0%, #ffefe6 45%, #fce8e0 100%);
}
.bg-dots {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: radial-gradient(circle at 1px 1px, #e8d5ce 1px, transparent 0);
  background-size: 40rpx 40rpx;
}
.bg-glow {
  position: absolute;
  top: -15%;
  left: 50%;
  transform: translateX(-50%);
  width: 120%;
  height: 45%;
  background: radial-gradient(ellipse at center, rgba(255, 180, 150, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.nav-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}
.nav-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #5c534d;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(180, 120, 100, 0.1);
  border: 2rpx solid rgba(200, 160, 140, 0.25);
}
.nav-icon {
  font-size: 44rpx;
  font-weight: bold;
  line-height: 1;
}
.nav-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #3d3530;
  letter-spacing: 0.06em;
}
.btn-feedback {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 18rpx 28rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #6b5b52;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.feedback-icon { font-size: 32rpx; }

.grid-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  justify-content: space-between;
}
.cell-wrap {
  width: calc((100% - 4 * 18rpx) / 5);
  aspect-ratio: 1;
}
.cell {
  width: 100%;
  height: 100%;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4rpx 16rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.15);
}
.cell.done {
  background: linear-gradient(145deg, #7eb88a 0%, #5a9e6a 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6rpx 20rpx rgba(90, 158, 106, 0.35), inset 0 2rpx 0 rgba(255,255,255,0.25);
}
.cell.done .cell-star {
  position: absolute;
  top: 8rpx;
  left: 12rpx;
  font-size: 26rpx;
}
.cell.done .cell-done {
  position: absolute;
  bottom: 10rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.95);
  color: #2d6b3a;
  font-size: 22rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell.current {
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8rpx 24rpx rgba(192, 74, 56, 0.4), inset 0 2rpx 0 rgba(255,255,255,0.2);
}
.cell.locked {
  background: rgba(255, 255, 255, 0.6);
  color: #b8b0a8;
  border-color: rgba(200, 160, 140, 0.2);
}
.cell.locked .cell-num { color: #a89f98; }
.cell.locked .cell-lock {
  position: absolute;
  bottom: 10rpx;
  font-size: 24rpx;
}
.cell-num {
  font-size: 30rpx;
  font-weight: 700;
}

.pager {
  position: fixed;
  bottom: 56rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 36rpx;
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 28rpx rgba(180, 120, 100, 0.12);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.pager-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(192, 74, 56, 0.25);
}
.pager-btn:active {
  transform: scale(0.95);
}
.pager-icon {
  font-size: 38rpx;
  font-weight: bold;
  line-height: 1;
}
.pager-text {
  font-size: 28rpx;
  color: #6b5b52;
  font-weight: 500;
  min-width: 72rpx;
  text-align: center;
}
</style>
