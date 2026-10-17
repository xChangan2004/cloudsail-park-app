<script setup lang="ts">
import {computed, ref} from 'vue'
import {onLoad, onShow, onUnload} from '@dcloudio/uni-app'
import {type AppRecordDetailVO, getMyRecordDetail} from "@/api/record";
import {formatPlate, formatDuration, formatDate, formatClock, parseTime} from '@/utils/format'

const recordId = ref('')
const loading = ref(true)
const detail = ref<AppRecordDetailVO>()

/** 进行中的时长 */
const liveSeconds = ref(0)
let tick: ReturnType<typeof setInterval> | null = null

const stopTick = () => {
  if (tick) {
    clearInterval(tick)
    tick = null
  }
}

/** 出入场状态 */
const isEntered = computed(() => detail.value?.status === 1)

/** 获取记录详情 */
const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getMyRecordDetail(recordId.value)
    const data = res.data
    detail.value = data
    liveSeconds.value = Number(data?.seconds ?? 0)
    stopTick()
    // 只有进行中才走秒表
    if (data?.status === 1) {
      tick = setInterval(() => {
        liveSeconds.value += 1
      }, 1000)
    }
  } catch {
    // 不做处理
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  recordId.value = query?.recordId ?? ''
})

onShow(() => {
  if (!recordId.value) {
    loading.value = false
    return
  }
  fetchDetail()
})

onUnload(stopTick)

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const nodeSub = (v?: string | null, action = '') => {
  const d = parseTime(v)
  if (!d) return ''
  return `${d.format('YYYY-MM-DD')} ${WEEK[d.day()]}${action ? ` · ${action}` : ''}`
}

const durationText = computed(() => {
  const sec = isEntered.value ? liveSeconds.value : Number(detail.value?.seconds ?? 0)
  return formatDuration(sec)
})

/** 预估算不出来 ≠ 0 元 */
const feeUnknown = computed(() => {
  const fee = detail.value?.estimatedFee
  return fee === null || fee === undefined
})

const feeText = computed(() =>
  feeUnknown.value ? '暂无法预估' : `¥${Number(detail.value?.estimatedFee).toFixed(2)}`,
)

/** 导航 */
const goNavigate = () => {
  const d = detail?.value
  if (!d?.lotLng || !d?.lotLat) {
    uni.showToast({title: '该车场暂无坐标', icon: 'none'})
    return
  }
  uni.openLocation({
    longitude: Number(d.lotLng),
    latitude: Number(d.lotLat),
    name: d.lotName,
    address: d.lotAddress,
    fail: () => uni.showToast({title: '打开地图失败', icon: 'none'}),
  })
}
</script>

<template>
  <view class="record">
    <t-navbar title="停车记录" left-arrow placeholder/>

    <view v-if="loading" class="record__state">加载中…</view>

    <view v-else-if="!detail" class="record__state">记录不存在或已失效</view>

    <view v-else class="record__body">
      <view class="banner">
        <view class="banner__row">
          <view class="banner__plate">{{ formatPlate(detail?.plateNumber) }}</view>
          <view class="banner__state">
            <text class="banner__chip">{{ isEntered ? '停车中' : '已离场' }}</text>
            <text v-if="isEntered" class="banner__live">实时</text>
          </view>
        </view>
        <view class="banner__row">
          <text class="banner__label">已停</text>
          <view class="banner__duration">{{ durationText }}</view>
        </view>
      </view>

      <view class="card">
        <text class="card__t">出入场记录</text>
        <view class="tl">
          <view class="tl__item">
            <view class="tl__rail">
              <view class="tl__dot tl__dot--entry"></view>
              <view class="tl__line"></view>
            </view>
            <view class="tl__main">
              <view class="tl__time">{{ formatClock(detail?.entryTime) }}</view>
              <view class="tl__sub">{{ nodeSub(detail?.entryTime, '入场') }}
              </view>
            </view>
          </view>
          <view class="tl__item">
            <view class="tl__rail">
              <view class="tl__dot" :class="isEntered ? 'tl__dot--pending' : 'tl__dot--exit'"></view>
            </view>
            <view class="tl__main">
              <template v-if="isEntered">
                <view class="tl__time tl__time--pending">尚未出场</view>
                <view class="tl__sub">出场时自动识别并结算</view>
              </template>
              <template v-else>
                <view class="tl__time">{{ formatClock(detail?.exitTime) }}</view>
                <view class="tl__sub">{{ nodeSub(detail?.exitTime, '出场') }}</view>
              </template>
            </view>
          </view>
        </view>
      </view>
      <view class="card">
        <view class="card__t">出入场抓拍</view>
        <view class="shots">
          <view class="shot">
            <image
              v-if="detail?.entryImage"
              class="shot__img"
              :src="detail.entryImage"
              mode="aspectFill"
            />
            <template v-else>
              <t-icon name="vehicle" size="13" color="#c0c4cc"/>
              <text class="shot__label">入场抓拍</text>
            </template>
          </view>
          <view class="shot">
            <image
              v-if="detail?.exitImage"
              class="shot__img"
              :src="detail.exitImage"
              mode="aspectFill"
            />
            <template v-else>
              <t-icon :name="isEntered ? 'time' : 'vehicle'" size="13" color="#c0c4cc"/>
              <text class="shot__label">{{ isEntered ? '出场后生成' : '出场抓拍' }}</text>
            </template>
          </view>
        </view>
      </view>

      <view v-if="isEntered" class="card">
        <view class="card__head">
          <text class="card__t">费用预估</text>
          <text class="chip chip--warn">未结算</text>
        </view>
        <view class="fee">
          <text class="fee__k">当前预估</text>
          <text class="fee__v" :class="{'is-unknown': feeUnknown}">{{ feeText }}</text>
        </view>
        <view class="dash"/>
        <text class="tip">费用随时长继续增加，
          <text class="tip__strong">最终以出场账单为准</text>
          。
        </text>
      </view>

      <view class="card lot">
        <view class="lot__icon">
          <t-icon name="vehicle" size="16" color="#9fb3c8"/>
        </view>
        <view class="lot__main">
          <text class="lot__name">{{ detail?.lotName }}</text>
          <text class="lot__sub">{{ detail?.lotAddress }}</text>
        </view>
        <text class="lot__nav" @tap="goNavigate">导航</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.record {
  min-height: 100vh;
  background: #f5f6f8;
}

