<template>
  <view class="page page--mid">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
    </view>

    <view class="nav-bar">
      <view class="nav-btn" @click="back">
        <text class="nav-icon">🏠</text>
      </view>
      <view class="nav-center">
        <text class="nav-title">中级 · 第{{ level }}关</text>
        <text class="nav-star">⭐</text>
      </view>
      <button class="btn-help" open-type="share" @click="help">
        <text class="help-icon">💬</text>
        <text class="help-text">求助</text>
      </button>
    </view>

    <view class="card card--mid">
      <view v-if="puzzle.keywordHint" class="keyword-tab">
        <text class="keyword-tab-text">{{ puzzle.keywordHint }}</text>
      </view>

      <view class="card-inner card-inner--stack">
        <view class="stack-block">
          <image v-if="puzzle.imageUrlTop" class="stack-img" :src="puzzle.imageUrlTop" mode="aspectFill" />
          <view v-else-if="loading" class="stack-placeholder">加载中...</view>
          <view v-else class="stack-placeholder">暂无配图</view>
          <text v-if="puzzle.topCaption" class="stack-caption">{{ puzzle.topCaption }}</text>
        </view>

        <view class="stack-block">
          <image v-if="puzzle.imageUrlBottom" class="stack-img" :src="puzzle.imageUrlBottom" mode="aspectFill" />
          <view v-else-if="loading" class="stack-placeholder">加载中...</view>
          <view v-else class="stack-placeholder">暂无下图</view>
          <!-- 你给的数据里 bottomcaption 没有单独字段，这里预留留白 -->
          <text v-if="puzzle.bottomCaption" class="stack-caption">{{ puzzle.bottomCaption }}</text>
        </view>
      </view>
    </view>

    <view class="answer-row answer-row--mid">
      <input
        ref="midInputRef"
        class="answer-mid-input-cover"
        type="text"
        :value="answerInputValue"
        @input="onMidAnswerInput"
        confirm-type="done"
        @focus="onMidInputFocus"
        @blur="onMidInputBlur"
        @click.stop="focusMidInput()"
      />

      <view class="answer-slots">
        <view
          v-for="i in answerLen"
          :key="i"
          :class="['slot', { 'slot-error': isSlotError(i - 1), 'slot-shake': slotShake }]"
        >
          <text v-if="answerChars[i - 1]" class="slot-char">{{ answerChars[i - 1] }}</text>
          <view v-else-if="caretIndex === i - 1" class="slot-caret" />
        </view>
      </view>
    </view>

    <view class="stuck-tip">
      <text>若通过后没进入下一关，请点击右上角重新游戏</text>
    </view>

    <!-- 通关成功动画弹层 -->
    <view v-if="showSuccess" class="success-overlay">
      <view class="success-content">
        <view class="success-icon-wrap">
          <text class="success-icon">🎉</text>
        </view>
        <text class="success-title">回答正确！</text>
        <!-- <text class="success-subtitle">太棒了，脑洞大开</text> -->
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getMidLevelPuzzle, getMidNextLevel } from '../../data/levels'
import { api } from '../../utils/api'

const level = ref(0)
const answerLen = ref(3)
const answerChars = ref([])
const puzzle = ref({
  imageUrlTop: '',
  imageUrlBottom: '',
  topCaption: '',
  bottomCaption: '',
  keywordHint: '',
})
const loading = ref(true)
const submitting = ref(false)
const feedback = ref([])
const slotShake = ref(false)
const showSuccess = ref(false)

const answerInputValue = ref('')
const midInputRef = ref(null)
const midInputFocused = ref(false)

const caretIndex = computed(() => {
  // 光标显示在“下一个将要输入的位置”的槽位里
  // 用户输入长度到达 answerLen 后，隐藏光标（正在校验/已完成）
  if (!midInputFocused.value) return -1
  const n = answerChars.value.length
  if (n >= answerLen.value) return -1
  return n
})

function isSlotError(index) {
  const fb = feedback.value[index]
  return fb && fb.isCorrect === false
}

function onMidInputFocus() {
  midInputFocused.value = true
}

