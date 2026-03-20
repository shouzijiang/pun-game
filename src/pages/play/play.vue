<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
    </view>

    <view class="nav-bar">
      <view class="nav-btn" @click="back">
        <text class="nav-icon">‹</text>
      </view>
      <view class="nav-center">
        <text class="nav-title">{{ cocreateId ? '共创关卡' : '第' + level + '关' }}</text>
        <text class="nav-star">⭐</text>
      </view>
      <button class="btn-help" open-type="share" @click="help">
        <text class="help-icon">💬</text>
        <text class="help-text">求助</text>
      </button>
    </view>

    <view class="card">
      <view class="card-inner">
        <image
          v-if="puzzle.imageUrl"
          class="puzzle-img"
          :src="puzzle.imageUrl"
          mode="aspectFill"
        />
        <view v-else-if="loading" class="puzzle-loading">加载中...</view>
        <text class="puzzle-hint">{{ puzzle.hintText }}</text>
      </view>
    </view>

    <view class="answer-row">
      <view class="answer-slots">
        <view
          v-for="i in answerLen"
          :key="i"
          :class="['slot', { 'slot-error': isSlotError(i - 1), 'slot-shake': slotShake }]"
          @click="removeAt(i - 1)"
        >
          {{ answerChars[i - 1] || '' }}
        </view>
      </view>
    </view>

    <view class="chars-wrap">
      <view
        v-for="(c, idx) in chars"
        :key="idx"
        :class="['char-btn', { 'char-btn-used': isCharUsed(idx) }]"
        @click="pickChar(c, idx)"
      >
        {{ c }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getLevelPuzzle } from '../../data/levels'
import { api } from '../../utils/api'

const level = ref(1)
const cocreateId = ref(0)
const answerLen = ref(3)
const answerChars = ref([])
const chars = ref([])
const puzzle = ref({
  imageUrl: '',
  hintText: '',
})
const loading = ref(true)
const submitting = ref(false)
const feedback = ref([])
const slotShake = ref(false)
/** 当前已选入答案槽的字在 chars 中的下标，与 answerChars 一一对应 */
const pickedIndices = ref([])

function isCharUsed(idx) {
  return pickedIndices.value.includes(idx)
}

function isSlotError(index) {
  const fb = feedback.value[index]
  return fb && fb.isCorrect === false
}

onLoad((opts) => {
  if (opts && opts.cocreateId) {
    cocreateId.value = parseInt(opts.cocreateId, 10)
    level.value = 0
  } else if (opts && opts.level) {
    level.value = parseInt(opts.level, 10)
    cocreateId.value = 0
  }
  loading.value = true
  if (cocreateId.value) {
    api.getCocreateDetail(cocreateId.value).then((data) => {
      if (data) {
        answerLen.value = data.answerLength || 0
        chars.value = Array.isArray(data.wordArray) ? data.wordArray : []
        puzzle.value = {
          imageUrl: data.imageUrl || '',
          hintText: data.hintText || '',
        }
      }
      answerChars.value = []
      pickedIndices.value = []
      loading.value = false
    }).catch(() => {
      loading.value = false
    })
  } else {
    getLevelPuzzle(level.value).then((data) => {
      answerLen.value = data.answerLength
      chars.value = data.wordArray.length ? data.wordArray : []
      puzzle.value = {
        imageUrl: data.imageUrl || '',
        hintText: data.hintText || '',
      }
      answerChars.value = []
      pickedIndices.value = []
      loading.value = false
    }).catch(() => {
      loading.value = false
    })
  }
})

function pickChar(c, idx) {
  if (answerChars.value.length >= answerLen.value) return
  if (isCharUsed(idx)) return
  answerChars.value = [...answerChars.value, c]
  pickedIndices.value = [...pickedIndices.value, idx]
  if (answerChars.value.length === answerLen.value) {
    checkAnswer()
  }
}

function removeAt(i) {
  const arr = [...answerChars.value]
  const indices = [...pickedIndices.value]
  arr.splice(i, 1)
  indices.splice(i, 1)
  answerChars.value = arr
  pickedIndices.value = indices
}

