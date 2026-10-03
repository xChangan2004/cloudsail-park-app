<script setup lang="ts">
// 获取屏幕边界到安全区域的距离
import {ref} from "vue";
import {onShow} from "@dcloudio/uni-app";
import dayjs from "dayjs";

const {safeAreaInsets} = uni.getSystemInfoSync()

const lng = ref<number>()
const lat = ref<number>()
const locating = ref(false)
const locationText = ref('点击定位')

/** 定位到当前位置 */
const locate = () => {
  if (locating.value) return Promise.resolve()
  locating.value = true
  locationText.value = '定位中...'
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        lng.value = res.longitude
        lat.value = res.latitude
        locationText.value = '当前位置'
        resolve(res)
      },
      fail: (err) => {
        // 常见原因：用户拒绝授权 / 小程序未申请「用户地理位置」接口权限
        locationText.value = '定位失败，点击重试'
        reject(err)
      },
      complete: () => {
        locating.value = false
      }
    })
  })
}

const parkingList = ref([
  {
    recordId: '1',
    lotName: '云帆科技园 A 区',
    plateNumber: '粤F·12345',
    entryTime: '2026-10-03 07:10:00',
    parkedMinutes: 82,
    estimatedFee: 52,
  },
  {
    recordId: '2',
    lotName: '深南汇购物中心地下车库',
    plateNumber: '粤F·66666',
    entryTime: '2026-10-03 04:50:00',
    parkedMinutes: 225,
    estimatedFee: 88,
  },
])

const currentCar = ref(0)

/** swiper 的 change 事件，detail.current 是当前下标 */
const onCarChange = (e: {detail: {current: number}}) => {
  currentCar.value = e.detail.current
}

/** 后端时间统一 yyyy-MM-dd HH:mm:ss；iOS / 小程序对带空格的格式解析不稳，换成 / */
const parseTime = (value: string) => dayjs(String(value).replace(/-/g, '/'))

const parkedText = (item: {entryTime?: string; parkedMinutes?: number}) => {
  const minutes = Number(item.parkedMinutes) || 0
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const duration = h > 0 ? `${h} 小时${m ? ` ${m} 分` : ''}` : `${m} 分钟`
  const entry = item.entryTime ? parseTime(item.entryTime).format('HH:mm') : ''
  return entry ? `入场 ${entry} · 已停 ${duration}` : `已停 ${duration}`
}

const feeText = (item: {estimatedFee?: number | null}) => {
  const fee = item.estimatedFee
  return fee === null || fee === undefined ? '--' : `¥${Number(fee).toFixed(2)}`
}