function onMidInputBlur() {
  midInputFocused.value = false
}

function focusMidInput() {
  nextTick(() => {
    const el = midInputRef.value
    if (el && typeof el.focus === 'function') el.focus()
  })
}

function onMidAnswerInput(e) {
  const raw = (e.detail && e.detail.value) || ''
  // 不对原始输入做 maxlength 截断，否则拼音输入法（先输入字母再转汉字）会在字母长度达到 answerLen 时卡住。
  answerInputValue.value = raw

  // 只有当用户输入里已经出现汉字时，才根据 answerLength 计算槽位与自动判定。
  // （中级题库答案主要是中文；如果你后续有非中文答案，可以再补一套规则。）
  const hasHan = /[\u4e00-\u9fff]/.test(raw)
  if (!hasHan) {
    answerChars.value = []
    return
  }

  const parts = Array.from(raw).slice(0, answerLen.value)
  answerChars.value = parts
  if (parts.length === answerLen.value) checkAnswer()
}

async function checkAnswer() {
  if (submitting.value) return
  // answerChars 已按 answerLength 计算（仅在输入里出现汉字后更新）
  const userAnswer = answerChars.value.slice()
  if (userAnswer.length !== answerLen.value) return
  submitting.value = true
  feedback.value = []

  try {
    const data = await api.submitAnswer(level.value, userAnswer, { gameTier: 'mid' })
    if (data.isCorrect) {
      showSuccess.value = true
      const nextLevel = await getMidNextLevel(level.value)
      setTimeout(() => {
          showSuccess.value = false
          if (nextLevel == null) {
            uni.navigateTo({ url: '/pages/index/index' })
            uni.showToast({ title: '恭喜您已通关中级,关卡持续更新中,敬请期待~', icon: 'none' })
            return
          }
          uni.navigateTo({ url: `/pages/playMid/playMid?level=${nextLevel}` })
        }, 1500)
      return
    }

    feedback.value = data.feedback || []
    slotShake.value = true
    uni.showToast({ title: '再想想～', icon: 'none' })
    setTimeout(() => {
      slotShake.value = false
      setTimeout(() => {
        answerChars.value = []
        answerInputValue.value = ''
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

function help() {
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '分享给好友一起猜～', icon: 'none' })
  // #endif
}

onLoad((opts) => {
  const lv = opts && opts.level ? parseInt(opts.level, 10) : 0
  level.value = lv
  loading.value = true

  getMidLevelPuzzle(lv).then((data) => {
    answerLen.value = data.answerLength || 3
    puzzle.value = {
      imageUrlTop: data.imageUrlTop || '',
      imageUrlBottom: data.imageUrlBottom || '',
      topCaption: data.topCaption || '',
      bottomCaption: data.bottomCaption || '',
      keywordHint: data.keywordHint || '',
    }
    answerChars.value = []
    feedback.value = []
    answerInputValue.value = ''
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
})

onShareAppMessage(() => {
  return {
    title: `中级第${level.value}关，快来帮我猜谐音梗！`,
    path: `/pages/playMid/playMid?level=${level.value}`,
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-top: 8vh;
  padding-bottom: 48rpx;
  padding-left: 40rpx;
  padding-right: 40rpx;
  box-sizing: border-box;
}

.page--mid .bg-gradient {
  background: linear-gradient(165deg, #e8f4fc 0%, #d4e8f8 45%, #c5dff5 100%);
}
.page--mid .bg-dots {
  opacity: 0.45;
  background-image: radial-gradient(circle at 1px 1px, rgba(120, 160, 200, 0.35) 1px, transparent 0);
  background-size: 40rpx 40rpx;
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
  justify-content: center; /* 居中整个导航栏的内容 */
  margin-bottom: 32rpx;
  min-height: 88rpx;
}
.nav-btn {
  position: absolute; /* 绝对定位到左侧，不影响标题居中 */
  left: 0;
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
.page--mid .nav-btn {
  border-color: rgba(140, 170, 210, 0.35);
  box-shadow: 0 4rpx 16rpx rgba(100, 140, 180, 0.12);
}
.nav-icon {
  font-size: 36rpx;
  line-height: 1;
}
.nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
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
  position: absolute; /* 绝对定位到右侧，因为微信胶囊存在，其实这块区域容易被挡住，看需求可以留着或隐藏 */
  right: 0;
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
.page--mid .btn-help {
  border-color: rgba(140, 170, 210, 0.3);
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
.card--mid {
  overflow: visible;
  border-radius: 28rpx;
  box-shadow: 0 12rpx 36rpx rgba(100, 140, 180, 0.14), 0 2rpx 10rpx rgba(0,0,0,0.05);
  border-color: rgba(180, 200, 230, 0.5);
}

.keyword-tab {
  position: absolute;
  top: 26rpx;
  right: 18rpx;
  z-index: 4;
  min-height: auto;
  padding: 14rpx 20rpx;
  background: #d45d4a;
  border-radius: 14rpx;
  box-shadow: 0 10rpx 24rpx rgba(212, 93, 74, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.keyword-tab-text {
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
  writing-mode: horizontal-tb;
  letter-spacing: 0.02em;
  line-height: 1;
}

.card-inner {
  min-height: 400rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 24rpx;
}
.card-inner--stack {
  min-height: auto;
  padding: 36rpx 28rpx 72rpx;
  gap: 28rpx;
}
.stack-block {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.stack-img {
  width: 100%;
  height: 400rpx;
  border-radius: 20rpx;
  background: #f0f4f8;
}
.stack-placeholder {
  width: 100%;
  height: 220rpx;
  border-radius: 20rpx;
  background: rgba(240, 244, 248, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #8a9aaa;
}
.stack-caption {
  font-size: 30rpx;
  font-weight: 700;
  color: #2c3a4a;
  text-align: center;
  line-height: 1.5;
  padding: 0 8rpx;
  margin-top: -90rpx;
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
.answer-row--mid {
  min-height: 132rpx;
  border-color: rgba(180, 200, 230, 0.45);
  box-shadow: 0 6rpx 20rpx rgba(100, 140, 180, 0.1);
}
.answer-mid-input-cover {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  opacity: 0.001;
  z-index: 3;
  font-size: 32rpx;
  color: transparent;
  caret-color: transparent;
  background: transparent;
  border: none;
  padding: 0;
}
.answer-slots {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 18rpx;
  flex-wrap: wrap;
}
.slot {
  min-width: 76rpx;
  height: 76rpx;
  padding: 0 8rpx;
  border: 2rpx dashed rgba(180, 140, 120, 0.4);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #3d3530;
  background: rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
}

.slot-char {
  // 保证字符与原槽位视觉居中一致
  line-height: 1;
}

.slot-caret {
  width: 10rpx;
  height: 46rpx;
  border-radius: 8rpx;
  background: rgba(80, 120, 200, 0.55);
  animation: caret-blink 1s steps(2, start) infinite;
}

@keyframes caret-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.stuck-tip {
  position: relative;
  z-index: 2;
  text-align: center;
  font-size: 24rpx;
  color: #8a9aaa;
  margin-top: -16rpx;
  margin-bottom: 32rpx;
}
.answer-row--mid .slot {
  border-color: rgba(140, 170, 200, 0.45);
  background: rgba(248, 252, 255, 0.95);
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

/* ---------------------------------
   成功动画弹层样式
--------------------------------- */
.success-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out forwards;
}
.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, #ffffff 0%, #fdfbfb 100%);
  padding: 60rpx 80rpx;
  border-radius: 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.2);
  transform: scale(0.8);
  opacity: 0;
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.1s;
}
.success-icon-wrap {
  width: 160rpx;
  height: 160rpx;
  background: #f0fdf4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: inset 0 0 20rpx rgba(74, 222, 128, 0.2);
}
.success-icon {
  font-size: 80rpx;
  animation: bounce 1s infinite;
}
.success-title {
  font-size: 48rpx;
  font-weight: 900;
  color: #166534;
  margin-bottom: 16rpx;
}
.success-subtitle {
  font-size: 28rpx;
  color: #22c55e;
  font-weight: 600;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.8) translateY(40rpx); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}
</style>

