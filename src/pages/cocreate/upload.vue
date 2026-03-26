<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-dots" />
    </view>

    <!-- 顶部状态栏占位 -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="nav-bar" :style="{ height: navBarHeight + 'px' }">
      <view class="nav-btn" @click="back" :style="{ width: menuButtonHeight + 'px', height: menuButtonHeight + 'px' }">
        <text class="nav-icon">‹</text>
      </view>
      <text class="nav-title">上传关卡</text>
    </view>

    <view class="form-scroll">
      <view class="form-card">
        <text class="card-label card-label1">关卡答案</text>
        <input
          v-model="form.answer"
          class="input"
          type="text"
          placeholder="例如：车水马龙"
        />
      </view>
      <view class="form-card">
        <text class="card-label card-label1">选词 ({{ wordArray.length }}/20)</text>
        <view class="words-area">
          <view v-if="wordArray.length > 0" class="words-list">
            <view
              v-for="(w, i) in wordArray"
              :key="i"
              class="word-tag"
            >
              {{ w }}
            </view>
          </view>
          <view class="words-actions">
            <view class="btn-words btn-gen" @click="generateWords">
              <text>{{ wordArray.length ? '重新生成' : '生成选词' }}</text>
            </view>
            <view v-if="wordArray.length > 0 && wordArray.length < 20" class="btn-words btn-add" @click="addWord">
              <text>+ 添加</text>
            </view>
          </view>
        </view>
      </view>

      <view class="form-card">
        <text class="card-label">第一张图的提示词（用于生成提示图）</text>
        <textarea
          v-model="form.hintImagePrompt"
          class="textarea"
          placeholder="例如：这是蚂蚁"
          :show-confirm-bar="false"
        />
      </view>

      <view class="form-card">
        <text class="card-label">答案解释（用于生成猜词图）</text>
        <textarea
          v-model="form.answerExplanation"
          class="textarea"
          placeholder="例如：请画出汽车、水池、蚂蚁、龙作为第二个图。"
          :show-confirm-bar="false"
        />
      </view>

      <view class="form-card images-row">
        <view class="image-box">
          <text class="card-label">提示图</text>
          <view class="image-placeholder" @click="generateHintImage">
            <image
              v-if="form.hintImageUrl"
              class="preview-img"
              :src="form.hintImageUrl"
              mode="aspectFill"
            />
            <view v-else class="placeholder-inner">
              <text class="placeholder-icon">✨</text>
              <text class="placeholder-text">AI生成图片</text>
            </view>
          </view>
        </view>
        <view class="image-box">
          <text class="card-label">猜词图</text>
          <view class="image-placeholder" @click="generateAnswerImage">
            <image
              v-if="form.answerImageUrl"
              class="preview-img"
              :src="form.answerImageUrl"
              mode="aspectFill"
            />
            <view v-else class="placeholder-inner">
              <text class="placeholder-icon">✨</text>
              <text class="placeholder-text">AI生成图片</text>
            </view>
          </view>
        </view>
      </view>

      <view class="btn-submit-wrap">
        <view
          :class="['btn-submit', { disabled: submitting || !canSubmit }]"
          @click="submit"
        >
          <text class="btn-submit-text">{{ submitting ? '提交中…' : '提交关卡' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { api } from '../../utils/api'
import { useNavBar } from '../../composables/useNavBar'

const { statusBarHeight, navBarHeight, menuButtonHeight } = useNavBar()

const form = ref({
  answer: '',
  hintImagePrompt: '',
  answerExplanation: '',
  hintImageUrl: '',
  answerImageUrl: '',
})
const wordArray = ref([])
const answerLength = ref(0)
const submitting = ref(false)
const generatingImage = ref('')

const canSubmit = computed(() => {
  const a = (form.value.answer || '').trim()
  const words = wordArray.value
  const h = (form.value.hintImageUrl || '').trim()
  const ans = (form.value.answerImageUrl || '').trim()
  return a.length > 0 && words.length === 20 && h.length > 0 && ans.length > 0
})

function back() {
  uni.navigateBack({ fail: () => { uni.reLaunch({ url: '/pages/cocreate/list' }) } })
}

function generateWords() {
  const a = (form.value.answer || '').trim()
  if (!a) {
    uni.showToast({ title: '请先填写关卡答案', icon: 'none' })
    return
  }
  uni.showLoading({ title: '生成中…', mask: true })
  api.generateCocreateWords(a)
    .then((data) => {
      wordArray.value = Array.isArray(data.wordArray) ? data.wordArray : []
      answerLength.value = data.answerLength != null ? data.answerLength : wordArray.value.length
      uni.hideLoading()
      uni.showToast({ title: '选词已生成', icon: 'success' })
    })
    .catch((err) => {
      uni.hideLoading()
      uni.showToast({ title: err.message || '生成失败', icon: 'none' })
    })
}

function addWord() {
  if (wordArray.value.length >= 20) return
  uni.showModal({
    title: '添加选词',
    content: '输入一个字的候选（将追加到当前选词中）',
    editable: true,
    placeholderText: '字',
    success: (res) => {
      if (res.confirm && res.content) {
        const c = String(res.content).trim().slice(0, 1)
        if (c && wordArray.value.length < 20) {
          wordArray.value = [...wordArray.value, c]
        }
      }
    },
  })
}

function generateHintImage() {
  const prompt = (form.value.hintImagePrompt || '').trim()
  if (!prompt) {
    uni.showToast({ title: '请先填写第一张图提示词', icon: 'none' })
    return
  }
  generatingImage.value = 'hint'
  uni.showLoading({ title: 'AI 生成中…', mask: true })
  api.generateCocreateImage(prompt, 'hint')
    .then((data) => {
      if (data && data.imageUrl) {
        form.value = { ...form.value, hintImageUrl: data.imageUrl }
        uni.showToast({ title: '提示图已生成', icon: 'success' })
      }
    })
    .catch((err) => {
      uni.showToast({ title: err.message || '生成失败', icon: 'none' })
    })
    .finally(() => {
      generatingImage.value = ''
      uni.hideLoading()
    })
}

function generateAnswerImage() {
  const prompt = (form.value.answerExplanation || '').trim()
  if (!prompt) {
    uni.showToast({ title: '请先填写答案解释', icon: 'none' })
    return
  }
  generatingImage.value = 'answer'
  uni.showLoading({ title: 'AI 生成中…', mask: true })
  api.generateCocreateImage(prompt, 'answer')
    .then((data) => {
      if (data && data.imageUrl) {
        form.value = { ...form.value, answerImageUrl: data.imageUrl }
        uni.showToast({ title: '猜词图已生成', icon: 'success' })
      }
    })
    .catch((err) => {
      uni.showToast({ title: err.message || '生成失败', icon: 'none' })
    })
    .finally(() => {
      generatingImage.value = ''
      uni.hideLoading()
    })
}

function submit() {
  if (submitting.value || !canSubmit.value) {
    if (!canSubmit.value) uni.showToast({ title: '请完成答案、选词(20个)和两张图', icon: 'none' })
    return
  }
  const a = (form.value.answer || '').trim()
  const len = answerLength.value || a.length
  submitting.value = true
  api.submitCocreate({
    answer: a,
    answerLength: len,
    hintImagePrompt: (form.value.hintImagePrompt || '').trim(),
    answerExplanation: (form.value.answerExplanation || '').trim(),
    wordArray: wordArray.value,
    hintImageUrl: (form.value.hintImageUrl || '').trim(),
    answerImageUrl: (form.value.answerImageUrl || '').trim(),
  })
    .then((data) => {
      uni.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack({ fail: () => { uni.reLaunch({ url: '/pages/cocreate/list' }) } })
      }, 1500)
    })
    .catch((err) => {
      uni.showToast({ title: err.message || '提交失败', icon: 'none' })
    })
    .finally(() => {
      submitting.value = false
    })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 40rpx;
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
  justify-content: center; /* 居中标题 */
  padding: 0 40rpx;
  margin-bottom: 24rpx;
}
.nav-btn {
  position: absolute;
  left: 40rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #5c534d;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(180, 120, 100, 0.1);
  border: 2rpx solid rgba(200, 160, 140, 0.25);
}
.nav-icon { font-size: 44rpx; font-weight: bold; line-height: 1; }
.nav-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #3d3530;
  letter-spacing: 0.06em;
}

