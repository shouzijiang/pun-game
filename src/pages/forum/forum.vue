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
        <text class="nav-title">闲聊</text>
      </view>
    </view>

    <view v-if="loading" class="loading-wrap">
      <text class="loading-text">加载中…</text>
    </view>

    <scroll-view v-else class="list" scroll-y>
      <view class="post-card">
        <text class="post-title">发新帖</text>
        <input
          v-model="postTitle"
          class="post-input"
          maxlength="60"
          placeholder="输入标题"
        />
        <textarea
          v-model="postContent"
          class="post-textarea"
          maxlength="1000"
          :show-confirm-bar="false"
          placeholder="聊点什么吧…"
        />
        <view class="post-actions">
          <text class="post-counter">{{ postContent.length }}/1000</text>
          <view
            :class="['post-submit', { disabled: posting || !postContent.trim() }]"
            @click="submitTopic"
          >
            <text class="post-submit-text">{{ posting ? '发布中…' : '发布帖子' }}</text>
          </view>
        </view>
      </view>

      <view v-if="list.length === 0" class="empty-wrap">
        <text class="empty-text">暂无帖子</text>
      </view>

      <view
        v-for="item in list"
        :key="item.id"
        :class="['item-wrap', { 'item-wrap--open': expandedId === item.id }]"
      >
        <view class="item" @click="toggleThread(item.id)">
          <image v-if="item.avatar" class="avatar-img" :src="item.avatar" mode="aspectFill" />
          <view v-else class="avatar-fallback">👤</view>

          <view class="item-body">
            <view class="item-header">
              <view class="item-title">{{ item.title || '未命名' }}</view>
              <text class="item-chevron">{{ expandedId === item.id ? '▲' : '▼' }}</text>
            </view>
            <view class="item-content">{{ item.content || '' }}</view>

            <view class="item-meta">
              <text class="meta-text">浏览 {{ item.view_count ?? 0 }}</text>
              <text class="meta-text">回复 {{ item.reply_count ?? 0 }}</text>
              <text v-if="item.updated_at" class="meta-text meta-text--time">{{ item.updated_at }}</text>
            </view>
          </view>
        </view>

        <!-- 阶梯展开：正文、回复列表、回复框 -->
        <view v-if="expandedId === item.id" class="thread-ladder" @click.stop>
          <view v-if="expandLoading" class="expand-loading">
            <text class="expand-loading-text">加载中…</text>
          </view>
          <template v-else>
            <!-- <view v-if="expandedTopic" class="ladder-topic">
              <view class="ladder-topic-title">{{ expandedTopic.title || '未命名' }}</view>
              <view class="ladder-topic-content">{{ expandedTopic.content || '' }}</view>
              <view class="ladder-topic-meta">
                <text class="meta-text">浏览 {{ expandedTopic.view_count ?? 0 }}</text>
                <text class="meta-text">回复 {{ expandedTopic.reply_count ?? 0 }}</text>
                <text v-if="expandedTopic.created_at" class="meta-text meta-text--time">{{ expandedTopic.created_at }}</text>
              </view>
            </view> -->

            <view class="ladder-replies">
              <text class="ladder-section-title">回复</text>
              <view v-if="expandedReplies.length === 0" class="ladder-empty">
                <text class="ladder-empty-text">暂无回复，来抢沙发～</text>
              </view>
              <view
                v-for="r in expandedReplies"
                :key="r.id"
                class="ladder-reply"
              >
                <text class="ladder-reply-nick">{{ r.nickname || '用户' }}</text>
                <text class="ladder-reply-body">{{ r.content || '' }}</text>
                <text v-if="r.created_at" class="ladder-reply-time">{{ r.created_at }}</text>
              </view>
            </view>

            <view class="ladder-reply-form">
              <text class="ladder-section-title">我也说两句</text>
              <textarea
                v-model="replyDraft"
                class="ladder-textarea"
                maxlength="1000"
                :show-confirm-bar="false"
                placeholder="输入回复内容…"
              />
              <view class="ladder-form-actions">
                <text class="ladder-counter">{{ replyDraft.length }}/1000</text>
                <view
                  :class="['ladder-submit', { disabled: replySubmitting || !replyDraft.trim() }]"
                  @click="submitReply"
                >
                  <text class="ladder-submit-text">{{ replySubmitting ? '发送中…' : '发送回复' }}</text>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '../../utils/api'
