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
      <text class="nav-title">共创列表</text>
      <view class="btn-upload" @click="goUpload">
        <text class="btn-upload-text">上传关卡</text>
      </view>
    </view>

    <scroll-view
      class="list-wrap"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view
        v-for="item in list"
        :key="item.id"
        class="card"
        @click="play(item.id)"
      >
        <view class="card-img-wrap">
          <image
            v-if="item.hintImageUrl || item.answerImageUrl"
            class="card-img"
            :src="item.answerImageUrl || item.hintImageUrl"
            mode="aspectFill"
          />
          <view v-else class="card-img-placeholder">🖼</view>
        </view>
        <view class="card-info">
          <text class="card-answer">答案：{{ item.answer || '谐音梗' }}</text>
          <text class="card-meta">{{ item.nickname || '用户' }} · {{ item.createdAt || '' }}</text>
        </view>
        <view class="card-play">
          <text class="card-play-text">去玩</text>
          <text class="card-play-arrow">→</text>
        </view>
      </view>
      <view v-if="list.length === 0 && !loading" class="empty">
        <text class="empty-text">暂无共创关卡</text>
        <view class="empty-btn" @click="goUpload">去上传</view>
      </view>
      <view v-if="loading" class="loading-wrap">
        <text class="loading-text">加载中…</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '../../utils/api'

const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)
const noMore = ref(false)

function loadList(append = false) {
  if (loading.value) return
  if (!append) {
    page.value = 1
    list.value = []
    noMore.value = false
  }
  if (noMore.value && append) return
  loading.value = true
  api.getCocreateList({ page: page.value, page_size: pageSize })
    .then((data) => {
      const rows = (data.list || []).map((item) => ({
        id: item.id,
        userId: item.userId ?? item.user_id,
        nickname: item.nickname,
        avatar: item.avatar,
        answer: item.answer,
        hintImageUrl: item.hintImageUrl ?? item.hint_image_url,
        answerImageUrl: item.answerImageUrl ?? item.answer_image_url,
        createdAt: item.createdAt ?? item.created_at,
      }))
      if (append) {
        list.value = list.value.concat(rows)
      } else {
        list.value = rows
      }
      total.value = data.total != null ? data.total : 0
      if (rows.length < pageSize) noMore.value = true
      else page.value++
    })
    .catch(() => {
      if (!append) list.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

function loadMore() {
  loadList(true)
}

onShow(() => loadList())

function back() {
  uni.navigateBack({ fail: () => { uni.reLaunch({ url: '/pages/index/index' }) } })
}
function goUpload() {
  uni.navigateTo({ url: '/pages/cocreate/upload' })
}
function play(id) {
  uni.navigateTo({ url: `/pages/play/play?cocreateId=${id}` })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-top: 12vh;
  padding-bottom: 40rpx;
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
  height: 40%;
  background: radial-gradient(ellipse at center, rgba(255, 180, 150, 0.2) 0%, transparent 70%);
  pointer-events: none;
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
.nav-icon { font-size: 44rpx; font-weight: bold; line-height: 1; }
.nav-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #3d3530;
  letter-spacing: 0.06em;
}
.btn-upload {
  padding: 18rpx 28rpx;
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(192, 74, 56, 0.3);
}
.btn-upload-text { color: #fff; }

.list-wrap {
  position: relative;
  z-index: 2;
  height: calc(100vh - 220rpx);
}
.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 22rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.15);
}
.card-img-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
}
.card-img {
  width: 100%;
  height: 100%;
}
.card-img-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(240, 230, 220, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
}
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.card-answer {
  font-size: 30rpx;
  font-weight: 600;
  color: #3d3530;
}
.card-meta {
  font-size: 24rpx;
  color: #a89f98;
}
.card-play {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #c04a38;
  font-size: 28rpx;
  font-weight: 600;
}
.card-play-arrow { font-size: 32rpx; }

.empty {
  padding: 80rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}
.empty-text { font-size: 28rpx; color: #a89f98; }
.empty-btn {
  padding: 20rpx 40rpx;
  background: linear-gradient(145deg, #d45d4a 0%, #c04a38 100%);
  color: #fff;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.loading-wrap {
  padding: 24rpx;
  text-align: center;
}
.loading-text { font-size: 26rpx; color: #a89f98; }
</style>