async function checkAnswer() {
  if (submitting.value) return
  const userAnswer = answerChars.value.slice()
  if (userAnswer.length !== answerLen.value) return
  submitting.value = true
  feedback.value = []
  try {
    const isCocreate = !!cocreateId.value
    const data = isCocreate
      ? await api.submitCocreateAnswer(cocreateId.value, userAnswer)
      : await api.submitAnswer(level.value, userAnswer)
    if (data.isCorrect) {
      uni.showToast({ title: '回答正确！', icon: 'success' })
      setTimeout(() => {
        if (isCocreate) {
          uni.navigateBack({ fail: () => { uni.reLaunch({ url: '/pages/cocreate/list' }) } })
        } else {
          const nextLevel = level.value + 1
          if(nextLevel > 270) {
            uni.navigateTo({ url: `/pages/index/index` })
            uni.showToast({ title: '恭喜您已通关,关卡持续更新中,敬请期待~', icon: 'none' })
            return
          }
          uni.navigateTo({ url: `/pages/play/play?level=${nextLevel}` })
        }
      }, 1200)
      return
    }
    feedback.value = data.feedback || []
    slotShake.value = true
    uni.showToast({ title: '再想想～', icon: 'none' })
    setTimeout(() => {
      slotShake.value = false
      setTimeout(() => {
        answerChars.value = []
        pickedIndices.value = []
        feedback.value = []
      }, 200)
    }, 600)
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function back() {
  uni.reLaunch({ url: '/pages/index/index' })
}

// 非微信端点击「求助」时提示（微信端由 open-type="share" 唤起分享）
function help() {
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '分享给好友一起猜～', icon: 'none' })
  // #endif
}

// 微信小程序分享：好友打开后进入当前关卡或共创
onShareAppMessage(() => {
  if (cocreateId.value) {
    return {
      title: '这条谐音梗等你来猜！',
      path: `/pages/play/play?cocreateId=${cocreateId.value}`,
    }
  }
  return {
    title: `第${level.value}关求助，快来帮我猜谐音梗！`,
    path: `/pages/play/play?level=${level.value}`,
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-top: 12vh;
  padding-bottom: 48rpx;
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
  background: linear-gradient(165deg, #fff9f3 0%, #ffefe6 50%, #fce8e0 100%);
}
.bg-dots {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: radial-gradient(circle at 1px 1px, #e8d5ce 1px, transparent 0);
  background-size: 40rpx 40rpx;
}

.nav-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
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
.nav-center {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.nav-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #3d3530;
  letter-spacing: 0.04em;
}
.nav-star { font-size: 30rpx; }
.btn-help {
  margin: 0;
  padding: 18rpx 28rpx;
  border: none;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #6b5b52;
  font-size: inherit;
  line-height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  box-shadow: 0 4rpx 16rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.btn-help::after {
  border: none;
}
.help-icon { font-size: 30rpx; }
.help-text { font-size: 26rpx; font-weight: 500; }

.card {
  position: relative;
  z-index: 2;
  margin-bottom: 32rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 28rpx rgba(180, 120, 100, 0.1), 0 2rpx 8rpx rgba(0,0,0,0.04);
  background: rgba(255, 255, 255, 0.95);
  border: 2rpx solid rgba(200, 160, 140, 0.15);
}
.card-inner {
  min-height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 24rpx;
}
.puzzle-img {
  width: 110%;
  height: 650rpx;
  border-radius: 16rpx;
}
.puzzle-loading {
  height: 420rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #a89f98;
}
.puzzle-hint {
  margin-top: 24rpx;
  padding: 0 24rpx 28rpx;
  font-size: 32rpx;
  color: #3d3530;
  font-weight: 500;
  text-align: center;
}

.answer-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 0;
  margin-bottom: 32rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.answer-slots {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 18rpx;
}
.slot {
  width: 76rpx;
  height: 76rpx;
  border: 2rpx dashed rgba(180, 140, 120, 0.4);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #3d3530;
  background: rgba(255, 255, 255, 0.8);
}
.slot-error {
  border-color: #c04a38;
  border-style: solid;
  color: #c04a38;
  background: rgba(255, 220, 210, 0.5);
}
.slot-shake {
  animation: slot-shake 0.4s ease-in-out;
}
@keyframes slot-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8rpx); }
  40% { transform: translateX(8rpx); }
  60% { transform: translateX(-6rpx); }
  80% { transform: translateX(6rpx); }
}

.chars-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  justify-content: center;
}
.char-btn {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
  font-size: 36rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 20rpx rgba(192, 74, 56, 0.3), inset 0 2rpx 0 rgba(255,255,255,0.2);
  border: 2rpx solid transparent;
}
.char-btn:active {
  transform: scale(0.96);
}
.char-btn-used {
  background: rgba(200, 180, 170, 0.5);
  color: #a89f98;
  box-shadow: none;
  border: 2rpx solid rgba(200, 160, 140, 0.25);
}
</style>
