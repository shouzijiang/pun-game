<template>
  <view class="page">
    <view class="bg-wrap">
      <view class="bg-gradient" />
      <view class="bg-deco">💬</view>
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
  font-size: 48rpx;
  opacity: 0.4;
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
.nav-placeholder {
  width: 72rpx;
}

.form-wrap {
  position: relative;
  z-index: 2;
  padding: 24rpx 32rpx;
}
.form-item {
  margin-bottom: 32rpx;
}
.label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}
.required {
  color: #e74c3c;
}
.picker-value,
.input {
  background: #fff;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  font-size: 30rpx;
  color: #333;
}
.textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 24rpx 28rpx;
  box-sizing: border-box;
  background: #fff;
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  font-size: 30rpx;
  color: #333;
}
.counter {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}
.btn-wrap {
  margin-top: 48rpx;
}
.btn-submit {
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(145deg, #ff7043, #e64a19);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 16rpx rgba(230, 74, 25, 0.35);
}
.btn-submit.disabled {
  opacity: 0.6;
}
.btn-text {
  color: #fff;
}
</style>