import { useNavBar } from '../../composables/useNavBar'

const { statusBarHeight, navBarHeight, menuButtonHeight } = useNavBar()

const loading = ref(false)
const posting = ref(false)
const list = ref([])
const postTitle = ref('')
const postContent = ref('')

/** 当前展开的帖子 id（单开，阶梯式） */
const expandedId = ref(null)
const expandLoading = ref(false)
const expandedTopic = ref(null)
const expandedReplies = ref([])
const replyDraft = ref('')
const replySubmitting = ref(false)

/** 从详情页重定向带 ?id= 时，首屏展开 */
const pendingExpandId = ref(null)

function back() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
}

function toggleThread(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    expandedTopic.value = null
    expandedReplies.value = []
    replyDraft.value = ''
    return
  }
  expandedId.value = id
  loadExpandedDetail(id)
}

async function loadExpandedDetail(id) {
  expandLoading.value = true
  expandedTopic.value = null
  expandedReplies.value = []
  try {
    const data = await api.getForumDetail({
      id,
      page: 1,
      page_size: 50,
    })
    expandedTopic.value = data && data.topic ? data.topic : null
    expandedReplies.value =
      data && data.replies && Array.isArray(data.replies.list) ? data.replies.list : []

    const idx = list.value.findIndex((x) => x.id === id)
    if (idx >= 0 && expandedTopic.value) {
      const t = expandedTopic.value
      list.value[idx] = {
        ...list.value[idx],
        view_count: t.view_count ?? list.value[idx].view_count,
        reply_count: t.reply_count ?? list.value[idx].reply_count,
        title: t.title ?? list.value[idx].title,
        content: t.content ?? list.value[idx].content,
        updated_at: t.updated_at ?? list.value[idx].updated_at,
      }
    }
  } catch {
    expandedTopic.value = null
    expandedReplies.value = []
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    expandLoading.value = false
  }
}

async function submitReply() {
  if (replySubmitting.value) return
  const text = (replyDraft.value || '').trim()
  if (!text || expandedId.value == null) return

  replySubmitting.value = true
  try {
    await api.replyForum({
      topic_id: expandedId.value,
      content: text,
      reply_to_id: 0,
    })
    uni.showToast({ title: '回复成功', icon: 'success' })
    replyDraft.value = ''
    await loadExpandedDetail(expandedId.value)
    await loadForumList()
  } catch (err) {
    uni.showToast({ title: err?.message || '回复失败', icon: 'none' })
  } finally {
    replySubmitting.value = false
  }
}

