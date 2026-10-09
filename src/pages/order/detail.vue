<script setup lang="ts">
import {computed, ref} from 'vue'
import {type AppOrderDetailVO, getMyOrderDetail, type OrderStatus} from "@/api/order";
import dayjs from "dayjs";
import {onLoad, onShow} from "@dcloudio/uni-app";

/** 订单状态映射 */
const STATUS_MAP: Record<OrderStatus, { label: string; class: string }> = {
  0: {label: '待支付', class: 'unpaid'},
  1: {label: '已支付', class: 'paid'},
  2: {label: '已关闭', class: 'closed'},
  3: {label: '已退款', class: 'refunded'}
}

/** 状态说明卡的标题 */
const NOTE_TITLE: Record<OrderStatus, string> = {
  0: '支付说明',
  1: '退款说明',
  2: '关闭说明',
  3: '退款进度'
}

const orderId = ref('')
const loading = ref(true)
const detail = ref<AppOrderDetailVO>()

const fetchOrderDetail = async () => {
  if (!orderId.value) {
    loading.value = false
    return
  }
  try {
    const res = await getMyOrderDetail(orderId.value)
    detail.value = res.data
  } catch {
    // 不做处理
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  orderId.value = query?.orderId ?? ''
})

onShow(() => {
  fetchOrderDetail()
})

const banner = computed(() => {
  const d = detail.value
  if (!d) return {label: '', class: 'closed', num: '', sub: ''}
  const s = d.status
  const raw = s === 1 ? d.paidTime : s === 3 ? d.refundTime : d.createTime
  const time = raw
    ? dayjs(String(raw).replace(/-/g, '/')).format('YYYY-MM-DD HH:mm:ss')
    : ''
  const suffix = s === 1 ? '支付成功' : s === 3 ? '退款成功' : '生成账单'
  return {
    label: STATUS_MAP[s].label,
    class: STATUS_MAP[s].class,
    num: (s === 0 || s === 2 ? d.amount : d.paid)?.toFixed(2),
    sub: time ? `${time} ${suffix}` : suffix
  }
})

const goPay = () => {
  uni.navigateTo({url: `/pages/pay/index?orderId=${orderId.value}`})
}
</script>

<template>
  <view class="detail">
    <t-navbar title="订单详情" left-arrow placeholder/>

    <view v-if="detail" class="detail__body">
      <view class="banner" :class="'banner--' + banner.class">
        <view class="banner__label">{{ banner.label }}</view>
        <view class="banner__num">¥{{ banner.num }}</view>
        <view class="banner__sub">{{ banner.sub }}</view>
      </view>

      <!-- 订单信息 -->
      <view class="card">
        <view class="row">
          <view class="row__k">订单编号</view>
          <view class="row__v row__v--no">{{ detail?.orderNo }}</view>
        </view>
        <view class="row">
          <view class="row__k">停车场</view>
          <view class="row__v">{{ detail?.lotName }}</view>
        </view>
        <view class="row">
          <view class="row__k">车牌号码</view>
          <view class="row__v">{{ detail?.plateNumber?.substring(0, 2) }}·{{ detail?.plateNumber?.substring(2) }}</view>
        </view>
        <view class="row">
          <text class="row__k">下单时间</text>
          <text class="row__v">{{ detail?.createTime }}</text>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="card">
        <view class="card__t">费用明细</view>
        <view class="row">
          <text class="row__k">应收金额</text>
          <text class="row__v">¥{{ detail?.amount?.toFixed(2) }}</text>
        </view>
        <view class="row" v-if="detail?.discount > 0">
          <text class="row__k">优惠抵扣</text>
          <text class="row__v row__v--cut">-¥{{ detail?.discount?.toFixed(2) }}</text>
        </view>

        <template v-if="detail?.status !== 2">
          <view class="dash"></view>
          <view class="row">
            <text class="row__t">{{ detail?.status === 0 ? '应付金额' : '实付金额' }}</text>
            <text class="row__money" :class="{'is-warn': detail?.status === 0}">
              ¥{{ (detail?.status === 0 ? detail?.amount : detail?.paid)?.toFixed(2) }}
            </text>
          </view>
        </template>

        <text v-if="detail?.status === 0" class="tip">尚未支付。</text>
        <text v-else-if="detail?.status === 2" class="tip">订单已关闭，未发生支付，无需付款。</text>
        <text v-else-if="detail?.discount > 0" class="tip">
          已使用优惠券「{{ detail?.couponName }}」，
          <text class="tip__strong">优惠不随退款返还</text>
          。
        </text>
      </view>

      <view class="card">
        <view class="row">
          <text class="row__t">{{ NOTE_TITLE[detail?.status] }}</text>
          <text v-if="detail?.status === 3" class="chip">已退款</text>
        </view>
        <text v-if="detail?.status === 0" class="tip">
          当前账单由出场后自动生成，
          <text class="tip__strong">不会自动关闭</text>
          。请及时缴纳，否则再次入场时会受到限制。
        </text>
        <text v-else-if="detail?.status === 1" class="tip">
          对订单有存疑？如需退款，请
          <text class="tip__strong">联系车场</text>
          协助处理。退款成功后，订单状态会更新为「已退款」。
        </text>
        <text v-else-if="detail?.status === 2" class="tip">
          该订单已作废，
          <text class="tip__strong">无需支付</text>
          。如对关单原因有疑问，请联系车场。
        </text>
        <text v-else class="tip">
          退款已成功受理，预计 1–3 个工作日将原路退回原支付账户。
        </text>
      </view>

      <!-- 操作栏 -->
      <view class="bar">
        <view class="bar__cell is-gray">
          <t-button t-class="bar__btn" size="medium" block>
            联系车场
          </t-button>
        </view>

        <view v-if="detail?.status === 0" class="bar__cell is-pri">
          <t-button t-class="bar__btn" size="medium" block theme="primary" @click="goPay">
            去支付
          </t-button>
        </view>

        <view v-else class="bar__cell is-ghost">
          <t-button t-class="bar__btn" size="medium" block theme="primary" variant="outline">
            查看停车记录
          </t-button>
        </view>
      </view>
    </view>

    <view v-else class="detail__empty">{{ loading ? '加载中…' : '订单不存在或已失效' }}</view>
  </view>
