<script setup lang="ts">
import {useLocationStore} from "@/stores"
import {computed, ref} from "vue";
import {type AppParkingLotDetailVO, getParkingLotDetail} from "@/api/parking";
import {onLoad, onShow} from "@dcloudio/uni-app";
import {formatDistance, formatPhone} from "@/utils/format";
import {freeMinutesText, money, ruleTypeText} from "@/utils/fee";

const loc = useLocationStore()

const lotId = ref('')
const lot = ref<AppParkingLotDetailVO | null>(null)
const loading = ref(true)

const fetchDetail = async () => {
  if (!lotId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await getParkingLotDetail(lotId.value, {lng: loc.lng, lat: loc.lat})
    lot.value = res.data
  } catch {
    // 不做拦截
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  lotId.value = query?.id ?? ''
  fetchDetail()
})

let inited = false
onShow(() => {
  if (!inited) {
    inited = true
    return
  }
  fetchDetail()
})

const heroImages = computed(() => lot.value?.images ?? [])

const heroIndex = ref(0)

const onHeroChange = (e: { detail: { current: number } }) => {
  heroIndex.value = e.detail.current
}

const contactText = computed(() => (lot.value?.contact ?? '').trim())

const contactPhone = computed(() => contactText.value.replace(/[^\d+]/g, ''))
const canCall = computed(() => contactPhone.value.replace(/\D/g, '').length >= 5)

const onCall = () => {
  if (!canCall.value) return
  uni.makePhoneCall({
    phoneNumber: contactPhone.value,
    fail: () => uni.showToast({title: '拨号失败', icon: 'none'}),
  })
}

/** 预览图片 */
const onPreview = (index: number) => {
  const urls = heroImages.value
  if (!urls.length) return
  uni.previewImage({
    urls: [...urls],
    current: urls[index],
    fail: () => uni.showToast({title: '图片预览失败', icon: 'none'}),
  })
}

const rule = computed(() => lot.value?.feeRule ?? null)
const feeTypeText = computed(() => (rule.value ? ruleTypeText(rule.value.ruleType) : ''))
const freeText = computed(() => freeMinutesText(rule.value))
const capText = computed(() => {
  const cap = Number(rule.value?.dailyCap ?? 0)
  return cap > 0 ? `¥${money(cap)}` : ''
})

const feeVisible = ref(false)

const onOpenFee = () => {
  if (!rule.value) return
  feeVisible.value = true
}

const onBack = () => {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.switchTab({url: '/pages/index/index'})
}

const onNavigate = () => {
  const v = lot.value
  if (!v || v.longitude == null || v.latitude == null) {
    uni.showToast({title: '该车场暂无坐标', icon: 'none'})
    return
  }
  uni.openLocation({
    longitude: Number(v.longitude),
    latitude: Number(v.latitude),
    name: v.name,
    address: v.address,
    fail: () => uni.showToast({title: '打开地图失败', icon: 'none'}),
  })
}
</script>