.form-scroll {
  position: relative;
  z-index: 2;
  height: calc(100vh - 200rpx);
  padding: 0 20rpx;
  box-sizing: border-box;
}
.form-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 22rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.15);
}
.card-label {
  display: block;
  font-size: 28rpx;
  color: #5c534d;
  font-weight: 600;
  margin-bottom: 14rpx;
  &.card-label1 {
    color: #4a8c5a;
  }
}
.input {
  width: 100%;
  padding: 22rpx 24rpx;
  font-size: 30rpx;
  color: #3d3530;
  background: rgba(255,255,255,0.8);
  border: 2rpx solid rgba(200, 160, 140, 0.25);
  border-radius: 16rpx;
  box-sizing: border-box;
  height: 80rpx;
  line-height: 80rpx;
}
.textarea {
  width: 100%;
  min-height: 140rpx;
  padding: 22rpx 24rpx;
  font-size: 30rpx;
  color: #3d3530;
  background: rgba(255,255,255,0.8);
  border: 2rpx solid rgba(200, 160, 140, 0.25);
  border-radius: 16rpx;
  box-sizing: border-box;
}

.words-area {
  border: 2rpx dashed rgba(200, 160, 140, 0.35);
  border-radius: 16rpx;
  padding: 20rpx;
  min-height: 120rpx;
}
.words-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}
.word-tag {
  padding: 10rpx 18rpx;
  background: rgba(212, 93, 74, 0.15);
  color: #c04a38;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.words-actions {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}
.btn-words {
  padding: 16rpx 28rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.btn-gen {
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
}
.btn-add {
  background: rgba(255, 255, 255, 0.9);
  color: #5c534d;
  border: 2rpx solid rgba(200, 160, 140, 0.3);
}

.images-row {
  display: flex;
  gap: 24rpx;
}
.image-box {
  flex: 1;
  min-width: 0;
}
.image-placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16rpx;
  border: 2rpx dashed rgba(200, 160, 140, 0.4);
  overflow: hidden;
  background: rgba(250, 240, 235, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-img {
  width: 100%;
  height: 100%;
}
.placeholder-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.placeholder-icon { font-size: 48rpx; }
.placeholder-text { font-size: 26rpx; color: #8a7f78; }

.btn-submit-wrap {
  padding: 32rpx 0 48rpx;
}
.btn-submit {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: linear-gradient(145deg, #5a9e6a 0%, #4a8c5a 100%);
  color: #fff;
  border-radius: 28rpx;
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 0.06em;
  box-shadow: 0 12rpx 32rpx rgba(90, 158, 106, 0.35);
}
.btn-submit:active {
  transform: scale(0.98);
}
.btn-submit.disabled {
  opacity: 0.5;
}
.btn-submit-text { color: #fff; }
</style>