.record__state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  font-size: 26rpx;
  color: #9aa0a6;
}

.record__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.banner {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 30rpx 32rpx;
  border-radius: 24rpx;
  background: linear-gradient(120deg, #409eff, #66b1ff);
  color: #fff;
}

.banner__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.banner__plate {
  flex: 0 1 auto;
  min-width: 0;
  padding: 0 14rpx;
  line-height: 44rpx;
  border-radius: 8rpx;
  background: #2b7cd3;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  letter-spacing: 0.8rpx;
  white-space: nowrap;
}

.banner__state {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.banner__chip {
  font-size: 22rpx;
  line-height: 36rpx;
  padding: 0 14rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.26);
  color: #fff;
}

.banner__live {
  font-size: 20rpx;
  line-height: 1;
  color: rgba(255, 255, 255, 0.85);
}

.banner__label {
  flex: 0 0 auto;
  font-size: 24rpx;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.9);
}

.banner__duration {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 60rpx;
  font-weight: 600;
  line-height: 1.1;
  color: #fff;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.card {
  padding: 28rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.card__t {
  display: block;
  font-size: 29rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.tl {
  display: flex;
  flex-direction: column;
  margin-top: 18rpx;
  gap: 12rpx;
}

.tl__item {
  display: flex;
  gap: 18rpx;
}

.tl__rail {
  flex: 0 0 auto;
  width: 22rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tl__dot {
  flex: 0 0 auto;
  width: 18rpx;
  height: 18rpx;
  margin-top: 7rpx;
  border-radius: 50%;
}

.tl__dot--entry {
  background: #2b7cd3;
  box-shadow: 0 0 0 6rpx #ecf5ff;
}

.tl__dot--exit {
  background: #67c23a;
  box-shadow: 0 0 0 6rpx #f0f9eb;
}

.tl__dot--pending {
  width: 22rpx;
  height: 22rpx;
  box-sizing: border-box;
  border: 4rpx dashed #c0c4cc;
  background: #fff;
}

.tl__line {
  flex: 1 1 auto;
  width: 4rpx;
  min-height: 32rpx;
  margin-top: 8rpx;
  background: #e3e8ee;
}

.tl__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6rpx;
}

.tl__time {
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.2;
  color: #303133;
  font-family: Consolas, monospace;
}

.tl__time--pending {
  font-family: inherit;
  color: #909399;
}

.tl__sub {
  font-size: 24rpx;
  line-height: 1.5;
  color: #9aa0a6;
  word-break: break-all;
}

.shots {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}

.shot {
  flex: 1 1 0;
  min-width: 0;
  height: 154rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  box-sizing: border-box;
  border: 2rpx dashed #dcdfe6;
  border-radius: 12rpx;
  background: #fafbfc;
}

.shot__img {
  display: block;
  width: 100%;
  height: 100%;
}

.shot__label {
  font-size: 20rpx;
  line-height: 1;
  color: #c0c4cc;
}

.fee {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.fee__k {
  flex: 0 0 auto;
  font-size: 26rpx;
  color: #9aa0a6;
}

.fee__v {
  flex: 0 0 auto;
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.2;
  color: #9a5f10;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.fee__v.is-unknown {
  font-size: 26rpx;
  font-family: inherit;
  color: #9aa0a6;
}

.dash {
  margin: 20rpx -28rpx;
  border-top: 1px dashed #e6e8eb;
}

.tip {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #9aa0a6;
}

.tip__strong {
  font-weight: 700;
  color: #606266;
}

.chip {
  flex: 0 0 auto;
  font-size: 22rpx;
  line-height: 34rpx;
  padding: 0 12rpx;
  border-radius: 8rpx;
}

.chip--warn {
  background: #fdf6ec;
  color: #a86a15;
}

.lot {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.lot__icon {
  flex: 0 0 auto;
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #dde7f2, #eef2f7);
}

.lot__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6rpx;
}

.lot__name {
  max-width: 100%;
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lot__sub {
  font-size: 26rpx;
  line-height: 1.45;
  color: #909399;
}

.lot__nav {
  flex: 0 0 auto;
  align-self: center;
  padding: 0 24rpx;
  line-height: 48rpx;
  box-sizing: border-box;
  border: 2rpx solid #409eff;
  border-radius: 26rpx;
  background: #fff;
  font-size: 22rpx;
  color: #409eff;
}
</style>