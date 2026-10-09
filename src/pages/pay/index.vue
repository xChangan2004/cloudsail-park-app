<script setup lang="ts">
import {computed, ref} from "vue";
import {type AppOrderDetailVO, getMyOrderDetail} from "@/api/order";
import {type AppCouponVO, getUsableCoupons} from "@/api/coupon";
import {onLoad} from "@dcloudio/uni-app";
import CouponSelect from "@/pages/pay/components/CouponSelect.vue";
import {createPayForm} from "@/api/pay";

const orderId = ref('')
const order = ref<AppOrderDetailVO>()
const loading = ref(true)
const paying = ref(false)

const coupons = ref<AppCouponVO[]>([])
const couponId = ref('')

const selectedCoupon = computed(() => coupons.value.find(c => c.id === couponId.value))
const couponAmount = computed(() => selectedCoupon.value?.amount ?? 0)

/** 实付 */
const payable = computed(() => {
  const base = order.value?.amount ?? 0
  return Math.max(base - couponAmount.value, 0)
})

/** 初始化收银台数据 */
const init = async () => {
  if (!orderId.value) {
    loading.value = false
    return
  }
  try {
    const res = await getMyOrderDetail(orderId.value)
    const detail = res.data
    order.value = detail
    if (!detail || detail.status !== 0) return

    const couponRes = await getUsableCoupons(detail.amount, orderId.value)
    coupons.value = couponRes.data ?? []
    // 优先回显本单上一次锁定的券，没有就默认选最优那张
    const locked = coupons.value.find(c => c.status === 1)
    couponId.value = (locked ?? coupons.value[0])?.id
  } catch {
    // 不做处理
  } finally {
    loading.value = false
  }
}

const onCouponSelect = (id: string) => {
  couponId.value = id
}

const onPay = async () => {
  // #ifdef APP-PLUS
  if (paying.value || order.value?.status !== 0) return
  paying.value = true
  try {
    const res = await createPayForm(orderId.value, couponId.value)
    await new Promise<void>((resolve, reject) => {
      uni.requestPayment({
        provider: 'alipay',
        orderInfo: res.data,
        success: () => resolve(),
        fail: (err) => {
          const msg = (err as { errMsg?: string })?.errMsg ?? ''
          reject(new Error(/cancel|取消/i.test(msg) ? '支付已取消' : '支付失败，请重试'))
        }
      })
    })
    await new Promise((r) => setTimeout(r, 800))
    uni.redirectTo({url: `/pages/order/detail?orderId=${orderId.value}`})
  } catch (e) {
    uni.showToast({title: (e as Error).message, icon: 'none'})
  } finally {
    paying.value = false
  }
  // #endif

  // #ifndef APP-PLUS
  uni.showModal({
    title: '暂不支持',
    content: '请在「云帆智泊」App 内完成支付。',
    showCancel: false
  })
  return
  // #endif
}

// #ifdef APP-PLUS
/**
 * 支付宝 App SDK 默认走生产环境，拿沙箱订单去支付会报 ALIN10146
 * 「商家订单参数异常，请重新发起付款」。uni.requestPayment 没有暴露 env 开关，
 * 只能反射原生 EnvUtils 切换。
 *
 * 开关：仅当 VITE_ALIPAY_SANDBOX === 'true' 时才切沙箱。
 *   - 「运行到手机」（development）读 .env.development ⇒ true，走沙箱
 *   - 「云打包」（production）不配该变量 ⇒ undefined，保持正式环境
 * 因此正式包天然不受影响，不需要上线前手动删代码。
 */
const setupAlipayEnv = () => {
  if (import.meta.env.VITE_ALIPAY_SANDBOX !== 'true') return
  const plusObj = (globalThis as any).plus
  if (!plusObj?.android) return           // 官方只提供 Android 沙箱客户端
  try {
    const EnvUtils = plusObj.android.importClass('com.alipay.sdk.app.EnvUtils')
    const EnvEnum = plusObj.android.importClass('com.alipay.sdk.app.EnvUtils$EnvEnum')
    EnvUtils.setEnv(EnvEnum.SANDBOX)
  } catch (e) {
    console.warn('切换支付宝沙箱环境失败，请确认基座已打包支付宝模块', e)
  }
}
// #endif

