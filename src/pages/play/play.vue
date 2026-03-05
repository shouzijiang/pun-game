<template>
  <view class="page">
    <view class="bg-soft" />
    <view class="nav-bar">
      <view class="nav-btn" @click="back">
        <text class="nav-icon">‹</text>
      </view>
      <view class="nav-center">
        <text class="nav-title">第{{ level }}关</text>
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
  if (opts && opts.level) level.value = parseInt(opts.level, 10)
  loading.value = true
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
    const data = await api.submitAnswer(level.value, userAnswer)
    if (data.isCorrect) {
      uni.showToast({ title: '回答正确！', icon: 'success' })
      setTimeout(() => {
        uni.navigateTo({ url: `/pages/play/play?level=${level.value + 1}` })
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

// 微信小程序分享：好友打开后进入当前关卡
onShareAppMessage(() => ({
  title: `第${level.value}关求助，快来帮我猜谐音梗！`,
  path: `/pages/play/play?level=${level.value}`,
}))
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-top: 5vh;
  padding-bottom: 5vh;
  box-sizing: border-box;
}

.bg-soft {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #fffef7 0%, #fff8e7 100%);
  z-index: 0;
}

.nav-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 80rpx 32rpx 32rpx;
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
.nav-center {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #e91e63;
}
.nav-star { font-size: 32rpx; }
.btn-help {
  margin: 0;
  padding: 14rpx 24rpx;
  border: none;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #ffb6c1, #ffc0cb);
  color: #333;
  font-size: inherit;
  line-height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.btn-help::after {
  border: none;
}
.help-icon { font-size: 28rpx; }
.help-text { font-size: 26rpx; }

.card {
  position: relative;
  z-index: 2;
  margin: 0 0 32rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  background: #fff;
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
  height: 480rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
}
.puzzle-hint {
  margin-top: 24rpx;
  font-size: 32rpx;
  color: #333;
}


.answer-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:24rpx 32rpx 24rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  margin: 0 32rpx 32rpx;
  border-radius: 24rpx;
}
.answer-slots {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
}
.slot {
  width: 72rpx;
  height: 72rpx;
  border: 2rpx dashed #ccc;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #333;
  background: #fff;
}
.slot-error {
  border-color: #e74c3c;
  color: #e74c3c;
  background: #ffebee;
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
  gap: 16rpx;
  padding: 0 32rpx;
  justify-content: center;
}
.char-btn {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(145deg, #7ec8e3, #5eb5d4);
  color: #fff;
  font-size: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.char-btn-used {
  background: #ccc;
  color: #999;
  box-shadow: none;
}
</style>
