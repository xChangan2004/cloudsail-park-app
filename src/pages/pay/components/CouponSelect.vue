<script setup lang="ts">
import type {AppCouponVO} from "@/api/coupon";
import {computed, ref} from "vue";

const props = defineProps<{
  /** 当前选中的券 id */
  couponId?: string
  /** 可用券列表 */
  coupons?: AppCouponVO[]
  /** 订单应收原价 */
  amount?: number
}>()

const emit = defineEmits<{
  'select': [couponId: string]
}>()

const visible = ref(false)

const list = computed(() => props.coupons ?? [])
const selected = computed(() => list.value.find(c => c.id === props.couponId))

/** 右侧文案：已选 → 重新选择；有券未选 → 请选择；无券 → 暂无可用 */
const head = computed(() => {
  if (selected.value) return {text: '重新选择', cls: ''}
  if (!list.value.length) return {text: '暂无可用', cls: ''}
  return {text: '请选择', cls: 'is-pri'}
})

const open = () => {
  if (!list.value.length) return
  visible.value = true
}

const pick = (id: string) => {
  visible.value = false
  emit('select', id)
}
</script>

<template>
  <view class="coupon-select">
    <view class="coupon-head" @tap="open">
      <text class="coupon-head__t">优惠券</text>
      <view class="coupon-head__right">
        <text class="coupon-head__txt" :class="head.cls">{{ head.text }}</text>
        <text v-if="list.length" class="coupon-head__chev">›</text>
      </view>
    </view>

    <!-- 未选券时整块不渲染 -->
    <view v-if="selected" class="coupon">
      <view class="coupon__amt">
        <text class="coupon__amt-num">¥{{ selected.amount }}</text>
        <text class="coupon__amt-thr">
          {{ selected.threshold > 0 ? `满 ${selected.threshold} 可用` : '无门槛' }}
        </text>
      </view>
      <view class="coupon__info">
        <view class="coupon__line">
          <text class="coupon__name">{{ selected.name }}</text>
          <text class="coupon__ok">✓</text>
        </view>
        <text class="coupon__exp">有效期至 {{ String(selected.expireTime).slice(0, 10) }}</text>
      </view>
    </view>

    <!-- 选券弹层 -->
    <t-popup v-model:visible="visible" :close-on-overlay-click="false" placement="bottom">
      <view class="sheet">
        <view class="sheet__head">
          <text class="sheet__title">选择优惠券</text>
          <text class="sheet__close" @tap="visible = false">✕</text>
        </view>
        <scroll-view
          scroll-y
          class="sheet__body"
        >
          <view
            v-for="c in list"
            :key="c.id"
            class="coupon coupon--pick"
            :class="{'is-on': c.id === couponId}"
            @tap="pick(c.id)"
          >
            <view class="coupon__amt">
              <text class="coupon__amt-num">¥{{ c.amount }}</text>
              <text class="coupon__amt-thr">
                {{ c.threshold > 0 ? `满 ${c.threshold} 可用` : '无门槛' }}
              </text>
            </view>
            <view class="coupon__info">
              <view class="coupon__line">
                <text class="coupon__name">{{ c.name }}</text>
                <text v-if="c.id === couponId" class="coupon__ok">✓</text>
              </view>
              <text class="coupon__exp">有效期至 {{ String(c.expireTime).slice(0, 10) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </t-popup>
  </view>
</template>

<style scoped lang="scss">
.coupon-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.coupon-head__t {
  flex: 0 0 auto;
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.coupon-head__right {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.coupon-head__txt {
  font-size: 27rpx;
  color: #909399;
}

.coupon-head__txt.is-pri {
  color: #409eff;
}

.coupon-head__chev {
  font-size: 32rpx;
  line-height: 1;
  color: #a8abb2;
}

.coupon {
  display: flex;
  margin-top: 16rpx;
  border: 1px solid #d9ecff;
  border-radius: 25rpx;
  overflow: hidden;
  background: #fff;
}

.coupon.is-on {
  border-color: #409eff;
}

/* 未选中时面额块走灰渐变 */
.coupon--pick .coupon__amt {
  background: linear-gradient(160deg, #b8bec8, #cfd4dc);
}

.coupon--pick.is-on .coupon__amt {
  background: linear-gradient(160deg, #409eff, #66b1ff);
}

.coupon__amt {
  flex: 0 0 184rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #409eff, #66b1ff);
  color: #fff;
}

.coupon__amt-num {
  font-size: 47rpx;
  font-weight: 600;
  line-height: 1;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.coupon__amt-thr {
  margin-top: 5rpx;
  font-size: 24rpx;
  line-height: 1.2;
  opacity: 0.9;
}

.coupon__info {
  flex: 1;
  min-width: 0;
  padding: 22rpx 25rpx;
}

.coupon__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.coupon__name {
  flex: 1;
  min-width: 0;
  font-size: 29rpx;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.coupon__ok {
  flex: 0 0 auto;
  font-size: 32rpx;
  line-height: 1;
  color: #67c23a;
}

.coupon__exp {
  display: block;
  margin-top: 6rpx;
  font-size: 26rpx;
  line-height: 1.45;
  color: #909399;
}

.sheet {
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 30rpx 22rpx;
}

.sheet__title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.sheet__close {
  position: absolute;
  right: 30rpx;
  font-size: 30rpx;
  line-height: 1;
  color: #909399;
}

.sheet__body {
  max-height: 55vh;
  padding: 0 30rpx 30rpx;
  box-sizing: border-box;
}
</style>