<script setup lang="ts">
import {reactive, ref} from 'vue'
import {type AppOrderQuery, type AppOrderVO, getMyOrders, type OrderStatus} from "@/api/order";
import {onReachBottom, onShow} from "@dcloudio/uni-app";
import dayjs from "dayjs";

const TAB_STATUS: Record<string, OrderStatus | undefined> = {
  all: undefined,
  unpaid: 0,
  paid: 1,
  closed: 2,
  refunded: 3,
}

const segOptions = [
  {value: 'all', label: '全部'},
  {value: 'unpaid', label: '未支付'},
  {value: 'paid', label: '已支付'},
  {value: 'closed', label: '已关闭'},
  {value: 'refunded', label: '已退款'},
]

const STATUS_MAP: Record<OrderStatus, { label: string, class: string }> = {
  0: {label: '待支付', class: 'unpaid'},
  1: {label: '已支付', class: 'paid'},
  2: {label: '已关闭', class: 'closed'},
  3: {label: '已退款', class: 'refunded'},
}

const activeTab = ref<string | number>('all')
const orderList = ref<AppOrderVO[]>([])
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

const query = reactive<AppOrderQuery>({
  pageNo: 1,
  pageSize: 10,
  status: undefined,
})


/** 获取订单列表 */
const fetchOrders = async (reset = false) => {
  if (!reset && (loading.value || finished.value)) return
  loading.value = true

  query.pageNo = reset ? 1 : query.pageNo
  query.status = TAB_STATUS[activeTab.value]

  try {
    const res = await getMyOrders(query)
    const data = res.data
    const list = data?.list ?? []
    total.value = Number(data?.total ?? 0)
    orderList.value = reset ? list : orderList.value.concat(list)
    query.pageNo++
    finished.value = list.length < query.pageSize
  } finally {
    loading.value = false
  }
}

const onTabChange = (e: { value: string | number }) => {
  const next = String(e.value)
  if (next === activeTab.value) return
  activeTab.value = next
  orderList.value = []
  query.pageNo = 1
  finished.value = false
  fetchOrders(true)
}

// 格式化时间（卡片信息行用短格式：09-28 21:15）
const fmtTime = (v?: string) =>
  v ? dayjs(String(v).replace(/-/g, '/')).format('MM-DD HH:mm') : ''

// 车牌：粤B12345 → 粤B·12345（后端若已带分隔符就原样返回）
const fmtPlate = (v?: string) => {
  const s = (v ?? '').trim()
  if (s.length < 3) return s
  if (/[·\-\s]/.test(s.charAt(2))) return s
  return `${s.substring(0, 2)}·${s.substring(2)}`
}

