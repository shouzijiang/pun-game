<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
      <view class="bg-glow" />
    </view>

    <!-- 顶部状态栏占位 -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-btn" @click="back" :style="{ width: menuButtonHeight + 'px', height: menuButtonHeight + 'px' }">
        <text class="nav-icon">🏠</text>
      </view>
      <view class="nav-center">
        <text class="nav-title">我的关卡</text>
      </view>
    </view>

    <view class="tabs-wrap">
      <view class="tabs">
        <view :class="['tab', { active: tier === 'mid' }]" @click="switchTier('mid')">
          中级
        </view>
        <view :class="['tab', { active: tier === 'beginner' }]" @click="switchTier('beginner')">
          初级
        </view>
      </view>
    </view>

    <view v-if="loading" class="levels-loading">
      <text class="levels-loading-text">加载中…</text>
    </view>
    <block v-else>
      <view class="grid-wrap">
        <view v-for="levelId in displayLevelIds" :key="levelId" class="cell-wrap">
          <view
            :class="['cell', statusClass(levelId)]"
            @click="onLevelClick(levelId)"
          >
            <text v-if="isCompleted(levelId)" class="cell-star">⭐</text>
            <text class="cell-num">{{ levelId }}</text>
            <view v-if="isCompleted(levelId)" class="cell-done">✓</view>
            <view v-else-if="isLocked(levelId)" class="cell-lock">🔒</view>
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
    </block>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { LEVELS_PER_PAGE, getCurrentLevel, getPassedLevels, loadMidLevelList } from '../../data/levels'
import { api } from '../../utils/api'
import { useNavBar } from '../../composables/useNavBar'

const { statusBarHeight, navBarHeight, menuButtonHeight } = useNavBar()

// tier: beginner=初级；mid=中级（issue2.json 的顺序为准）
const tier = ref('mid')

const totalLevels = ref(0)
const perPage = LEVELS_PER_PAGE
const currentPage = ref(1)
const passedSet = ref(new Set(getPassedLevels()))
const currentLevel = ref(getCurrentLevel())

// 中级完整列表（issue2.json 顺序）
const midLevelList = ref([])
const loading = ref(false)

const totalPages = computed(() => Math.ceil(totalLevels.value / perPage) || 1)
const currentStart = computed(() => (currentPage.value - 1) * perPage) // 0-based

const displayLevelIds = computed(() => {
  if (!totalLevels.value) return []
  const start = currentStart.value
  const end = Math.min(start + perPage, totalLevels.value)
  if (tier.value === 'beginner') {
    const arr = []
    for (let id = start + 1; id <= end; id++) arr.push(id)
    return arr
  }
  // mid：用 issue2.json 的顺序表切片
  const list = Array.isArray(midLevelList.value) ? midLevelList.value : []
  return list.slice(start, end)
})

function isCompleted(levelId) {
  return passedSet.value.has(levelId)
}
function isCurrent(levelId) {
  return currentLevel.value != null && levelId === currentLevel.value
}
function isLocked(levelId) {
  return !isCompleted(levelId) && !isCurrent(levelId)
}
function statusClass(levelId) {
  if (isCompleted(levelId)) return 'done'
  if (isCurrent(levelId)) return 'current'
  return 'locked'
}

function onLevelClick(levelId) {
  if (isLocked(levelId)) {
    uni.showToast({ title: '请先通过上一关', icon: 'none' })
    return
  }
  if (tier.value === 'mid') {
    uni.navigateTo({ url: `/pages/playMid/playMid?level=${levelId}` })
  } else {
    uni.navigateTo({ url: `/pages/play/play?level=${levelId}` })
  }
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
  loading.value = true
  if (tier.value === 'mid') {
    // 中级：后端需要返回 midCurrentLevel / midPassedCount / midTotalLevels（见后端文档）
    api.getLevelProgress({ gameTier: 'mid' })
      .then(async (data) => {
        const list = await loadMidLevelList()
        midLevelList.value = list

        const midTotal = data && data.midTotalLevels != null ? data.midTotalLevels : (list.length || 0)
        const midPassedCount = data && data.midPassedCount != null ? data.midPassedCount : 0

        const midCurrentLevel = data && data.midCurrentLevel != null
          ? data.midCurrentLevel
          : (data && data.midCurrentIndex != null ? list[data.midCurrentIndex] : null)

        totalLevels.value = midTotal
        passedSet.value = new Set(list.slice(0, midPassedCount))
        currentLevel.value = midCurrentLevel
      })
      .catch(() => {
        midLevelList.value = []
        totalLevels.value = 0
        passedSet.value = new Set()
        currentLevel.value = null
      })
      .finally(() => {
        loading.value = false
      })
    return
  }

  // 初级：保持兼容老接口（currentLevel/passedLevels/totalLevels）
  api.getLevelProgress({ gameTier: 'beginner' })
    .then((data) => {
      currentLevel.value = data.currentLevel != null ? data.currentLevel : getCurrentLevel()
      passedSet.value = new Set(Array.isArray(data.passedLevels) ? data.passedLevels : getPassedLevels())
      if (data.totalLevels != null) totalLevels.value = data.totalLevels
    })
    .catch(() => {
      passedSet.value = new Set(getPassedLevels())
      currentLevel.value = getCurrentLevel()
      totalLevels.value = 270
    })
    .finally(() => {
      loading.value = false
    })
}

onShow(() => loadProgress())

function switchTier(next) {
  if (tier.value === next) return
  tier.value = next
  currentPage.value = 1
  loadProgress()
}

function back() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 160rpx;
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
  justify-content: center; /* 居中标题 */
  margin-bottom: 40rpx;
}
.nav-btn {
  position: absolute; /* 绝对定位左侧 */
  left: 0;
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
  font-size: 36rpx;
  line-height: 1;
}
.nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #3d3530;
  letter-spacing: 0.06em;
}

.tabs-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  margin-bottom: 30rpx;
}
.tabs {
  display: flex;
  gap: 18rpx;
  padding: 10rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 6rpx 20rpx rgba(180, 120, 100, 0.10);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.tab {
  padding: 14rpx 44rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #8c7a70;
  transition: all 0.2s ease;
}
.tab.active {
  color: #ffffff;
  background: #d45d4a;
  box-shadow: 0 10rpx 30rpx rgba(212, 93, 74, 0.25);
}

.levels-loading {
  position: relative;
  z-index: 2;
  min-height: 45vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.levels-loading-text {
  font-size: 28rpx;
  color: #a89f98;
}

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
