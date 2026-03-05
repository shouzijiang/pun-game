<template>
  <view class="page">
    <view class="bg-gradient" />
    <view class="nav-bar">
      <view class="nav-btn" @click="back">
        <text class="nav-icon">‹</text>
      </view>
      <text class="nav-title">排行榜</text>
      <view class="nav-btn nav-btn-refresh" @click="refresh">
        <text class="nav-icon">↻</text>
      </view>
    </view>

    <!-- <view class="tabs">
      <view class="tab active">
        <text class="tab-icon">🏆</text>
        <text class="tab-text">闯关达人</text>
      </view>
    </view> -->

    <scroll-view class="list" scroll-y>
      <view
        v-for="(item, index) in list"
        :key="item.user_id"
        class="item"
      >
        <view class="item-left">
          <view class="rank-badge">
            <text v-if="index === 0" class="rank-icon">👑</text>
            <text v-else-if="index === 1" class="rank-icon">🛡</text>
            <text v-else-if="index === 2" class="rank-icon">🎀</text>
            <text v-else class="rank-num">{{ index + 1 }}</text>
          </view>
          <image v-if="item.avatar" class="avatar-img" :src="item.avatar"  />
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
  padding-bottom: 40rpx;
  padding-top: 5vh;
  box-sizing: border-box;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #fff8e7 0%, #ffe4c4 100%);
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
.nav-btn-refresh {
  background: #90ee90;
}
.nav-icon {
  font-size: 48rpx;
  font-weight: bold;
  line-height: 1;
}
.nav-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #e67e22;
}

.tabs {
  position: relative;
  z-index: 2;
  padding: 0 32rpx 24rpx;
}
.tab {
  background: linear-gradient(90deg, #ff9a56, #ffb6c1);
  border-radius: 32rpx;
  padding: 20rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.tab-icon { font-size: 36rpx; }
.tab-text { font-size: 30rpx; color: #333; font-weight: 500; }

.list {
  position: relative;
  z-index: 2;
  height: calc(100vh - 320rpx);
  padding: 0 32rpx;
  box-sizing: border-box;
  .uni-scroll-view {
    width: 100%;
  }
}
.item {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}
.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.rank-badge {
  width: 56rpx;
  text-align: center;
}
.rank-icon { font-size: 44rpx; }
.rank-num {
  font-size: 32rpx;
  font-weight: bold;
  color: #666;
}
.avatar-img,
.avatar-fallback {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #f0f0f0;
}
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}
.info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.name { font-size: 28rpx; color: #333; font-weight: 500; }
.time { font-size: 22rpx; color: #999; }
.item-right {
  display: flex;
  align-items: baseline;
}
.level-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #e67e22;
}
.level-unit {
  font-size: 24rpx;
  color: #e67e22;
  margin-left: 4rpx;
}
</style>