// 格式化时长
const fmtDuration = (v?: string) => {
  const s = Number(v)
  if (!Number.isFinite(s) || s <= 0) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} 小时${m} 分钟`
  return m > 0 ? `${m} 分钟` : '不足 1 分钟'
}

// 待支付 / 已关闭看应付，已支付 / 已退款看实付
const moneyOf = (o: AppOrderVO) => {
  const v = [0, 2].includes(o.status) ? o.amount : o.paid
  return Number(v ?? 0).toFixed(2)
}

const footTip = (o: AppOrderVO) => {
  if (o.status === 1) return o.discount > 0 ? `已优惠 ¥${o.discount}` : ''
  if (o.status === 3) return '优惠不随退款返还'
  return ''
}

// 去缴费
const goPay = (o: AppOrderVO) => {
  uni.navigateTo({url: `/pages/pay/index?orderId=${o.id}`})
}

// 开发票（后续开发，先占位）
const goInvoice = (o: AppOrderVO) => {
  uni.showToast({title: '发票功能开发中', icon: 'none'})
}

// 查看详情
const goDetail = (o: AppOrderVO) => {
  uni.navigateTo({url: `/pages/order/detail?orderId=${o.id}`})
}

// 疑问
const goHelp = () => {
  uni.showToast({title: '如有疑问请联系车场', icon: 'none'})
}

onShow(() => {
  fetchOrders(true)
})

onReachBottom(() => {
  fetchOrders()
})
</script>

<template>
  <view class="order">
    <t-navbar title="我的订单" placeholder/>

    <view class="order__body">
      <t-segmented
        t-class="order__seg"
        block
        :options="segOptions"
        :value="activeTab"
        @change="onTabChange"
      />

      <view v-if="orderList.length" class="order__list">
        <view
          v-for="o in orderList"
          :key="o.id"
          class="order__card"
          :class="'is-' + STATUS_MAP[o.status]?.class"
          @click="goDetail(o)"
        >
          <!-- 车场名 + 下单时间 + 状态 -->
          <view class="order__head">
            <text class="order__lot">{{ o.lotName }}</text>
            <text class="order__time">{{ fmtTime(o.createTime) }}</text>
            <text class="order__chip" :class="'order__chip--' + STATUS_MAP[o.status]?.class">
              {{ STATUS_MAP[o.status]?.label }}
            </text>
          </view>

          <!-- 车牌 / 时长 + 右侧金额 -->
          <view class="order__main">
            <view class="order__info">
              <text class="order__line">{{ fmtPlate(o.plateNumber) }}</text>
              <text v-if="o.duration" class="order__line">时长 {{ fmtDuration(o.duration) }}</text>
            </view>
            <text class="order__money" :class="{'is-danger': o.status === 0}">
              ¥ {{ moneyOf(o) }}
            </text>
          </view>

          <!-- 底部操作 -->
          <view class="order__foot">
            <template v-if="o.status === 0">
              <text class="order__btn order__btn--primary" @tap.stop="goPay(o)">立即缴费</text>
              <text class="order__btn" @tap.stop="goHelp">疑问</text>
            </template>
            <template v-else>
              <text v-if="o.status === 1" class="order__link is-primary" @tap.stop="goInvoice(o)">开发票</text>
              <text v-if="footTip(o)" class="order__foot-tip">{{ footTip(o) }}</text>
            </template>
          </view>
        </view>

        <view v-if="loading" class="order__more">加载中…</view>
        <view v-else-if="finished && orderList.length >= query.pageSize" class="order__more">
          没有更多了
        </view>
      </view>

      <view v-else-if="loading" class="order__empty">
        <text class="order__empty-text">加载中…</text>
      </view>

      <view v-else class="order__empty">
        <t-icon name="list" size="64rpx" color="#c9d5e2"/>
        <text class="order__empty-text">暂无相关订单</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.order {
  min-height: 100vh;
  background: #f5f6f8;
}

.order__body {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 25rpx 30rpx 30rpx;
}

:deep(.order__seg) {
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

.order__list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.order__card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(48, 49, 51, 0.04);
}

.order__card.is-unpaid {
  border-color: #f7cccc;
}

.order__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  /* 与下方信息区之间用虚线分隔 */
  padding-bottom: 20rpx;
  border-bottom: 1px dashed #e6e8eb;
}

.order__lot {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
  /* 单行省略：右边还要放时间和状态 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 下单时间：紧跟车场名，灰色小字 */
.order__time {
  flex: 0 0 auto;
  font-size: 24rpx;
  color: #9aa0a6;
}

.order__chip {
  flex: 0 0 auto;
  /* 把状态推到最右 */
  margin-left: auto;
  font-size: 22rpx;
  line-height: 36rpx;
  padding: 0 14rpx;
  border-radius: 8rpx;
  background: #f2f3f5;
  color: #8a9099;
}

.order__chip--unpaid {
  background: #fdecec;
  color: #e34d59;
}

.order__chip--paid {
  background: #e8f5e9;
  color: #3d8b40;
}

.order__chip--closed {
  background: #f2f3f5;
  color: #8a9099;
}

.order__chip--refunded {
  background: #eef3f9;
  color: #5a7fa8;
}

/* 主体：左侧两行信息 + 右侧金额 */
.order__main {
  display: flex;
  /* 金额与左侧最后一行（时长）底端对齐 */
  align-items: flex-end;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 20rpx;
}

.order__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  /* 两行行距压紧，别显得空 */
  gap: 6rpx;
}

.order__line {
  font-size: 24rpx;
  color: #9aa0a6;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order__money {
  flex: 0 0 auto;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.1;
  color: #1a1a1a;
  font-family: 'DIN Alternate', Consolas, sans-serif;
}

.order__money.is-danger {
  color: #e34d59;
}

/* 底部操作行 */
.order__foot {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 24rpx;
}

.order__btn {
  display: block;
  box-sizing: border-box;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 24rpx;
  font-size: 28rpx;
}

/* 主按钮：撑满剩余宽度 */
.order__btn--primary {
  flex: 1;
  min-width: 0;
  background: #1a6cf5;
  color: #fff;
  font-weight: 500;
}

/* 次级按钮：白底描边，固定宽 */
.order__btn:not(.order__btn--primary) {
  flex: 0 0 150rpx;
  background: #fff;
  border: 1px solid #e2e5ea;
  color: #4a4f57;
}

.order__link {
  font-size: 26rpx;
}

/* 开发票：蓝色高亮 */
.order__link.is-primary {
  color: #1a6cf5;
}

/* tip 恒贴最右 */
.order__foot-tip {
  margin-left: auto;
  font-size: 24rpx;
  color: #9aa0a6;
}

/* ---------- 列表状态 ---------- */
.order__more {
  text-align: center;
  font-size: 25rpx;
  color: #a8abb2;
  padding: 10rpx 0 20rpx;
}

.order__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 140rpx 0;
}

.order__empty-text {
  font-size: 27rpx;
  color: #a8abb2;
}
</style>