</template>

<style scoped lang="scss">
.detail {
  min-height: 100vh;
  background: #f5f6f8;
}

.detail__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx;
  padding-bottom: calc(132rpx + 64rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(132rpx + 64rpx + env(safe-area-inset-bottom));
}

.banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56rpx 35rpx;
  border-radius: 24rpx;
  text-align: center;
}

.banner__label {
  font-size: 30rpx;
  font-weight: 600;
}

.banner__num {
  margin-top: 6rpx;
  font-size: 64rpx;
  font-weight: 600;
  line-height: 1.1;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.banner__sub {
  margin-top: 8rpx;
  font-size: 25rpx;
}

.banner--unpaid {
  background: #fdf6ec;
}

.banner--unpaid .banner__label,
.banner--unpaid .banner__num {
  color: #9a5f10;
}

.banner--unpaid .banner__sub {
  color: #8a5410;
}

.banner--paid {
  background: #f0f9eb;
}

.banner--paid .banner__label,
.banner--paid .banner__num {
  color: #3f7a1f;
}

.banner--paid .banner__sub {
  color: #3a701c;
}

.banner--closed {
  background: #f5f7fa;
}

.banner--closed .banner__label,
.banner--closed .banner__num,
.banner--closed .banner__sub {
  color: #606266;
}

.banner--refunded {
  background: #fef0f0;
}

.banner--refunded .banner__label,
.banner--refunded .banner__num {
  color: #c04343;
}

.banner--refunded .banner__sub {
  color: #b03a3a;
}

.card {
  padding: 28rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.card__t {
  display: block;
  margin-bottom: 18rpx;
  font-size: 29rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.row + .row {
  margin-top: 20rpx;
}

.row__k {
  flex: 0 0 auto;
  font-size: 26rpx;
  color: #9aa0a6;
}

.row__t {
  font-size: 29rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.row__v {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;
  text-align: right;
}

.row__v--no {
  font-size: 24rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row__v--cut {
  color: #67c23a;
}

.row__money {
  flex: 0 0 auto;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.2;
  color: #1a1a1a;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.row__money.is-warn {
  color: #9a5f10;
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
  margin-left: auto;
  font-size: 22rpx;
  line-height: 34rpx;
  padding: 0 12rpx;
  border-radius: 8rpx;
  background: #fef0f0;
  color: #c04343;
}

.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: 22rpx;
  padding: 22rpx 30rpx;
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding-bottom: calc(22rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(22rpx + env(safe-area-inset-bottom));
  --td-button-border-radius: 44rpx;
  --td-button-medium-height: 88rpx;
}

.bar__cell {
  flex: 1;
  min-width: 0;
}

.bar__cell.is-gray {
  flex: 0 0 240rpx;
  --td-button-default-bg-color: #f5f7fa;
  --td-button-default-border-color: #e3e8ee;
  --td-button-default-color: #606266;
  --td-button-default-active-bg-color: #eaeef4;
  --td-button-default-active-border-color: #e3e8ee;
}

.bar__cell.is-pri {
  --td-button-primary-bg-color: #409eff;
  --td-button-primary-border-color: #409eff;
  --td-button-primary-active-bg-color: #2b7cd3;
  --td-button-primary-active-border-color: #2b7cd3;
}

.bar__cell.is-ghost {
  --td-button-primary-outline-color: #409eff;
  --td-button-primary-outline-border-color: #409eff;
  --td-button-primary-outline-active-bg-color: #ecf5ff;
  --td-button-primary-outline-active-border-color: #2b7cd3;
}

.detail__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  font-size: 26rpx;
  color: #9aa0a6;
}
</style>