const formatDistance = (distance?: number) => {
  if (!distance) return ''
  return distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`
}

/** 「120m · 科苑路 8 号」 */
const lotSub = (lot: {distance?: number; address?: string}) =>
  [formatDistance(lot.distance), lot.address].filter(Boolean).join(' · ')

const splitFacilities = (facilities?: string) =>
  (facilities ?? '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)

const lotList = ref([
  {
    id: '1',
    name: '云帆科技园 A区 停车场',
    address: '科苑路 8 号',
    distance: 120,
    freeSpaces: 42,
    totalSpaces: 320,
    hasFree: true,
    facilities: '充电桩,自助洗车,电梯直达,卫生间',
  },
  {
    id: '2',
    name: '深南汇购物中心地下车库',
    address: '深南大道 1002 号',
    distance: 860,
    freeSpaces: 0,
    totalSpaces: 180,
    hasFree: false,
    facilities: '充电桩,卫生间,电梯直达',
  },
])

let inited = false
onShow(async () => {
  if (!inited) {
    inited = true
    await locate()
  }
})
</script>

<template>
  <view class="home">
    <view class="home__hero" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
      <view class="home__loc" @tap="locate">
        <t-icon name="location" size="16" color="#fff"/>
        <text class="home__loc-text">{{ locationText }}</text>
        <t-icon name="chevron-down" size="15" color="#fff"/>
      </view>

      <view class="home__search">
        <t-icon name="ai-search" size="15" color="#909399"/>
        <text class="home__search-ph">搜索停车场</text>
      </view>
    </view>

    <view class="home__body">
      <view class="home__cars">
        <swiper
          class="home__swiper"
          :current="currentCar"
          next-margin="100rpx"
          :circular="parkingList.length > 1"
          :duration="260"
          @change="onCarChange"
        >
          <swiper-item
            v-for="(item, index) in parkingList"
            :key="item.recordId || index"
            class="home__swiper-item"
          >
            <view class="home__car">
              <view class="home__car-top">
                <view class="home__car-top-left">
                  <text class="home__chip-w">停车中</text>
                  <text class="home__car-lot">{{ item.lotName }}</text>
                </view>
                <text v-if="parkingList.length > 1" class="home__car-count">
                  {{ index + 1 }} / {{ parkingList.length }}
                </text>
              </view>

              <view class="home__car-mid">
                <text class="home__plate">{{ item.plateNumber }}</text>
                <view class="home__car-fee">
                  <text class="home__car-fee-num">{{ feeText(item) }}</text>
                  <text class="home__car-fee-tip">预估</text>
                </view>
              </view>

              <view class="home__car-bot">
                <text class="home__car-time">{{ parkedText(item) }}</text>
                <text class="home__car-more">查看详情</text>
              </view>
            </view>
          </swiper-item>
        </swiper>

        <view v-if="parkingList.length > 1" class="home__dots">
          <view
            v-for="(item, index) in parkingList"
            :key="index"
            class="home__dot"
            :class="{'is-on': index === currentCar}"
          />
          <text class="home__dots-tip">共 {{ parkingList.length }} 辆车在场 · 左右滑动切换</text>
        </view>
      </view>

      <view class="home__card home__entries-card">
        <view class="home__entries">
          <view class="home__entry">
            <view class="home__entry-icon">
              <t-icon name="scan"/>
            </view>
            <view class="home__entry-label">扫码入场</view>
          </view>
          <view class="home__entry">
            <view class="home__entry-icon">
              <t-icon name="location"/>
            </view>
            <view class="home__entry-label">找车位</view>
          </view>
          <view class="home__entry">
            <view class="home__entry-icon">
              <t-icon name="scan"/>
            </view>
            <view class="home__entry-label">我的车牌</view>
          </view>
          <view class="home__entry">
            <view class="home__entry-icon">
              <t-icon name="coupon"/>
            </view>
            <view class="home__entry-label">领劵中心</view>
          </view>
        </view>
      </view>

      <view class="home__section">
        <view class="home__section-title">附近停车场</view>
        <view class="home__section-more">
          <text>按距离</text>
          <t-icon name="chevron-right"/>
        </view>
      </view>

      <view class="home__list">
        <view v-for="lot in lotList" :key="lot.id" class="home__card home__lot">
          <view class="home__lot-info">
            <text class="home__lot-name">{{ lot.name }}</text>
            <text class="home__lot-sub">{{ lotSub(lot) }}</text>
            <view v-if="splitFacilities(lot.facilities).length" class="home__lot-facilities">
              <text
                v-for="facility in splitFacilities(lot.facilities)"
                :key="facility"
                class="home__lot-chip"
              >{{ facility }}</text>
            </view>
          </view>
          <view class="home__lot-spaces">
            <text class="home__lot-num" :class="{ 'is-full': !lot.hasFree }">
              {{ lot.hasFree ? lot.freeSpaces : 0 }}
            </text>
            <text class="home__lot-num-tip">
              {{ lot.hasFree ? `空闲/${lot.totalSpaces}` : `已满/${lot.totalSpaces}` }}
            </text>
          </view>
        </view>
      </view>

      <view class="home__tip">加载中…</view>
      <view class="home__tip">登录后查看附近停车场</view>
      <view class="home__tip">没有更多了</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: #f5f6f8;
}

.home__hero {
  background: linear-gradient(180deg, #409eff, 0%, #4a9ffd 56%, #5ba8ff 100%);
  border-radius: 0 0 45rpx 45rpx;
  padding-bottom: 30rpx;
}

.home__loc {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding-left: 30rpx;
  margin-top: 18rpx;
  margin-bottom: 27rpx;
  box-sizing: border-box;
}

.home__loc-text {
  min-width: 0;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home__search {
  display: flex;
  align-items: center;
  gap: 17rpx;
  height: 94rpx;
  margin: 0 30rpx;
  padding: 0 30rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(23, 71, 124, 0.15);
}

.home__search-ph {
  font-size: 32rpx;
  color: #a8abb2;
}

.home__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 27rpx 30rpx 30rpx;
}

.home__cars {
  display: flex;
  flex-direction: column;
}

/*
 * swiper 内部是绝对定位的，内容撑不开高度，必须显式给高度。
 * 卡片就三段固定内容，要调高度只改这一个值。
 */
.home__swiper {
  height: 232rpx;
}

/* swiper-item 只负责留白，给相邻两张卡之间留一点视觉缝隙 */
.home__swiper-item {
  box-sizing: border-box;
  padding: 0 10rpx;
}

.home__car {
  height: 100%;
  box-sizing: border-box;
  border-radius: 25rpx;
  padding: 25rpx 30rpx;
  background: linear-gradient(120deg, #409eff, #66b1ff);
  color: #fff;
}

.home__car-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx
}

.home__car-top-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.home__chip-w {
  flex: 0 0 auto;
  font-size: 25rpx;
  line-height: 40rpx;
  padding: 0 15rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.26);
  color: #fff;
}

.home__car-lot {
  font-size: 29rpx;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.home__car-count {
  flex: 0 0 auto;
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.85);
}

.home__car-mid {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 20rpx;
}

.home__plate {
  display: inline-block;
  line-height: 55rpx;
  padding: 0 17rpx;
  background: #2b7cd3;
  color: #fff;
  border-radius: 10rpx;
  font-size: 27rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.home__car-fee {
  text-align: right;
}

.home__car-fee-num {
  display: block;
  font-size: 47rpx;
  font-weight: 600;
  line-height: 1.1;
  color: #fff;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.home__car-fee-tip {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.home__car-bot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 17rpx;
}

.home__car-time {
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.8);
}

.home__car-more {
  flex: 0 0 auto;
  font-size: 25rpx;
  color: #fff;
}

.home__dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 17rpx;
}

.home__dot {
  width: 15rpx;
  height: 7rpx;
  border-radius: 5rpx;
  background: #c9d5e2;
}

.home__dot.is-on {
  width: 35rpx;
  background: #409eff;
}

.home__dots-tip {
  font-size: 25rpx;
  color: #909399;
  margin-left: 12rpx;
}

.home__card {
  background: #ffffff;
  border-radius: 25rpx;
  padding: 25rpx 30rpx;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.home__entries-card {
  padding: 15rpx 10rpx;
}

.home__entries {
  display: flex;
}

.home__entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0;
}

.home__entry-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 27rpx;
  background: #ecf5ff;
  color: #2b7cd3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home__entry-label {
  font-size: 26rpx;
  color: #606266;
}

.home__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 0 2rpx;
}

.home__section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.home__section-more {
  display: flex;
  align-items: center;
  gap: 2rpx;
  font-size: 26rpx;
  color: #909399;
}

.home__list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.home__lot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.home__lot-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5rpx;
}

.home__lot-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.home__lot-sub {
  font-size: 26rpx;
  color: #909399;
  line-height: 1.45;
}

.home__lot-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
  margin-top: 3rpx;
}

.home__lot-chip {
  display: inline-block;
  font-size: 25rpx;
  line-height: 40rpx;
  padding: 0 15rpx;
  border-radius: 10rpx;
  background: #ecf5ff;
  color: #2b7cd3;
}

.home__lot-spaces {
  flex: 0 0 auto;
  text-align: center;
}

.home__lot-num {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1;
  color: #409eff;
  font-family: Consolas, sans-serif;
}

.home__lot-num.is-full {
  color: #909399;
}

.home__lot-num-tip {
  display: block;
  font-size: 24rpx;
  color: #909399;
}

.home__tip {
  padding: 10rpx 0 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #a8abb2;
}
</style>