<template>
  <view class="lot-detail">
    <t-navbar left-arrow placeholder/>
    <view class="hero">
      <swiper
        v-if="heroImages.length"
        class="hero__swiper"
        :current="heroIndex"
        :circular="heroImages.length > 1"
        :autoplay="heroImages.length > 1"
        :interval="4000"
        :duration="300"
        @change="onHeroChange"
      >
        <swiper-item v-for="(src, i) in heroImages" :key="`${i}-${src}`">
          <image class="hero__img" :src="src" mode="aspectFill" @tap="onPreview(i)"/>
        </swiper-item>
      </swiper>

      <!-- 有图压暗一层，浅色实景上车场名才读得出来 -->
      <view v-if="heroImages.length" class="hero__mask"></view>
      <!-- 没图用两个装饰圆兜底 -->
      <template v-else>
        <view class="hero__deco hero__deco--a"></view>
        <view class="hero__deco hero__deco--b"></view>
      </template>

      <view class="hero__title">{{ lot?.name || '车场详情' }}</view>

      <view v-if="heroImages.length > 1" class="hero__dots">
        <view
          v-for="(src, i) in heroImages"
          :key="`dot-${i}`"
          class="hero__dot"
          :class="{'is-on': i === heroIndex}"
        ></view>
      </view>
    </view>

    <view class="body">
      <template v-if="lot">
        <view class="card space">
          <view class="space__main">
            <view class="space__num-row">
              <text class="space__num" :class="{'is-full': !lot?.hasFree}">{{ lot?.freeSpaces ?? '--' }}</text>
              <text class="space__unit">{{ lot?.hasFree ? '个空闲' : '已满' }}</text>
            </view>
            <view class="space__live" :class="{'is-full': !lot?.hasFree}">
              <view class="space__dot"></view>
              <text>{{ lot?.hasFree ? '实时更新' : '暂无空位' }}</text>
            </view>
          </view>
          <view class="space__div"></view>
          <view class="space__side">
            <view class="space__kv">
              <text class="space__k">总车位</text>
              <text class="space__v">{{ lot?.totalSpaces ?? '--' }} 个</text>
            </view>
            <view class="space__kv">
              <text class="space__k">距您</text>
              <text class="space__v">{{ formatDistance(lot?.distance) }}</text>
            </view>
          </view>
        </view>

        <view class="card">

          <view class="card__row">
            <view class="card__row-k">营业时间</view>
            <view class="card__row-v">24 小时</view>
          </view>
          <view v-if="lot?.contact" class="card__row" @tap="onCall">
            <view class="card__row-k">联系方式</view>
            <view class="card__row-v" :class="{'is-link': canCall}" style="display: flex; gap: 10rpx; align-items: center">
              <t-icon name="call" size="16" />
              {{ formatPhone(contactText) }}
            </view>
          </view>
        </view>

        <view class="card">
          <view class="card__t">设施服务</view>
          <view v-if="lot?.facilities?.length" class="fac">
            <text v-for="f in lot.facilities" :key="f.code" class="fac__item">{{ f.name }}</text>
          </view>
          <view v-else class="card__empty">该车场没有额外的服务设施</view>
        </view>

        <view class="card" @tap="onOpenFee">
          <view class="card__head">
            <view class="card__t">收费标准</view>
            <view v-if="rule" class="card__more">
              <text>{{ feeTypeText }}</text>
              <text>·</text>
              <text>查看全部</text>
              <t-icon name="chevron-right" size="16"/>
            </view>
          </view>
          <template v-if="rule">
            <view class="card__row">
              <view class="card__row-k">免费时长</view>
              <view class="card__row-v">{{ freeText }}</view>
            </view>
            <view v-if="capText" class="card__row">
              <view class="card__row-k">24 小时封顶</view>
              <view class="card__row-v">{{ capText }}</view>
            </view>
          </template>
          <text v-else class="card__empty">该车场暂未公布收费标准</text>
        </view>
      </template>

      <view v-else-if="loading" class="state">
        <text>加载中…</text>
      </view>

      <view v-else class="state">
        <text>详情信息加载失败</text>
        <view class="state__btn" hover-class="state__btn--hover" @tap="fetchDetail">重新加载</view>
      </view>
    </view>

    <view v-if="lot" class="bar">
      <view class="bar__btn bar__btn--ghost" @tap="onNavigate">
        <t-icon name="navigation-arrow" size="15" color="#409eff"/>
        <text>导航前往</text>
      </view>
    </view>

    <fee-sheet v-if="lot" v-model:visible="feeVisible" :rule="rule" :lot-name="lot?.name"/>
  </view>
</template>

<style scoped lang="scss">
.lot-detail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
  background: #f5f6f8;
  padding-bottom: calc(132rpx + env(safe-area-inset-bottom));
}