async function loadForumList() {
  loading.value = true
  try {
    const data = await api.getForumList({ page: 1, page_size: 20 })
    const rawList = data && Array.isArray(data.list) ? data.list : []
    list.value = rawList.map((it) => ({
      id: it.id,
      user_id: it.user_id,
      nickname: it.nickname,
      avatar: it.avatar,
      title: it.title,
      content: it.content,
      view_count: it.view_count,
      reply_count: it.reply_count,
      created_at: it.created_at,
      updated_at: it.updated_at,
    }))
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function submitTopic() {
  if (posting.value) return
  const title = (postTitle.value || '').trim()
  const content = (postContent.value || '').trim()
  if (!title) {
    uni.showToast({ title: '请输入帖子标题', icon: 'none' })
    return
  }
  if (!content) {
    uni.showToast({ title: '请输入帖子内容', icon: 'none' })
    return
  }
  posting.value = true
  try {
    await api.createForumTopic({ title, content })
    uni.showToast({ title: '发布成功', icon: 'success' })
    postTitle.value = ''
    postContent.value = ''
    await loadForumList()
  } catch (err) {
    uni.showToast({ title: err?.message || '发布失败', icon: 'none' })
  } finally {
    posting.value = false
  }
}

onLoad((opts) => {
  if (opts && opts.id != null && opts.id !== '') {
    const n = Number(opts.id)
    if (Number.isFinite(n) && n > 0) {
      pendingExpandId.value = n
    }
  }
})

onShow(async () => {
  await loadForumList()
  if (pendingExpandId.value != null) {
    const id = pendingExpandId.value
    pendingExpandId.value = null
    expandedId.value = id
    await loadExpandedDetail(id)
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  padding-bottom: 48rpx;
  box-sizing: border-box;
  padding-left: 40rpx;
  padding-right: 40rpx;
}

.bg-wrap {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(165deg, #f0f7ff 0%, #e0eafd 35%, #d1e1fb 70%, #c4d7f9 100%);
}

.bg-dots {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: radial-gradient(circle at 2px 2px, rgba(160, 190, 240, 0.4) 2px, transparent 0);
  background-size: 48rpx 48rpx;
}

.bg-glow {
  position: absolute;
  top: -12%;
  left: 50%;
  transform: translateX(-50%);
  width: 140%;
  height: 45%;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 70%);
  pointer-events: none;
}

.nav-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.nav-btn {
  position: absolute;
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

.loading-wrap {
  position: relative;
  z-index: 2;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 28rpx;
  color: #a89f98;
}

.list {
  position: relative;
  z-index: 2;
  height: calc(100vh - 200rpx);
  box-sizing: border-box;
  // padding: 0 40rpx;
}

.post-card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 24rpx;
  padding: 22rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid rgba(200, 160, 140, 0.16);
  box-shadow: 0 6rpx 22rpx rgba(180, 120, 100, 0.08);
}

.post-title {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #3d3530;
  margin-bottom: 12rpx;
  text-align: center;
}

.post-input {
  width: 100%;
  height: 78rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  border: 2rpx solid rgba(200, 160, 140, 0.2);
  background: rgba(255, 255, 255, 0.95);
  font-size: 27rpx;
  color: #3d3530;
  padding: 0 20rpx;
  margin-bottom: 12rpx;
}

.post-textarea {
  width: 100%;
  min-height: 180rpx;
  box-sizing: border-box;
  border-radius: 16rpx;
  border: 2rpx solid rgba(200, 160, 140, 0.2);
  background: rgba(255, 255, 255, 0.95);
  font-size: 27rpx;
  color: #3d3530;
  padding: 16rpx 20rpx;
}

.post-actions {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.post-counter {
  font-size: 24rpx;
  color: #a89f98;
}

.post-submit {
  min-width: 210rpx;
  padding: 16rpx 18rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #4f8cff 0%, #6aa6ff 100%);
  border: 2rpx solid rgba(79, 140, 255, 0.35);
  box-shadow: 0 10rpx 24rpx rgba(79, 140, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-submit.disabled {
  opacity: 0.55;
  background: linear-gradient(135deg, #a8bcd8 0%, #c0d0e6 100%);
  border-color: rgba(120, 145, 176, 0.3);
  box-shadow: none;
}

.post-submit-text {
  font-size: 27rpx;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.16);
}

.empty-wrap {
  padding: 60rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  font-size: 28rpx;
  color: #a89f98;
}

.item-wrap {
  margin-bottom: 18rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.item-wrap--open {
  box-shadow: 0 8rpx 28rpx rgba(120, 140, 200, 0.12);
}

.item {
  background: rgba(255, 255, 255, 0.92);
  padding: 26rpx 22rpx;
  border: 2rpx solid rgba(200, 160, 140, 0.15);
  display: flex;
  gap: 18rpx;
}

.item-wrap--open .item {
  border-bottom: none;
  border-radius: 24rpx 24rpx 0 0;
}

.avatar-img,
.avatar-fallback {
  width: 78rpx;
  height: 78rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(200, 160, 140, 0.2);
  background: rgba(240, 230, 220, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-fallback {
  font-size: 38rpx;
}

.item-body {
  flex: 1;
  min-width: 0;
}

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.item-title {
  flex: 1;
  font-size: 30rpx;
  font-weight: 800;
  color: #3d3530;
  word-break: break-all;
}

.item-chevron {
  font-size: 22rpx;
  color: #a89f98;
  flex-shrink: 0;
  padding-top: 4rpx;
}

.item-content {
  font-size: 26rpx;
  color: #6b5b52;
  opacity: 0.92;
  word-break: break-all;
}

.item-meta {
  margin-top: 14rpx;
  display: flex;
  gap: 18rpx;
  flex-wrap: wrap;
}

.meta-text {
  font-size: 24rpx;
  color: #a89f98;
}

.meta-text--time {
  opacity: 0.9;
}

/* 阶梯展开区 */
.thread-ladder {
  background: rgba(248, 250, 255, 0.96);
  border: 2rpx solid rgba(200, 160, 140, 0.15);
  border-top: none;
  border-radius: 0 0 24rpx 24rpx;
  padding: 20rpx 22rpx 24rpx;
  margin-top: -2rpx;
}

.expand-loading {
  padding: 32rpx 0;
  display: flex;
  justify-content: center;
}

.expand-loading-text {
  font-size: 26rpx;
  color: #a89f98;
}

.ladder-topic {
  padding-bottom: 16rpx;
  border-bottom: 1rpx dashed rgba(200, 160, 140, 0.25);
  margin-bottom: 16rpx;
}

.ladder-topic-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #3d3530;
  margin-bottom: 10rpx;
  word-break: break-all;
}

.ladder-topic-content {
  font-size: 27rpx;
  color: #5c534d;
  line-height: 1.55;
  word-break: break-all;
}

.ladder-topic-meta {
  margin-top: 12rpx;
  display: flex;
  gap: 18rpx;
  flex-wrap: wrap;
}

.ladder-section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: #3d3530;
  margin-bottom: 12rpx;
}

.ladder-replies {
  margin-bottom: 8rpx;
}

.ladder-empty {
  padding: 20rpx 0 8rpx;
}

.ladder-empty-text {
  font-size: 26rpx;
  color: #a89f98;
}

.ladder-reply {
  margin-left: 8rpx;
  padding: 16rpx 16rpx 16rpx 20rpx;
  margin-bottom: 12rpx;
  border-left: 4rpx solid rgba(140, 160, 220, 0.45);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 0 16rpx 16rpx 0;
}

.ladder-reply-nick {
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  color: #3d3530;
  margin-bottom: 6rpx;
}

.ladder-reply-body {
  display: block;
  font-size: 26rpx;
  color: #6b5b52;
  word-break: break-all;
  line-height: 1.45;
}

.ladder-reply-time {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #a89f98;
}

.ladder-reply-form {
  margin-top: 8rpx;
  padding-top: 16rpx;
  border-top: 1rpx dashed rgba(200, 160, 140, 0.25);
}

.ladder-textarea {
  width: 100%;
  min-height: 160rpx;
  box-sizing: border-box;
  padding: 18rpx 20rpx;
  border-radius: 16rpx;
  border: 2rpx solid rgba(200, 160, 140, 0.22);
  background: rgba(255, 255, 255, 0.95);
  font-size: 26rpx;
  color: #3d3530;
}

.ladder-form-actions {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.ladder-counter {
  font-size: 24rpx;
  color: #a89f98;
}

.ladder-submit {
  min-width: 200rpx;
  padding: 14rpx 18rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #22b573 0%, #37c98a 100%);
  border: 2rpx solid rgba(34, 181, 115, 0.35);
  box-shadow: 0 10rpx 24rpx rgba(34, 181, 115, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ladder-submit.disabled {
  opacity: 0.55;
  background: linear-gradient(135deg, #a8cfc0 0%, #bfdccf 100%);
  border-color: rgba(116, 154, 138, 0.3);
  box-shadow: none;
}

.ladder-submit-text {
  font-size: 26rpx;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.16);
}
</style>
