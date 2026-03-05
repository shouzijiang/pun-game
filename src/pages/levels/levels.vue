<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-deco">☁️ ⭐ ❤️</view>
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
import { TOTAL_LEVELS, LEVELS_PER_PAGE, getCurrentLevel, getPassedLevels } from '../../data/levels'
import { api } from '../../utils/api'

const totalLevels = TOTAL_LEVELS
const perPage = LEVELS_PER_PAGE
const currentPage = ref(1)
const passedSet = ref(new Set(getPassedLevels()))
const currentLevel = ref(getCurrentLevel())

const totalPages = computed(() => Math.ceil(totalLevels / perPage) || 1)
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
    })
    .catch(() => {
      passedSet.value = new Set(getPassedLevels())
      currentLevel.value = getCurrentLevel()
    })
}

onShow(() => loadProgress())

function back() {
  uni.reLaunch({ url: '/pages/levels/levels' })
}
function feedback() {
  uni.showToast({ title: '感谢反馈', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 160rpx;
  padding-top: 5vh;
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
  background: linear-gradient(180deg, #fffef7 0%, #fff8e7 50%, #ffe4c4 100%);
}
.bg-deco {
  position: absolute;
  bottom: 120rpx;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 36rpx;
  opacity: 0.5;
  letter-spacing: 24rpx;
}

.nav-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 70rpx 22rpx 22rpx;
}
.nav-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #7ec8e3;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-icon {
  font-size: 48rpx;
  font-weight: bold;
  line-height: 1;
}
.nav-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #e74c3c;
}
.btn-feedback {
  background: #ffb6c1;
  color: #333;
  padding: 16rpx 28rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.feedback-icon { font-size: 32rpx; }
.feedback-text { font-size: 26rpx; }

.grid-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  padding: 24rpx 32rpx;
  gap: 16rpx;
  justify-content: space-between;
}
.cell-wrap {
  width: calc((100% - 4 * 16rpx) / 5);
  aspect-ratio: 1;
}
.cell {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cell.done {
  background: linear-gradient(145deg, #81c784, #66bb6a);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(102,187,106,0.4);
}
.cell.done .cell-star {
  position: absolute;
  top: 8rpx;
  left: 12rpx;
  font-size: 28rpx;
}
.cell.done .cell-done {
  position: absolute;
  bottom: 12rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: #2e7d32;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cell.current {
  background: linear-gradient(145deg, #ff7043, #e64a19);
  color: #fff;
  box-shadow: 0 0 24rpx rgba(255,112,67,0.6);
}
.cell.locked {
  background: #e8e8e8;
  color: #aaa;
}
.cell.locked .cell-num { color: #999; }
.cell.locked .cell-lock {
  position: absolute;
  bottom: 12rpx;
  font-size: 24rpx;
}
.cell-num {
  font-size: 32rpx;
  font-weight: bold;
}

.pager {
  position: fixed;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 32rpx;
}
.pager-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #7ec8e3;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pager-icon {
  font-size: 40rpx;
  font-weight: bold;
  line-height: 1;
}
.pager-text {
  font-size: 28rpx;
  color: #666;
}
</style>