.hero {
  position: relative;
  height: 350rpx;
  overflow: hidden;
  padding-bottom: 40rpx;
  background: linear-gradient(168deg, #3a83e4 0%, #2b74d8 54%, #1d59b8 100%);

  &__swiper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  &__img {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(20, 28, 40, 0.45) 0%, rgba(20, 28, 40, 0.20) 42%, rgba(20, 28, 40, 0.58) 100%);
  }

  &__deco {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  &__deco--a {
    top: -230rpx;
    right: -195rpx;
    width: 775rpx;
    height: 775rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.07) 54%, rgba(255, 255, 255, 0) 72%);
  }

  &__deco--b {
    left: -140rpx;
    bottom: -190rpx;
    width: 472rpx;
    height: 472rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%);
  }

  &__title {
    position: absolute;
    left: 30rpx;
    right: 30rpx;
    bottom: 44rpx;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    font-size: 38rpx;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 1rpx;
    color: #fff;
    word-break: break-all;
    text-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  &__dots {
    position: absolute;
    left: 50%;
    bottom: 14rpx;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8rpx;
    pointer-events: none;
  }

  &__dot {
    width: 8rpx;
    height: 8rpx;
    border-radius: 4rpx;
    background: rgba(255, 255, 255, 0.45);

    &.is-on {
      width: 18rpx;
      background: #fff;
    }
  }
}

.body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx 30rpx;
}

.card {
  padding: 25rpx 30rpx;
  background: #fff;
  border-radius: 25rpx;
  box-shadow: 0 2rpx 6rpx rgba(48, 49, 51, 0.04);

  &__t {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
  }

  &__more {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 26rpx;
    color: #909399;
  }

  &__empty {
    display: block;
    margin-top: 15rpx;
    font-size: 26rpx;
    color: #a8abb2;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20rpx;
    margin-top: 15rpx;
  }

  &__row-k {
    flex: 0 0 auto;
    font-size: 26rpx;
    color: #909399;
  }

  &__row-v {
    flex: 0 1 auto;
    font-size: 29rpx;
    color: #303133;
    text-align: right;

    &.is-link {
      color: #409eff;
    }
  }
}

.space {
  display: flex;
  align-items: stretch;

  &__main {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 17rpx;
  }

  &__num-row {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
  }

  &__num {
    font-size: 80rpx;
    font-weight: 700;
    line-height: 1;
    color: #0a8a4a;
    font-family: 'DIN Alternate', Consolas, sans-serif;
  }

  &__num.is-full {
    color: #909399;
  }

  &__unit {
    font-size: 29rpx;
    color: #909399;
  }

  &__live {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: #0a8a4a;
  }

  &__live.is-full {
    color: #909399;
  }

  &__dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: currentColor;
  }

  &__div {
    flex: 0 0 auto;
    width: 1rpx;
    margin: 2rpx 32rpx;
    background: #ebeef5;
  }

  &__side {
    flex: 0 0 48%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 22rpx;
  }

  &__kv {
    display: flex;
    flex-direction: column;
    gap: 5rpx;
  }

  &__k {
    font-size: 26rpx;
    color: #909399;
  }

  &__v {
    font-size: 34rpx;
    font-weight: 600;
    color: #303133;
  }
}

.fac {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  margin-top: 20rpx;

  &__item {
    font-size: 25rpx;
    line-height: 50rpx;
    padding: 0 20rpx;
    border-radius: 12rpx;
    background: #f5f7fa;
    border: 1rpx solid #ebeef5;
    color: #606266;
  }
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
  padding: 160rpx 0;
  font-size: 26rpx;
  color: #9aa0a6;
}

.state__btn {
  height: 68rpx;
  line-height: 64rpx;
  padding: 0 36rpx;
  box-sizing: border-box;
  border: 2rpx solid #409eff;
  border-radius: 34rpx;
  font-size: 27rpx;
  color: #409eff;
}

.state__btn--hover {
  background: #ecf5ff;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: 22rpx;
  padding: 22rpx 30rpx calc(22rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #ebeef5;

  &__btn {
    flex: 1;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    border-radius: 46rpx;
    font-size: 31rpx;
  }

  &__btn--ghost {
    background: #fff;
    border: 2rpx solid #409eff;
    color: #409eff;
  }
}
</style>