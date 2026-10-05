<script setup lang="ts">
import {ref} from 'vue'
import {onShow} from "@dcloudio/uni-app";
import {type AppCouponTemplateVO, getCouponTemplates, receiveCoupon} from '@/api/coupon'

/** 模板列表 */
const templates = ref<AppCouponTemplateVO[]>([])
const loading = ref(true)

/** 正在领取的模板 id */
const receivingId = ref('')

/** 领券 */
const onReceive = async (t: AppCouponTemplateVO) => {
  if (receivingId.value) return
  receivingId.value = t.id
  try {
    await receiveCoupon(t.id)
    uni.showToast({title: '领取成功', icon: 'success'})
    await fetchTemplates()
  } catch {
    // 不做处理
  } finally {
    receivingId.value = ''
  }
}

/** 获取优惠券模板列表 */
const fetchTemplates = async () => {
  try {
    const res = await getCouponTemplates()
    templates.value = res.data ?? []
  } finally {
    loading.value = false
  }
}

onShow(() => {
  fetchTemplates()
})
</script>

<template>
  <view class="center">
    <t-navbar title="领券中心" left-arrow placeholder/>

    <view class="center__body">
      <view class="center__notice">领取后请在有效期内使用，逾期作废</view>

      <view v-if="templates.length" class="coupon__list">
        <view
          v-for="t in templates"
          :key="t.id"
          class="tc"
        >
          <!-- 金额区域 -->
          <view class="tc__amt">
            <text class="tc__amt-val">¥{{ t?.amount }}</text>
            <view class="tc__amt-sub">{{ t?.threshold > 0 ? `满 ${t?.threshold} 可用` : '无门槛' }}</view>
          </view>
          <!-- 券信息 -->
          <view class="tc__info">
            <view class="tc__row">
              <text class="tc__name">{{ t?.name }}</text>
              <text class="tc__tip">已领 {{ t?.received }} 张 / 限领 {{ t?.perLimit }} 张</text>
            </view>
            <text class="tc__time">领取后 {{ t?.validDays }} 天内有效</text>
            <view class="tc__row tc__row--foot">
              <text class="tc__tip">剩余 {{ t?.remainCount }} 张</text>
              <text
                v-if="t.canReceive"
                class="tc__btn"
                @tap.stop="onReceive(t)"
              >
                {{ receivingId === t.id ? '领取中...' : '立即领取' }}
              </text>
              <text v-else class="tc__btn tc__btn--disabled">已领取</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="loading" class="center__empty">
        <text class="center__empty-text">加载中…</text>
      </view>

      <view v-else class="center__empty">
        <t-icon name="coupon" size="64rpx" color="#c9d5e2"/>
        <text class="center__empty-text">暂无可领取的优惠券</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.center {
  min-height: 100vh;
  background: #f5f6f8;
}

.center__body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 25rpx 30rpx 40rpx;
}

/* 顶部提示条 */
.center__notice {
  background: #fdf6ec;
  color: #a86a15;
  border-radius: 12rpx;
  padding: 18rpx 25rpx;
  font-size: 24rpx;
  line-height: 1.5;
}

.coupon__list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.tc {
  display: flex;
  background: #fff;
  border-radius: 25rpx;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.tc__amt {
  flex: 0 0 184rpx;
  width: 184rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #409eff, #66b1ff);
  color: #fff;
}

.tc__amt-val {
  font-size: 47rpx;
  font-weight: 600;
  line-height: 1;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.tc__amt-sub {
  font-size: 24rpx;
  opacity: 0.9;
  margin-top: 6rpx;
}

.tc__info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx 25rpx;
}

.tc__row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.tc__name {
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

.tc__tip {
  font-size: 23rpx;
  color: #a8abb2;
}

.tc__time {
  font-size: 24rpx;
  color: #909399;
}

/* 领取按钮 */
.tc__btn {
  margin-left: auto;
  flex: 0 0 auto;
  box-sizing: border-box;
  min-width: 170rpx;
  height: 64rpx;
  line-height: 64rpx;
  padding: 0 28rpx;
  border-radius: 32rpx;
  text-align: center;
  background: #409eff;
  color: #fff;
  font-size: 26rpx;
}

.tc__btn--disabled {
  background: #f5f7fa;
  color: #a8abb2;
  border: 1px solid #e3e8ee;
}

.tc__row--foot {
  margin-top: -26rpx;
  align-items: flex-end;
}

.center__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 140rpx 0;
}

.center__empty-text {
  font-size: 27rpx;
  color: #a8abb2;
}
</style>