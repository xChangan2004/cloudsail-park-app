<script setup lang="ts">
import {type AppCouponVO, type CouponStatus, getMyCoupons} from "@/api/coupon";
import {computed, ref} from "vue";
import {onShow} from "@dcloudio/uni-app";
import dayjs from "dayjs";

const TABS: { key: string; label: string; status: CouponStatus }[] = [
  {key: 'unused', label: '未使用', status: 0},
  {key: 'locked', label: '锁定中', status: 1},
  {key: 'used', label: '已使用', status: 2},
  {key: 'expired', label: '已过期', status: 3},
]

const STATUS_MAP: Record<CouponStatus, { label: string; class: string }> = {
  0: {label: '可用', class: 'unused'},
  1: {label: '锁定中', class: 'locked'},
  2: {label: '已使用', class: 'used'},
  3: {label: '已过期', class: 'expired'},
}

const EMPTY_TEXT: Record<CouponStatus, string> = {
  0: '暂无可用优惠券',
  1: '暂无锁定中的券',
  2: '暂无已使用的券',
  3: '暂无过期的券',
}

const activeTab = ref('unused')
const coupons = ref<AppCouponVO[]>([])
const loading = ref(true)

/** 一次拉全量后本地分组 */
const grouped = computed(() => {
  const map: Record<CouponStatus, AppCouponVO[]> = {0: [], 1: [], 2: [], 3: []}
  coupons.value.forEach(c => map[c.status]?.push(c))
  return map
})

const activeStatus = computed<CouponStatus>(
  () => TABS.find(t => t.key === activeTab.value)?.status ?? 0
)

const list = computed(() => grouped.value[activeStatus.value])

/** 有数量的页签才带角标，避免出现「已使用 0」 */
const segOptions = computed(() => {
  return TABS.map(t => {
    const n = grouped.value[t.status].length
    return {value: t.key, label: n > 0 ? `${t.label} ${n}` : t.label}
  })
})

const onTabChange = (e: { value: string }) => {
  activeTab.value = e.value
}

/** 获取优惠券 */
const fetchCoupons = async () => {
  try {
    const res = await getMyCoupons()
    coupons.value = res.data ?? []
  } finally {
    loading.value = false
  }
}

onShow(() => {
  fetchCoupons()
})

/** 格式化时间 */
const fmtDate = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD')
}

const tipText = (c: AppCouponVO) => {
  if (c.status === 1) return '超时未付会自动返还'
  if (c.status === 2) return '已抵扣订单费用，退款不返还'
  if (c.status === 3) return `已于 ${fmtDate(c.expireTime)} 过期`
  return ''
}

const goOrders = () => {
  uni.switchTab({url: '/pages/order/index'})
}
</script>

<template>
  <view class="coupon">
    <t-navbar title="我的券包" left-arrow placeholder/>

    <view class="coupon__body">
      <t-segmented
        t-class="coupon__seg"
        block
        :options="segOptions"
        :value="activeTab"
        @change="onTabChange"
      />

      <view v-if="list.length" class="coupon__list">
        <view
          v-for="c in list"
          :key="c?.id"
          class="cc"
          :class="{ 'is-expired': c?.status === 3 }"
        >
          <!-- 金额区域 -->
          <view class="cc__amt" :class="{ 'is-exp': c?.status === 3 }">
            <text class="cc__amt-val">¥{{ c?.amount }}</text>
            <text class="cc__amt-sub">{{ c?.threshold > 0 ? `满 ${c?.threshold} 可用` : '无门槛' }}</text>
          </view>
          <!-- 券信息 -->
          <view class="cc__info">
            <view class="cc__row">
              <text class="cc__name">{{ c.name }}</text>
              <text class="cc__chip" :class="'cc__chip--' + STATUS_MAP[c.status].class">
                {{ STATUS_MAP[c.status].label }}
              </text>
            </view>
            <text class="cc__time" v-if="c.status !== 3">有效期至 {{ fmtDate(c?.expireTime) }}</text>
            <view class="cc__foot" v-if="c.status !== 0">
              <text class="cc__tip">{{ tipText(c) }}</text>
              <text class="cc__action" v-if="c.status === 1" @tap.stop="goOrders">去查看</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="loading" class="coupon__empty">
        <text class="coupon__empty-text">加载中…</text>
      </view>

      <view v-else class="coupon__empty">
        <t-icon name="coupon" size="64rpx" color="#c9d5e2"/>
        <text class="coupon__empty-text">{{ EMPTY_TEXT[activeStatus] }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.coupon {
  min-height: 100vh;
  background: #f5f6f8;
}

.coupon__body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 25rpx 30rpx 40rpx;
}

:deep(.coupon__seg) {
  width: auto !important;
  padding: 8rpx !important;
  /* 容器：灰 → 白 */
  --td-segmented-bg-color: #ffffff;
  /* 滑块：白 → 浅蓝（注意没有 -color 后缀） */
  --td-segmented-item-active-bg: #ecf5ff;
  /* 选中字：品牌蓝 → 设计稿蓝 */
  --td-segmented-item-active-color: #2b7cd3;
  /* 未选中字：近黑 → 次级灰 */
  --td-segmented-item-color: #606266;
}

.coupon__list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.cc {
  display: flex;
  background: #fff;
  border-radius: 25rpx;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.cc__amt {
  flex: 0 0 184rpx;
  width: 184rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #409eff, #66b1ff);
  color: #fff;
}

/* 过期 */
.cc__amt.is-exp {
  background: linear-gradient(160deg, #b8bec8, #cfd4dc);
}

.cc__amt-val {
  font-size: 47rpx;
  font-weight: 600;
  line-height: 1;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.cc__amt-sub {
  font-size: 24rpx;
  opacity: 0.9;
  margin-top: 6rpx;
}

.cc__info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx 25rpx;
}

.cc__row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.cc__chip {
  flex: 0 0 auto;
  font-size: 22rpx;
  line-height: 36rpx;
  padding: 0 12rpx;
  border-radius: 8rpx;
  background: #ecf5ff;
  color: #2b7cd3;
}

.cc__chip--locked {
  background: #fdf6ec;
  color: #a86a15;
}

.cc__chip--used {
  background: #f0f6e8;
  color: #57962f;
}

.cc__chip--expired {
  background: #f5f7fa;
  color: #909399;
}

.cc__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 29rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc__time {
  font-size: 24rpx;
  color: #909399;
}

.cc__foot {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 2rpx;
}

.cc__tip {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 23rpx;
  color: #a8abb2;
  line-height: 1.5;
}

.cc__action {
  flex: 0 0 auto;
  font-size: 25rpx;
  color: #2b7cd3;
}

.cc.is-expired .cc__name {
  color: #909399;
}

.coupon__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 140rpx 0;
}

.coupon__empty-text {
  font-size: 27rpx;
  color: #a8abb2;
}
</style>