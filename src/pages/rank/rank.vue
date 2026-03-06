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
      <text class="nav-title">排行榜</text>
      <view class="nav-btn nav-btn-refresh" @click="refresh">
        <text class="nav-icon">↻</text>
      </view>
    </view>

    <scroll-view class="list" scroll-y>
      <view
        v-for="(item, index) in list"
        :key="item.user_id"
        :class="['item', { 'item-top3': index < 3 }]"
      >
        <view class="item-left">
          <view :class="['rank-badge', { 'rank-badge-top': index < 3 }]">
            <text v-if="index === 0" class="rank-icon">👑</text>
            <text v-else-if="index === 1" class="rank-icon">🥈</text>
            <text v-else-if="index === 2" class="rank-icon">🥉</text>
            <text v-else class="rank-num">{{ index + 1 }}</text>
          </view>
          <image v-if="item.avatar" class="avatar-img" :src="item.avatar" mode="aspectFill" />
          <view v-else class="avatar-fallback">👤</view>
          <view class="info">
            <text class="name">{{ item.nickname || '用户' }}</text>
            <text class="time">{{ item.updated_at ? '最近: ' + item.updated_at : '' }}</text>
          </view>
        </view>
        <view class="item-right">
          <text class="level-num">{{ item.max_level }}</text>
          <text class="level-unit">关</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '../../utils/api'

const list = ref([])

function loadRank() {
  api.getRankList({ page: 1, page_size: 50 })
    .then((data) => {
      list.value = (data.list || []).map((item) => ({
        user_id: item.user_id,
        nickname: item.nickname,
        avatar: item.avatar,
        max_level: item.max_level,
        updated_at: item.updated_at || '',
      }))
    })
    .catch(() => {
      list.value = []
    })
}

onShow(() => loadRank())

function back() {
  uni.reLaunch({ url: '/pages/index/index' })
}
function refresh() {
  loadRank()
  uni.showToast({ title: '已刷新', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 48rpx;
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
.nav-btn-refresh {
  color: #5c534d;
}
.nav-btn:active {
  transform: scale(0.96);
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

.list {
  position: relative;
  z-index: 2;
  height: calc(100vh - 280rpx);
  box-sizing: border-box;
  .uni-scroll-view {
    width: 100%;
  }
}
.item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 22rpx;
  padding: 26rpx 28rpx;
  margin-bottom: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 16rpx rgba(180, 120, 100, 0.08);
  border: 2rpx solid rgba(200, 160, 140, 0.15);
}
.item-top3 {
  border-color: rgba(212, 93, 74, 0.2);
  box-shadow: 0 6rpx 20rpx rgba(192, 74, 56, 0.12);
}
.item-left {
  display: flex;
  align-items: center;
  gap: 22rpx;
}
.rank-badge {
  width: 56rpx;
  text-align: center;
}
.rank-badge-top {
  min-width: 56rpx;
}
.rank-icon { font-size: 42rpx; }
.rank-num {
  font-size: 30rpx;
  font-weight: 700;
  color: #8a7f78;
}
.avatar-img,
.avatar-fallback {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(240, 230, 220, 0.8);
  border: 2rpx solid rgba(200, 160, 140, 0.2);
}
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38rpx;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.name { font-size: 30rpx; color: #3d3530; font-weight: 600; }
.time { font-size: 24rpx; color: #a89f98; }
.item-right {
  display: flex;
  align-items: baseline;
}
.level-num {
  font-size: 40rpx;
  font-weight: 800;
  color: #c04a38;
  letter-spacing: 0.02em;
}
.level-unit {
  font-size: 26rpx;
  color: #c04a38;
  margin-left: 6rpx;
  font-weight: 500;
  opacity: 0.9;
}
</style>