// 格式化时长
const fmtDuration = (v?: string) => {
  const s = Number(v)
  if (!Number.isFinite(s) || s <= 0) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}小时 ${m}分钟`
  return m > 0 ? `${m} 分钟` : '不足 1 分钟'
}

onLoad((query) => {
  // #ifdef APP-PLUS
  setupAlipayEnv()
  // #endif
  orderId.value = query?.orderId ?? ''
  init()
})
</script>

<template>
  <view class="pay">
    <t-navbar title="收银台" left-arrow placeholder/>

    <view class="pay__body">
      <!-- 订单金额 -->
      <view class="hero">
        <view class="hero__label">订单金额</view>
        <view class="hero__num">¥{{ order?.amount?.toFixed(2) }}</view>
        <view class="hero__sub">
          {{ order?.plateNumber?.substring(0, 2) }}·{{ order?.plateNumber?.substring(2) }}
          -
          {{ order?.lotName }}
        </view>
      </view>

      <view class="card">
        <view class="row">
          <text class="row__k">停车时长</text>
          <text class="row__v">{{ fmtDuration(order?.duration) }}</text>
        </view>

        <view class="hr"></view>

        <view class="row">
          <text class="row__k">应收金额</text>
          <text class="row__v">¥{{ order?.amount?.toFixed(2) }}</text>
        </view>
        <view v-if="couponAmount > 0" class="row row--gap">
          <text class="row__k">优惠抵扣</text>
          <text class="row__v row__v--green">-¥{{ couponAmount.toFixed(2) }}</text>
        </view>

        <view class="dash"></view>

        <view class="row">
          <view class="row__t">实付金额</view>
          <view class="row__money">¥{{ payable?.toFixed(2) }}</view>
        </view>
      </view>

      <!-- 优惠券 -->
      <view class="card">
        <CouponSelect
          :coupon-id="couponId"
          :coupons="coupons"
          :amount="order?.amount ?? 0"
          @select="onCouponSelect"
        />
      </view>

      <!-- 支付方式 -->
      <view class="card">
        <view class="row">
          <text class="row__k">支付方式</text>
          <text class="row__v">支付宝</text>
        </view>
        <view class="card__tip">点击支付后将打开支付宝</view>
      </view>

      <view v-if="order && order?.status === 0" class="bar">
        <t-button
          t-class="bar__btn"
          size="medium"
          block
          theme="primary"
          :loading="paying"
          @click="onPay"
        >立即支付 ¥{{ payable.toFixed(2) }}
        </t-button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.pay {
  min-height: 100vh;
  background: #f5f6f8;
}

.pay__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx;
  padding-bottom: calc(178rpx + env(safe-area-inset-bottom));
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 35rpx 0 20rpx;
  text-align: center;
}

.hero__label {
  font-size: 26rpx;
  line-height: 1.45;
  color: #909399;
}

.hero__num {
  margin-top: 5rpx;
  font-size: 79rpx;
  font-weight: 600;
  line-height: 1.1;
  color: #303133;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.hero__sub {
  margin-top: 10rpx;
  font-size: 28rpx;
  line-height: 1.5;
  color: #a8abb2;
}

.card {
  padding: 25rpx 30rpx;
  background: #fff;
  border-radius: 25rpx;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.row--gap {
  margin-top: 12rpx;
}

.row__k {
  flex: 0 0 auto;
  font-size: 26rpx;
  line-height: 1.45;
  color: #909399;
}

.row__v {
  flex: 1;
  min-width: 0;
  font-size: 29rpx;
  font-weight: 500;
  color: #303133;
  text-align: right;
}

.row__v--green {
  color: #67c23a;
}

.row__t {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
}

.row__money {
  flex: 0 0 auto;
  font-size: 37rpx;
  font-weight: 600;
  line-height: 1.1;
  color: #f56c6c;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.hr {
  height: 1px;
  margin: 20rpx -30rpx;
  background: #ebeef5;
}

.dash {
  margin: 20rpx -30rpx;
  border-top: 1px dashed #e3e8ee;
}

.card__tip {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.5;
  color: #a8abb2;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 25rpx 30rpx;
  background: #fff;
  padding-bottom: calc(25rpx + env(safe-area-inset-bottom));
  --td-button-border-radius: 47rpx;
  --td-button-medium-height: 88rpx;
  --td-button-primary-bg-color: #409eff;
  --td-button-primary-border-color: #409eff;
  --td-button-primary-active-bg-color: #2b7cd3;
  --td-button-primary-active-border-color: #2b7cd3;
}
</style>