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
      <text class="nav-title">意见反馈</text>
      <view class="nav-placeholder" />
    </view>

    <view class="form-wrap">
      <view class="form-item">
        <text class="label">反馈类型</text>
        <picker
          :value="typeIndex"
          :range="typeOptions"
          range-key="label"
          @change="onTypeChange"
        >
          <view class="picker-value">
            {{ typeOptions[typeIndex].label }}
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">反馈内容 <text class="required">*</text></text>
        <textarea
          v-model="content"
          class="textarea"
          placeholder="请描述您的问题或建议（必填）"
          maxlength="500"
          :show-confirm-bar="false"
        />
        <text class="counter">{{ content.length }}/500</text>
      </view>

      <view class="form-item">
        <text class="label">联系方式（选填）</text>
        <input
          v-model="contact"
          class="input"
          type="text"
          placeholder="微信号/手机号，方便我们回复您"
        />
      </view>

      <view class="btn-wrap">
        <view
          :class="['btn-submit', { disabled: submitting || !content.trim() }]"
          @click="submit"
        >
          <text class="btn-text">{{ submitting ? '提交中…' : '提交反馈' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '../../utils/api'

const typeOptions = [
  { value: '', label: '请选择' },
  { value: 'bug', label: '题目/答案错误' },
  { value: 'suggest', label: '功能建议' },
  { value: 'other', label: '其他' },
]
const typeIndex = ref(0)
const content = ref('')
const contact = ref('')
const submitting = ref(false)

function onTypeChange(e) {
  const i = Number(e.detail.value)
  if (!Number.isNaN(i) && i >= 0 && i < typeOptions.length) {
    typeIndex.value = i
  }
}

function back() {
  uni.navigateBack({ fail: () => { uni.reLaunch({ url: '/pages/levels/levels' }) } })
}

function submit() {
  const text = content.value ? content.value.trim() : ''
  if (!text) {
    uni.showToast({ title: '请填写反馈内容', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true
  const type = typeOptions[typeIndex.value].value || undefined
  api.submitFeedback({
    type,
    content: text,
    contact: contact.value ? contact.value.trim() : undefined,
  })
    .then(() => {
      uni.showToast({ title: '感谢反馈，我们会尽快处理', icon: 'success' })
      content.value = ''
      contact.value = ''
      typeIndex.value = 0
      setTimeout(() => back(), 1500)
    })
    .catch((err) => {
      uni.showToast({ title: err.message || '提交失败，请重试', icon: 'none' })
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
  padding-bottom: 80rpx;
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
  margin-bottom: 48rpx;
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
.nav-placeholder {
  width: 72rpx;
}

.form-wrap {
  position: relative;
  z-index: 2;
}
.form-item {
  margin-bottom: 36rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  color: #6b5b52;
  margin-bottom: 14rpx;
  font-weight: 500;
}
.required {
  color: #c04a38;
}
.picker-value,
.input {
  background: rgba(255, 255, 255, 0.9);
  border: 2rpx solid rgba(200, 160, 140, 0.25);
  border-radius: 20rpx;
  padding: 26rpx 28rpx;
  font-size: 30rpx;
  color: #3d3530;
  box-shadow: 0 2rpx 12rpx rgba(180, 120, 100, 0.06);
}
.textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 26rpx 28rpx;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.9);
  border: 2rpx solid rgba(200, 160, 140, 0.25);
  border-radius: 20rpx;
  font-size: 30rpx;
  color: #3d3530;
  box-shadow: 0 2rpx 12rpx rgba(180, 120, 100, 0.06);
}
.counter {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #a89f98;
  margin-top: 10rpx;
}
.btn-wrap {
  margin-top: 56rpx;
}
.btn-submit {
  height: 96rpx;
  line-height: 96rpx;
  text-align: center;
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
  border-radius: 28rpx;
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 0.06em;
  box-shadow: 0 12rpx 32rpx rgba(192, 74, 56, 0.3), 0 4rpx 0 rgba(160, 50, 40, 0.15);
}
.btn-submit:active {
  transform: scale(0.98);
}
.btn-submit.disabled {
  opacity: 0.5;
}
.btn-text {
  color: #fff;
}
</style>
